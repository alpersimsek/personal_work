import {
  chmodSync, closeSync, constants, existsSync, lstatSync, mkdirSync, openSync, readdirSync, realpathSync,
  renameSync, truncateSync, unlinkSync, writeFileSync, writeSync,
} from 'node:fs';
import path from 'node:path';
import { uploadsDirectory } from '../storage/blogImages.js';
import { defaultStaticDirectory } from '../storage/staticRoot.js';

const MEGABYTE = 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;
const EVENT_NAME = /^[a-z0-9_]{1,64}$/;
const FIELD_NAME = /^[A-Za-z0-9_]+$/;
const MAX_FIELD_NAME_LENGTH = 64;
const MAX_FIELDS = 16;
const MAX_PENDING = 32;
const LOG_FILE = /^log_\d{2}_\d{2}_\d{2}_\d{2}(_\d+)?\.log$/;
const RESERVED_FIELDS = new Set(['ts', 'event', 'count']);
const MAX_VALUE_LENGTH = 120;

/** A field value the error log accepts; everything else is dropped. */
export type ErrorLogValue = string | number | boolean;
export type ErrorLogFields = Record<string, ErrorLogValue>;

export interface ErrorLogOptions {
  /** Directory that receives the log files; created with mode 0o700. */
  dir: string;
  now?: () => Date;
  maxBytes?: number;
  maxFiles?: number;
  maxAgeMs?: number;
  aggregateWindowMs?: number;
  /** Also print the sanitized event as JSON with `console.error`. Defaults to true. */
  echo?: boolean;
  /** When false nothing is written to disk. Defaults to true. */
  enabled?: boolean;
  /** Replaces `appendFileSync`; lets tests simulate a failing disk. */
  appendFile?: (file: string, data: string, options: { mode: number }) => void;
}

export interface ErrorLog {
  /** Records an error event. Never throws. */
  logError(event: string, fields?: ErrorLogFields): void;
  /** Synchronously writes the pending aggregate, if any. Never throws. */
  flush(): void;
}

interface Pending {
  event: string;
  fields: ErrorLogFields;
  startedAt: Date;
  count: number;
}

interface LogFile {
  name: string;
  size: number;
  modified: number;
}

function sanitizeEvent(event: unknown): string {
  return typeof event === 'string' && EVENT_NAME.test(event) ? event : 'invalid_event';
}

function sanitizeValue(value: unknown): ErrorLogValue | undefined {
  if (typeof value === 'string') {
    if (value.includes('@') || /[\r\n\u2028\u2029]/.test(value)) return '[redacted]';
    return value.slice(0, MAX_VALUE_LENGTH);
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  return typeof value === 'boolean' ? value : undefined;
}

function sanitizeFields(fields: unknown): ErrorLogFields {
  const clean: ErrorLogFields = {};
  if (typeof fields !== 'object' || fields === null) return clean;
  for (const [rawKey, value] of Object.entries(fields)) {
    if (Object.keys(clean).length >= MAX_FIELDS) break;
    if (!FIELD_NAME.test(rawKey)) continue;
    const key = rawKey.slice(0, MAX_FIELD_NAME_LENGTH);
    if (RESERVED_FIELDS.has(key)) continue;
    const safe = sanitizeValue(value);
    if (safe !== undefined) clean[key] = safe;
  }
  return clean;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}

/** `log_DD_MM_HH_SS`: day, month, hour and seconds (not minutes), local time. */
function baseName(date: Date): string {
  return `log_${two(date.getDate())}_${two(date.getMonth() + 1)}_${two(date.getHours())}_${two(date.getSeconds())}`;
}

/** Appends without following a symlink at `file`, creating it with `mode` if needed. */
function appendWithoutFollowing(file: string, data: string, options: { mode: number }): void {
  const flags = constants.O_APPEND | constants.O_CREAT | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0);
  const descriptor = openSync(file, flags, options.mode);
  try {
    const buffer = Buffer.from(data);
    for (let written = 0; written < buffer.length;) written += writeSync(descriptor, buffer, written);
  } finally {
    closeSync(descriptor);
  }
}

function errorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : 'UNKNOWN';
}

/**
 * Builds an errors-only file logger. It stores event names and primitive
 * fields only, so messages, addresses, SQL and stack traces cannot reach disk.
 */
export function createErrorLog(options: ErrorLogOptions): ErrorLog {
  const now = options.now ?? (() => new Date());
  const maxBytes = options.maxBytes ?? 3 * MEGABYTE;
  const maxFiles = options.maxFiles ?? 20;
  const maxAgeMs = options.maxAgeMs ?? 7 * DAY_MS;
  const windowMs = options.aggregateWindowMs ?? 60_000;
  const echo = options.echo ?? true;
  const enabled = options.enabled ?? true;
  const append = options.appendFile ?? appendWithoutFollowing;

  const pending = new Map<string, Pending>();
  let timer: NodeJS.Timeout | null = null;
  let activeFile: string | null = null;
  let activeSize = 0;
  let failing = false;
  let needsNewline = false;
  let directoryReady = false;
  let disabled = !enabled;

  function disable(reason: string): void {
    disabled = true;
    try { console.error(`error log disabled: ${reason}`); } catch { /* nothing more to do */ }
  }

  function entryNames(): string[] {
    try { return readdirSync(options.dir); } catch { return []; }
  }

  /** Regular files only: symlinks and directories are never touched. */
  function listFiles(names: string[]): LogFile[] {
    const files: LogFile[] = [];
    for (const name of names.filter(entry => LOG_FILE.test(entry))) {
      try {
        const stats = lstatSync(path.join(options.dir, name));
        if (stats.isFile()) files.push({ name, size: stats.size, modified: stats.mtimeMs });
      } catch { /* vanished between listing and stat */ }
    }
    return files.sort((a, b) => a.modified - b.modified || a.name.localeCompare(b.name));
  }

  function prepareDirectory(): void {
    mkdirSync(options.dir, { recursive: true, mode: 0o700 });
    if (directoryReady) return;
    directoryReady = true;
    const stats = lstatSync(options.dir);
    const foreign = typeof process.getuid === 'function' && stats.uid !== process.getuid();
    if (!stats.isDirectory() || foreign || (stats.mode & 0o022) !== 0) {
      disable('log directory must be owned by the service user and not group or other writable');
      return;
    }
    try { chmodSync(options.dir, 0o700); } catch { /* keep going */ }
  }

  function activeIsRegularFile(): boolean {
    try { return lstatSync(activeFile!).isFile(); } catch { return false; }
  }

  function uniqueName(taken: Set<string>): string {
    const base = baseName(now());
    let name = `${base}.log`;
    for (let suffix = 2; taken.has(name); suffix += 1) name = `${base}_${suffix}.log`;
    return name;
  }

  /**
   * Starts a new file. The oldest other file is reused (truncated and renamed)
   * when the cap is reached or it is old enough; the file being written never is.
   */
  function roll(): void {
    // An empty active file is already a fresh start; never burn another one.
    if (activeFile && activeSize === 0 && activeIsRegularFile()) return;
    const names = entryNames();
    const files = listFiles(names);
    const activeName = activeFile ? path.basename(activeFile) : null;
    while (files.length > maxFiles) {
      const extra = files.find(file => file.name !== activeName) ?? files[0];
      files.splice(files.indexOf(extra), 1);
      unlinkSync(path.join(options.dir, extra.name));
    }
    const candidates = files.filter(file => file.name !== activeName);
    const oldest = candidates[0] ?? (files.length >= maxFiles ? files[0] : undefined);
    const reuse = oldest !== undefined &&
      (files.length >= maxFiles || now().getTime() - oldest.modified >= maxAgeMs);
    const target = path.join(options.dir, uniqueName(new Set(names)));
    if (reuse) {
      renameSync(path.join(options.dir, oldest.name), target);
      truncateSync(target, 0);
      try { chmodSync(target, 0o600); } catch { /* not the owner: keep going */ }
    } else {
      writeFileSync(target, '', { mode: 0o600, flag: 'wx' });
    }
    activeFile = target;
    activeSize = 0;
  }

  /** Picks the newest file if it still has room, otherwise rolls. */
  function selectActive(): void {
    const newest = listFiles(entryNames()).at(-1);
    if (newest && newest.size < maxBytes) {
      activeFile = path.join(options.dir, newest.name);
      activeSize = newest.size;
    } else {
      roll();
    }
  }

  function write(line: string): void {
    if (disabled) return;
    try {
      prepareDirectory();
      if (disabled) return;
      if (activeFile && !activeIsRegularFile()) activeFile = null;
      if (!activeFile) selectActive();
      const lead = needsNewline ? '\n' : '';
      const bytes = Buffer.byteLength(lead + line);
      if (bytes > maxBytes) return;
      if (activeSize + bytes > maxBytes) { roll(); }
      try {
        append(activeFile!, lead + line, { mode: 0o600 });
      } catch (error) {
        // A partial line may be on disk: start the next write on a new line.
        needsNewline = true;
        throw error;
      }
      needsNewline = false;
      activeSize += bytes;
      failing = false;
    } catch (error) {
      if (!failing) {
        failing = true;
        try { console.error(`error log write failed: ${errorCode(error)}`); } catch { /* nothing more to do */ }
      }
    }
  }

  function writeEntry(entry: Pending): void {
    try {
      const ts = entry.startedAt.toISOString();
      let line = `${JSON.stringify({ ts, event: entry.event, ...entry.fields, count: entry.count })}\n`;
      if (Buffer.byteLength(line) > maxBytes) {
        line = `${JSON.stringify({ ts, event: entry.event, truncated: true })}\n`;
      }
      if (echo && entry.count > 1) {
        console.error(JSON.stringify({ event: entry.event, ...entry.fields, count: entry.count }));
      }
      write(line);
    } catch { /* the logger must never throw */ }
  }

  function flush(): void {
    if (timer) { clearTimeout(timer); timer = null; }
    const entries = [...pending.values()];
    pending.clear();
    for (const entry of entries) writeEntry(entry);
  }

  function flushOldest(): void {
    const [key, entry] = pending.entries().next().value!;
    pending.delete(key);
    writeEntry(entry);
  }

  function logError(event: string, fields?: ErrorLogFields): void {
    try {
      const name = sanitizeEvent(event);
      const clean = sanitizeFields(fields);
      const key = JSON.stringify([name, Object.entries(clean).sort(([a], [b]) => a.localeCompare(b))]);
      const current = now();
      const oldest = pending.values().next().value;
      if (oldest && current.getTime() - oldest.startedAt.getTime() >= windowMs) flush();
      const existing = pending.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }
      if (echo) console.error(JSON.stringify({ event: name, ...clean }));
      if (pending.size >= MAX_PENDING) flushOldest();
      pending.set(key, { event: name, fields: clean, startedAt: current, count: 1 });
      if (!timer) {
        timer = setTimeout(flush, windowMs);
        timer.unref();
      }
    } catch { /* the logger must never throw */ }
  }

  return { logError, flush };
}

/** Directories the Express app serves, which must never hold logs. */
function webRoots(): string[] {
  let uploads: string;
  try { uploads = uploadsDirectory(); } catch { uploads = path.resolve(process.env.UPLOADS_DIR || 'uploads'); }
  return [defaultStaticDirectory(), uploads, path.resolve('dist'), path.resolve('public')];
}

/** Real path of `target`, using its nearest existing ancestor when it does not exist yet. */
function realPathOf(target: string): string {
  let existing = path.resolve(target);
  const rest: string[] = [];
  while (!existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) break;
    rest.unshift(path.basename(existing));
    existing = parent;
  }
  let real = existing;
  try { real = realpathSync(existing); } catch { /* keep the unresolved path */ }
  return path.join(real, ...rest);
}

/** Windows and the /mnt/<drive> mounts of WSL ignore letter case in paths. */
function foldCase(value: string): string {
  return process.platform === 'win32' || /^\/mnt\/[a-z]\//i.test(value) ? value.toLowerCase() : value;
}

/** True when `directory` is, or is inside, a directory served to the web (real paths compared). */
export function isInsideWebRoot(directory: string, roots: string[] = webRoots()): boolean {
  const resolved = foldCase(realPathOf(directory));
  return roots.some(root => {
    const relative = path.relative(foldCase(realPathOf(root)), resolved);
    return relative === '' ||
      (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  });
}

/** `ERROR_LOG_DIR`, or `<cwd>/logs`. */
export function defaultErrorLogDirectory(): string {
  return process.env.ERROR_LOG_DIR || path.join(process.cwd(), 'logs');
}

let shared: ErrorLog | null = null;
let exitHookInstalled = false;
let testDirectory: string | null = null;

/**
 * Test-only: points the shared log at a directory. Under NODE_ENV=test the
 * shared log ignores ERROR_LOG_DIR so a developer's .env cannot redirect it.
 */
export function setErrorLogDirectoryForTests(directory: string | null): void {
  shared?.flush();
  shared = null;
  testDirectory = directory;
}

function sharedLog(): ErrorLog {
  if (shared) return shared;
  const underTest = process.env.NODE_ENV === 'test';
  const dir = underTest ? testDirectory ?? '' : defaultErrorLogDirectory();
  let enabled = dir !== '';
  if (!enabled && !process.env.NODE_TEST_CONTEXT) {
    console.error('error log disabled: NODE_ENV=test outside a test runner');
  } else if (enabled && isInsideWebRoot(dir)) {
    enabled = false;
    console.error('error log disabled: log directory is inside a web-served directory');
  }
  shared = createErrorLog({ dir, enabled });
  if (!exitHookInstalled) {
    exitHookInstalled = true;
    process.once('exit', () => shared?.flush());
  }
  return shared;
}

/** Creates the shared log now so a disabled log is reported at startup, not at the first error. */
export function initErrorLog(): void {
  try { sharedLog(); } catch { /* never throw */ }
}

/** Records an error event in the shared log; see {@link createErrorLog}. */
export function logError(event: string, fields?: ErrorLogFields): void {
  try { sharedLog().logError(event, fields); } catch { /* never throw */ }
}

/** Writes the shared log's pending aggregate synchronously. */
export function flushErrorLog(): void {
  try { sharedLog().flush(); } catch { /* never throw */ }
}
