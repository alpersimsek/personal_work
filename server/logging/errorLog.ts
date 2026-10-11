import {
  appendFileSync, mkdirSync, readdirSync, renameSync, statSync, truncateSync, unlinkSync, writeFileSync,
} from 'node:fs';
import path from 'node:path';

const MEGABYTE = 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;
const EVENT_NAME = /^[a-z0-9_]{1,64}$/;
const FIELD_NAME = /^[A-Za-z0-9_]{1,64}$/;
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
}

export interface ErrorLog {
  /** Records an error event. Never throws. */
  logError(event: string, fields?: ErrorLogFields): void;
  /** Synchronously writes the pending aggregate, if any. Never throws. */
  flush(): void;
}

interface Pending {
  key: string;
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
  for (const [key, value] of Object.entries(fields)) {
    if (!FIELD_NAME.test(key) || RESERVED_FIELDS.has(key)) continue;
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

  let pending: Pending | null = null;
  let timer: NodeJS.Timeout | null = null;
  let activeFile: string | null = null;
  let activeSize = 0;
  let failing = false;

  function listFiles(): LogFile[] {
    let names: string[];
    try { names = readdirSync(options.dir).filter(name => LOG_FILE.test(name)); } catch { return []; }
    const files: LogFile[] = [];
    for (const name of names) {
      try {
        const stats = statSync(path.join(options.dir, name));
        if (stats.isFile()) files.push({ name, size: stats.size, modified: stats.mtimeMs });
      } catch { /* vanished between listing and stat */ }
    }
    return files.sort((a, b) => a.modified - b.modified || a.name.localeCompare(b.name));
  }

  function uniqueName(taken: Set<string>): string {
    const base = baseName(now());
    let name = `${base}.log`;
    for (let suffix = 2; taken.has(name); suffix += 1) name = `${base}_${suffix}.log`;
    return name;
  }

  /** Starts a new file, reusing the oldest one when the age or count rule says so. */
  function roll(): void {
    const files = listFiles();
    while (files.length > maxFiles) unlinkSync(path.join(options.dir, files.shift()!.name));
    const taken = new Set(files.map(file => file.name));
    const target = path.join(options.dir, uniqueName(taken));
    const oldest = files[0];
    const reuse = oldest && (files.length >= maxFiles || now().getTime() - oldest.modified >= maxAgeMs);
    if (reuse) {
      renameSync(path.join(options.dir, oldest.name), target);
      truncateSync(target, 0);
    } else {
      writeFileSync(target, '', { mode: 0o600, flag: 'wx' });
    }
    activeFile = target;
    activeSize = 0;
  }

  /** Picks the newest file if it still has room, otherwise rolls. */
  function selectActive(): void {
    const newest = listFiles().at(-1);
    if (newest && newest.size < maxBytes) {
      activeFile = path.join(options.dir, newest.name);
      activeSize = newest.size;
    } else {
      roll();
    }
  }

  function write(line: string): void {
    if (!enabled) return;
    try {
      mkdirSync(options.dir, { recursive: true, mode: 0o700 });
      const bytes = Buffer.byteLength(line);
      if (!activeFile) selectActive();
      if (activeSize > 0 && activeSize + bytes > maxBytes) roll();
      appendFileSync(activeFile!, line, { mode: 0o600 });
      activeSize += bytes;
      failing = false;
    } catch (error) {
      activeFile = null;
      if (!failing) {
        failing = true;
        try { console.error(`error log write failed: ${errorCode(error)}`); } catch { /* nothing more to do */ }
      }
    }
  }

  function flush(): void {
    if (timer) { clearTimeout(timer); timer = null; }
    const entry = pending;
    pending = null;
    if (!entry) return;
    try {
      write(`${JSON.stringify({
        ts: entry.startedAt.toISOString(), event: entry.event, ...entry.fields, count: entry.count,
      })}\n`);
    } catch { /* the logger must never throw */ }
  }

  function logError(event: string, fields?: ErrorLogFields): void {
    try {
      const name = sanitizeEvent(event);
      const clean = sanitizeFields(fields);
      if (echo) console.error(JSON.stringify({ event: name, ...clean }));
      const key = JSON.stringify([name, Object.entries(clean).sort(([a], [b]) => a.localeCompare(b))]);
      const current = now();
      if (pending && pending.key === key && current.getTime() - pending.startedAt.getTime() < windowMs) {
        pending.count += 1;
        return;
      }
      flush();
      pending = { key, event: name, fields: clean, startedAt: current, count: 1 };
      timer = setTimeout(flush, windowMs);
      timer.unref();
    } catch { /* the logger must never throw */ }
  }

  return { logError, flush };
}

/** Directories the Express app serves, which must never hold logs. */
function webRoots(): string[] {
  return ['dist', 'public', process.env.UPLOADS_DIR || 'uploads'].map(entry => path.resolve(entry));
}

/** True when `directory` is, or is inside, a directory served to the web. */
export function isInsideWebRoot(directory: string): boolean {
  const resolved = path.resolve(directory);
  return webRoots().some(root => {
    const relative = path.relative(root, resolved);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });
}

/** `ERROR_LOG_DIR`, or `<cwd>/logs`. */
export function defaultErrorLogDirectory(): string {
  return process.env.ERROR_LOG_DIR || path.join(process.cwd(), 'logs');
}

let shared: ErrorLog | null = null;

function sharedLog(): ErrorLog {
  if (shared) return shared;
  const dir = defaultErrorLogDirectory();
  const insideTests = process.env.NODE_ENV === 'test' && !process.env.ERROR_LOG_DIR;
  const exposed = isInsideWebRoot(dir);
  if (exposed) console.error('error log disabled: ERROR_LOG_DIR is inside a web-served directory');
  shared = createErrorLog({ dir, enabled: !insideTests && !exposed });
  process.once('exit', () => shared?.flush());
  return shared;
}

/** Records an error event in the shared log; see {@link createErrorLog}. */
export function logError(event: string, fields?: ErrorLogFields): void {
  try { sharedLog().logError(event, fields); } catch { /* never throw */ }
}

/** Writes the shared log's pending aggregate synchronously. */
export function flushErrorLog(): void {
  try { sharedLog().flush(); } catch { /* never throw */ }
}
