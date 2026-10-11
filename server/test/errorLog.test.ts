import { test, mock, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {
  appendFileSync, chmodSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync,
  symlinkSync, utimesSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createErrorLog, defaultErrorLogDirectory, flushErrorLog, initErrorLog, isInsideWebRoot, logError, setErrorLogDirectoryForTests,
} from '../logging/errorLog.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { chmodSync as chmodDirectory } from 'node:fs';

const DAY = 24 * 60 * 60 * 1000;
const MAX_BYTES = 3 * 1024 * 1024;

const temporaryRoots: string[] = [];

after(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'error-log-test-'));
  temporaryRoots.push(root);
  return root;
}

function makeClock(start = new Date(2026, 9, 11, 13, 45, 7)) {
  let current = start;
  return {
    now: () => current,
    advance(ms: number) { current = new Date(current.getTime() + ms); },
    set(date: Date) { current = date; },
  };
}

function filesIn(dir: string): string[] {
  return readdirSync(dir).sort();
}

function linesOf(file: string): Record<string, unknown>[] {
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}

function age(file: string, date: Date): void {
  utimesSync(file, date, date);
}

function fullFile(dir: string, name: string, bytes: number, modified: Date): string {
  const file = path.join(dir, name);
  writeFileSync(file, 'x'.repeat(bytes), { mode: 0o600 });
  age(file, modified);
  return file;
}

test('file names are log_DD_MM_HH_SS.log in local time and collisions get a numeric suffix', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock();
  const log = createErrorLog({ dir, now: clock.now, maxBytes: 100, echo: false });
  log.logError('first_event');
  log.logError('second_event');
  log.logError('third_event');
  log.flush();
  assert.deepEqual(filesIn(dir), ['log_11_10_13_07.log', 'log_11_10_13_07_2.log', 'log_11_10_13_07_3.log']);
});

test('single digits are zero padded', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: () => new Date(2026, 0, 2, 3, 4, 5), echo: false });
  log.logError('padded');
  log.flush();
  assert.deepEqual(filesIn(dir), ['log_02_01_03_05.log']);
});

test('a line is one JSON object with ts, event, fields and count', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock(new Date('2026-10-11T10:45:07.000Z'));
  const log = createErrorLog({ dir, now: clock.now, echo: false });
  log.logError('request_failed', { status: 500, category: 'ENOENT' });
  log.flush();
  const [file] = filesIn(dir);
  const raw = readFileSync(path.join(dir, file), 'utf8');
  assert.equal(raw, '{"ts":"2026-10-11T10:45:07.000Z","event":"request_failed","status":500,"category":"ENOENT","count":1}\n');
});

test('a file rolls over before it would exceed 3 MB', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock();
  const log = createErrorLog({ dir, now: clock.now, echo: false });
  const filler = 'a'.repeat(120);
  for (let index = 0; index < 12_000; index += 1) log.logError('bulk_event', { index, first: filler, second: filler, third: filler });
  log.flush();
  const files = filesIn(dir);
  assert.equal(files.length, 2);
  const sizes = files.map(name => statSync(path.join(dir, name)).size);
  assert.ok(sizes.every(size => size <= MAX_BYTES));
  assert.ok(sizes[0] > MAX_BYTES - 1000, 'first file is filled before rolling');
});

test('files accumulate to 20 and then the oldest one is overwritten', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock();
  const log = createErrorLog({ dir, now: clock.now, maxBytes: 100, maxFiles: 20, echo: false });
  const stamped = new Set<string>();
  const stamp = () => {
    for (const name of readdirSync(dir)) {
      if (!stamped.has(name)) { stamped.add(name); age(path.join(dir, name), clock.now()); }
    }
  };
  for (let index = 0; index < 20; index += 1) {
    log.logError(`ev_${index}`);
    log.flush();
    stamp();
    clock.advance(60_000);
  }
  assert.equal(filesIn(dir).length, 20);
  log.logError('ev_20');
  log.flush();
  const files = filesIn(dir);
  assert.equal(files.length, 20);
  const all = files.map(name => readFileSync(path.join(dir, name), 'utf8')).join('');
  assert.ok(!all.includes('"ev_0"'), 'the oldest content is gone');
  assert.ok(all.includes('"ev_1"') && all.includes('"ev_20"'));
});

test('the oldest file is overwritten once it is 7 days old even below the cap', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const clock = makeClock();
  const full = 100;
  fullFile(dir, 'log_01_01_00_00.log', full, new Date(clock.now().getTime() - 7 * DAY));
  fullFile(dir, 'log_02_01_00_00.log', full, new Date(clock.now().getTime() - 1 * DAY));
  fullFile(dir, 'log_03_01_00_00.log', full, new Date(clock.now().getTime() - 60_000));
  const log = createErrorLog({ dir, now: clock.now, maxBytes: full, echo: false });
  log.logError('after_age');
  log.flush();
  const files = filesIn(dir);
  assert.equal(files.length, 3);
  assert.ok(!files.includes('log_01_01_00_00.log'));
  assert.ok(files.includes('log_02_01_00_00.log') && files.includes('log_03_01_00_00.log'));
  assert.equal(statSync(path.join(dir, 'log_11_10_13_07.log')).size < full, true);
});

test('a file younger than 7 days is never overwritten below the cap', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const clock = makeClock();
  const oldest = fullFile(dir, 'log_01_10_00_00.log', 100, new Date(clock.now().getTime() - 7 * DAY + 1000));
  fullFile(dir, 'log_02_10_00_00.log', 100, new Date(clock.now().getTime() - 60_000));
  const log = createErrorLog({ dir, now: clock.now, maxBytes: 100, maxFiles: 20, echo: false });
  log.logError('young_files');
  log.flush();
  assert.equal(filesIn(dir).length, 3);
  assert.equal(readFileSync(oldest, 'utf8'), 'x'.repeat(100));
});

test('startup appends to the newest file when it is below the size limit', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const clock = makeClock();
  fullFile(dir, 'log_01_10_00_00.log', 10, new Date(clock.now().getTime() - 2 * DAY));
  const newest = path.join(dir, 'log_02_10_00_00.log');
  writeFileSync(newest, '{"ts":"x","event":"old","count":1}\n');
  age(newest, new Date(clock.now().getTime() - 60_000));
  const log = createErrorLog({ dir, now: clock.now, echo: false });
  log.logError('appended');
  log.flush();
  assert.equal(filesIn(dir).length, 2);
  assert.equal(linesOf(newest).length, 2);
});

test('identical events within the window are aggregated into one counted line', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock(new Date('2026-10-11T10:00:00.000Z'));
  const log = createErrorLog({ dir, now: clock.now, echo: false });
  for (let index = 0; index < 3; index += 1) {
    log.logError('db_down', { category: 'ECONNREFUSED' });
    clock.advance(10_000);
  }
  log.flush();
  const lines = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].count, 3);
  assert.equal(lines[0].ts, '2026-10-11T10:00:00.000Z');
});

test('a different event or different fields flush the pending aggregate', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock();
  const log = createErrorLog({ dir, now: clock.now, echo: false });
  log.logError('alpha', { status: 500 });
  log.logError('alpha', { status: 500 });
  log.logError('alpha', { status: 502 });
  log.logError('beta');
  log.flush();
  const lines = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.deepEqual(lines.map(line => [line.event, line.count]), [['alpha', 2], ['alpha', 1], ['beta', 1]]);
});

test('an identical event after the window starts a new line', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const clock = makeClock();
  const log = createErrorLog({ dir, now: clock.now, echo: false });
  log.logError('repeat');
  clock.advance(61_000);
  log.logError('repeat');
  log.flush();
  const lines = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.deepEqual(lines.map(line => line.count), [1, 1]);
});

test('flush writes the pending aggregate once and is harmless when empty', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  log.flush();
  assert.equal(readdirSync(path.dirname(dir)).includes('logs'), false);
  log.logError('pending');
  log.flush();
  log.flush();
  assert.equal(linesOf(path.join(dir, filesIn(dir)[0])).length, 1);
});

test('only safe primitive values are stored', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  log.logError('redaction', {
    address: 'someone@example.test',
    multiline: 'first\nsecond',
    carriage: 'first\rsecond',
    long: 'b'.repeat(500),
    nested: { a: 1 } as unknown as string,
    list: [1] as unknown as string,
    missing: undefined as unknown as string,
    absent: null as unknown as string,
    ok: 'fine',
    status: 503,
    flag: true,
    'bad key': 'dropped',
  });
  log.logError('Bad Event!');
  log.flush();
  const [first, second] = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.deepEqual(first, {
    ts: first.ts, event: 'redaction', address: '[redacted]', multiline: '[redacted]',
    carriage: '[redacted]', long: 'b'.repeat(120), ok: 'fine', status: 503, flag: true, count: 1,
  });
  assert.equal(second.event, 'invalid_event');
});

test('a long value whose @ lies beyond the truncation point is still redacted', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  log.logError('late_at', { value: `${'c'.repeat(200)}@example.test` });
  log.flush();
  assert.equal(linesOf(path.join(dir, filesIn(dir)[0]))[0].value, '[redacted]');
});

test('echo prints the sanitized fields as JSON with console.error', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const spy = mock.method(console, 'error', () => {});
  try {
    const log = createErrorLog({ dir, now: makeClock().now });
    log.logError('request_failed', { status: 500, secret: 'a@b.c' });
    log.flush();
    assert.deepEqual(spy.mock.calls[0].arguments, ['{"event":"request_failed","status":500,"secret":"[redacted]"}']);
  } finally {
    spy.mock.restore();
  }
});

test('a write failure never throws and reports the code once until a write succeeds', () => {
  const root = temporaryRoot();
  const blocked = path.join(root, 'blocked');
  writeFileSync(blocked, 'a file where the directory should be');
  const spy = mock.method(console, 'error', () => {});
  try {
    const log = createErrorLog({ dir: blocked, now: makeClock().now, echo: false });
    assert.doesNotThrow(() => {
      log.logError('one');
      log.logError('two');
      log.flush();
      log.logError('three');
      log.flush();
    });
    assert.equal(spy.mock.callCount(), 1);
    assert.match(String(spy.mock.calls[0].arguments[0]), /^error log write failed: [A-Z]+$/);
    rmSync(blocked);
    log.logError('four');
    log.flush();
    assert.equal(linesOf(path.join(blocked, filesIn(blocked)[0])).length, 1);
    rmSync(blocked, { recursive: true });
    writeFileSync(blocked, 'blocked again');
    log.logError('five');
    log.flush();
    assert.equal(spy.mock.callCount(), 2);
  } finally {
    spy.mock.restore();
  }
});

test('directory and files are private to the server user', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  log.logError('modes');
  log.flush();
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  assert.equal(statSync(path.join(dir, filesIn(dir)[0])).mode & 0o777, 0o600);
});

test('the default directory is outside dist, public and uploads', () => {
  const saved = { dir: process.env.ERROR_LOG_DIR, uploads: process.env.UPLOADS_DIR };
  delete process.env.ERROR_LOG_DIR;
  delete process.env.UPLOADS_DIR;
  try {
    const directory = defaultErrorLogDirectory();
    assert.equal(directory, path.join(process.cwd(), 'logs'));
    for (const web of ['dist', 'public', 'uploads']) {
      const relative = path.relative(path.resolve(web), directory);
      assert.ok(relative.startsWith('..') || path.isAbsolute(relative), `${directory} is inside ${web}`);
    }
    assert.equal(isInsideWebRoot(directory), false);
    assert.equal(isInsideWebRoot(path.resolve('dist', 'logs')), true);
    assert.equal(isInsideWebRoot(path.resolve('public')), true);
    assert.equal(isInsideWebRoot(path.resolve('uploads', 'blog')), true);
  } finally {
    if (saved.dir !== undefined) process.env.ERROR_LOG_DIR = saved.dir;
    if (saved.uploads !== undefined) process.env.UPLOADS_DIR = saved.uploads;
  }
});

test('a failing request reaches the file through the Express error handler with fixed fields only', async () => {
  const dir = path.join(temporaryRoot(), 'logs');
  setErrorLogDirectoryForTests(dir);
  const spy = mock.method(console, 'error', () => {});
  try {
    const app = express();
    app.get('/boom', () => {
      throw Object.assign(new Error('secret someone@example.test select * from users'), { code: 'ER_DUP_ENTRY' });
    });
    app.use(errorHandler);
    const response = await request(app).get('/boom');
    assert.equal(response.status, 500);
    flushErrorLog();
  } finally {
    spy.mock.restore();
    flushErrorLog();
    setErrorLogDirectoryForTests(null);
  }
  const files = filesIn(dir);
  assert.equal(files.length, 1);
  const raw = readFileSync(path.join(dir, files[0]), 'utf8');
  const lines = linesOf(path.join(dir, files[0]));
  assert.equal(lines.length, 1);
  assert.deepEqual(Object.keys(lines[0]).sort(), ['category', 'count', 'event', 'status', 'ts']);
  assert.equal(lines[0].event, 'request_failed');
  assert.equal(lines[0].status, 500);
  assert.equal(lines[0].category, 'ER_DUP_ENTRY');
  assert.ok(!raw.includes('secret') && !raw.includes('@') && !raw.includes('select'));
});

test('the shared log ignores ERROR_LOG_DIR under NODE_ENV=test', () => {
  const dir = path.join(temporaryRoot(), 'from-env');
  const saved = process.env.ERROR_LOG_DIR;
  process.env.ERROR_LOG_DIR = dir;
  setErrorLogDirectoryForTests(null);
  const spy = mock.method(console, 'error', () => {});
  try {
    assert.equal(process.env.NODE_ENV, 'test');
    logError('should_not_be_written');
    flushErrorLog();
  } finally {
    spy.mock.restore();
    if (saved === undefined) delete process.env.ERROR_LOG_DIR; else process.env.ERROR_LOG_DIR = saved;
  }
  assert.equal(readdirSync(path.dirname(dir)).includes('from-env'), false);
});

test('the web-root guard resolves symlinks and does not confuse ..names with parents', () => {
  const root = temporaryRoot();
  const dist = path.join(root, 'dist');
  const pub = path.join(root, 'public');
  mkdirSync(dist);
  mkdirSync(pub);
  symlinkSync(dist, path.join(root, 'link'));
  assert.equal(isInsideWebRoot(path.join(root, 'link', 'logs'), [dist]), true);
  assert.equal(isInsideWebRoot(path.join(pub, '..logs'), [pub]), true);
  assert.equal(isInsideWebRoot(path.join(root, 'public2', 'logs'), [pub]), false);
  assert.equal(isInsideWebRoot(path.join(root, 'elsewhere'), [dist, pub]), false);
});

function failingDisk() {
  const state = { failing: false, tornFragment: '' };
  const appendFile = (file: string, data: string, options: { mode: number }) => {
    if (!state.failing) { appendFileSync(file, data, options); return; }
    if (state.tornFragment) appendFileSync(file, state.tornFragment, options);
    throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
  };
  return { state, appendFile };
}

test('a failing disk neither creates files nor touches the others, and recovery starts on a fresh line', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const clock = makeClock();
  const keep = fullFile(dir, 'log_01_10_00_00.log', 4096, new Date(clock.now().getTime() - 2 * DAY));
  const disk = failingDisk();
  const log = createErrorLog({ dir, now: clock.now, echo: false, maxBytes: 4096, maxFiles: 2, appendFile: disk.appendFile });
  log.logError('before_failure');
  log.flush();
  const namesBefore = filesIn(dir);
  const spy = mock.method(console, 'error', () => {});
  try {
    disk.state.failing = true;
    disk.state.tornFragment = '{"ts":"2026-10';
    for (let index = 0; index < 50; index += 1) {
      log.logError(`failure_${index}`);
      log.flush();
    }
    assert.deepEqual(filesIn(dir), namesBefore);
    assert.equal(readFileSync(keep, 'utf8'), 'x'.repeat(4096));
    assert.equal(spy.mock.callCount(), 1);
  } finally {
    spy.mock.restore();
  }
  disk.state.failing = false;
  log.logError('after_recovery');
  log.flush();
  assert.deepEqual(filesIn(dir), namesBefore);
  const text = readFileSync(path.join(dir, namesBefore.find(name => name !== 'log_01_10_00_00.log')!), 'utf8');
  const last = text.split('\n').filter(Boolean).at(-1)!;
  assert.equal(JSON.parse(last).event, 'after_recovery');
});

test('an active file replaced by a symlink is abandoned and its target is never written', () => {
  const root = temporaryRoot();
  const dir = path.join(root, 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  log.logError('first_line');
  log.flush();
  const [name] = filesIn(dir);
  const outside = path.join(root, 'outside.txt');
  writeFileSync(outside, 'untouched');
  rmSync(path.join(dir, name));
  symlinkSync(outside, path.join(dir, name));
  log.logError('second_line');
  log.flush();
  assert.equal(readFileSync(outside, 'utf8'), 'untouched');
  const regular = filesIn(dir).filter(file => file !== name);
  assert.equal(regular.length, 1);
  assert.ok(readFileSync(path.join(dir, regular[0]), 'utf8').includes('"second_line"'));
});

test('a directory that is group-writable disables file logging loudly', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true });
  chmodDirectory(dir, 0o770);
  const spy = mock.method(console, 'error', () => {});
  try {
    const log = createErrorLog({ dir, now: makeClock().now, echo: false });
    log.logError('should_not_be_written');
    log.flush();
    log.logError('still_not');
    log.flush();
    assert.equal(spy.mock.callCount(), 1);
    assert.match(String(spy.mock.calls[0].arguments[0]), /error log disabled/);
  } finally {
    spy.mock.restore();
  }
  assert.deepEqual(filesIn(dir), []);
});

test('interleaved events are aggregated per key in first-occurrence order', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  for (const event of ['aaa', 'bbb', 'aaa', 'bbb', 'aaa']) log.logError(event);
  log.flush();
  const lines = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.deepEqual(lines.map(line => [line.event, line.count]), [['aaa', 3], ['bbb', 2]]);
});

test('more than 32 distinct pending events flush the oldest one', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  for (let index = 0; index < 33; index += 1) log.logError(`event_${index}`);
  assert.equal(linesOf(path.join(dir, filesIn(dir)[0])).length, 1);
  log.flush();
  const lines = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.equal(lines.length, 33);
  assert.equal(lines[0].event, 'event_0');
});

test('repeating an event echoes it when it starts and when its counted line is written', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const spy = mock.method(console, 'error', () => {});
  try {
    const log = createErrorLog({ dir, now: makeClock().now });
    for (let index = 0; index < 5; index += 1) log.logError('noisy', { status: 500 });
    assert.equal(spy.mock.callCount(), 1);
    log.flush();
    assert.deepEqual(spy.mock.calls.map(call => JSON.parse(String(call.arguments[0])).count), [undefined, 5]);
  } finally {
    spy.mock.restore();
  }
});

test('request parser failures answer 4xx and are not logged as server errors', async () => {
  const dir = path.join(temporaryRoot(), 'logs');
  setErrorLogDirectoryForTests(dir);
  const spy = mock.method(console, 'error', () => {});
  try {
    const app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.post('/', (_req, res) => { res.json({ ok: true }); });
    app.use(errorHandler);
    const charset = await request(app).post('/').set('Content-Type', 'application/x-www-form-urlencoded; charset=koi8-r').send('a=b');
    const encoding = await request(app).post('/').set('Content-Type', 'application/json').set('Content-Encoding', 'zz').send('{}');
    assert.ok(charset.status >= 400 && charset.status < 500, `charset ${charset.status}`);
    assert.ok(encoding.status >= 400 && encoding.status < 500, `encoding ${encoding.status}`);
    assert.deepEqual(charset.body, { error: 'Geçersiz istek.' });
    flushErrorLog();
    assert.equal(spy.mock.callCount(), 0);
  } finally {
    spy.mock.restore();
    setErrorLogDirectoryForTests(null);
  }
  assert.equal(readdirSync(path.dirname(dir)).includes('logs'), false);
});

test('initErrorLog reports a disabled shared log at startup unless a test runner owns the process', () => {
  const saved = process.env.NODE_TEST_CONTEXT;
  const spy = mock.method(console, 'error', () => {});
  try {
    setErrorLogDirectoryForTests(null);
    initErrorLog();
    assert.equal(spy.mock.callCount(), 0);
    delete process.env.NODE_TEST_CONTEXT;
    setErrorLogDirectoryForTests(null);
    initErrorLog();
    assert.match(String(spy.mock.calls[0].arguments[0]), /error log disabled: NODE_ENV=test/);
    setErrorLogDirectoryForTests(path.resolve('dist', 'logs'));
    initErrorLog();
    assert.match(String(spy.mock.calls[1].arguments[0]), /web-served/);
  } finally {
    spy.mock.restore();
    if (saved !== undefined) process.env.NODE_TEST_CONTEXT = saved;
    setErrorLogDirectoryForTests(null);
  }
});

test('events keep at most 16 fields and oversized lines are cut down to a marker', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const log = createErrorLog({ dir, now: makeClock().now, echo: false });
  const many: Record<string, number> = {};
  for (let index = 0; index < 40; index += 1) many[`field_${index}`] = index;
  log.logError('many_fields', many);
  log.flush();
  const [line] = linesOf(path.join(dir, filesIn(dir)[0]));
  assert.equal(Object.keys(line).filter(key => key.startsWith('field_')).length, 16);

  const small = path.join(temporaryRoot(), 'logs');
  const tiny = createErrorLog({ dir: small, now: makeClock().now, echo: false, maxBytes: 120 });
  tiny.logError('too_big', { a: 'x'.repeat(100), b: 'y'.repeat(100) });
  tiny.flush();
  const [marker] = linesOf(path.join(small, filesIn(small)[0]));
  assert.deepEqual(Object.keys(marker), ['ts', 'event', 'truncated']);
  assert.equal(marker.truncated, true);
  assert.ok(statSync(path.join(small, filesIn(small)[0])).size <= 120);
});

test('the file being written is never the one that gets overwritten', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const clock = makeClock();
  fullFile(dir, 'log_01_01_00_00.log', 100, new Date(2100, 0, 1));
  fullFile(dir, 'log_02_01_00_00.log', 100, new Date(clock.now().getTime() - 3 * DAY));
  const log = createErrorLog({ dir, now: clock.now, maxBytes: 100, maxFiles: 2, echo: false });
  log.logError('one');
  log.flush();
  log.logError('two');
  log.flush();
  const all = filesIn(dir).map(name => readFileSync(path.join(dir, name), 'utf8')).join('');
  assert.equal(filesIn(dir).length, 2);
  assert.ok(all.includes('"one"') && all.includes('"two"'));
});

test('symlinks and directories that look like log files are ignored and never truncated', () => {
  const root = temporaryRoot();
  const dir = path.join(root, 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const precious = path.join(root, 'precious.txt');
  writeFileSync(precious, 'keep me');
  const longAgo = new Date(2000, 0, 1);
  symlinkSync(precious, path.join(dir, 'log_01_01_00_00.log'));
  mkdirSync(path.join(dir, 'log_02_01_00_00.log'));
  const regular = fullFile(dir, 'log_03_01_00_00.log', 100, new Date(2000, 0, 2));
  age(regular, longAgo);
  const log = createErrorLog({ dir, now: makeClock().now, maxBytes: 100, maxFiles: 1, echo: false });
  log.logError('through_links');
  log.flush();
  assert.equal(readFileSync(precious, 'utf8'), 'keep me');
  assert.ok(readFileSync(path.join(dir, 'log_11_10_13_07.log'), 'utf8').includes('"through_links"'));
});

test('an existing directory and a reused file are tightened to 0700 and 0600', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true });
  chmodSync(dir, 0o755);
  const old = fullFile(dir, 'log_01_01_00_00.log', 100, new Date(2000, 0, 1));
  chmodSync(old, 0o644);
  const log = createErrorLog({ dir, now: makeClock().now, maxBytes: 100, maxFiles: 1, echo: false });
  log.logError('modes_again');
  log.flush();
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  const [name] = filesIn(dir);
  assert.equal(name, 'log_11_10_13_07.log');
  assert.equal(statSync(path.join(dir, name)).mode & 0o777, 0o600);
});

test('a restart while the newest file is already full starts a new file', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const clock = makeClock();
  fullFile(dir, 'log_10_10_00_00.log', 100, new Date(clock.now().getTime() - 60_000));
  const log = createErrorLog({ dir, now: clock.now, maxBytes: 100, echo: false });
  log.logError('after_restart');
  log.flush();
  assert.deepEqual(filesIn(dir), ['log_10_10_00_00.log', 'log_11_10_13_07.log']);
});

test('reuse at the cap keeps the new name and refreshes the modified time', () => {
  const dir = path.join(temporaryRoot(), 'logs');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const old = fullFile(dir, 'log_01_01_00_00.log', 100, new Date(2000, 0, 1));
  const before = statSync(old).mtimeMs;
  const log = createErrorLog({ dir, now: makeClock().now, maxBytes: 100, maxFiles: 1, echo: false });
  log.logError('reused');
  log.flush();
  assert.deepEqual(filesIn(dir), ['log_11_10_13_07.log']);
  assert.ok(statSync(path.join(dir, 'log_11_10_13_07.log')).mtimeMs > before);
});
