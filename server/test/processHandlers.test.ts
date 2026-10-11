import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mock } from 'node:test';
import { exitOnListenError, installFatalErrorHandlers } from '../logging/processHandlers.js';

const roots: string[] = [];
after(() => { for (const root of roots) rmSync(root, { recursive: true, force: true }); });

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'process-handlers-test-'));
  roots.push(root);
  return root;
}

test('SIGTERM flushes the pending aggregate before the process exits cleanly', async () => {
  const dir = path.join(temporaryRoot(), 'logs');
  const fixture = fileURLToPath(new URL('./fixtures/errorLogSigterm.ts', import.meta.url));
  const child = spawn(process.execPath, ['--import', 'tsx', fixture], {
    env: { ...process.env, NODE_ENV: 'production', ERROR_LOG_DIR: dir },
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.stdout.on('data', chunk => { if (String(chunk).includes('ready')) resolve(); });
    child.once('exit', () => reject(new Error('child exited early')));
  });
  const exited = new Promise<number | null>(resolve => child.once('exit', code => resolve(code)));
  child.kill('SIGTERM');
  assert.equal(await exited, 0);
  const [file] = readdirSync(dir);
  const [line] = readFileSync(path.join(dir, file), 'utf8').split('\n').filter(Boolean).map(text => JSON.parse(text));
  assert.equal(line.event, 'repeated_failure');
  assert.equal(line.count, 3);
});

test('fatal handlers log only the error class and exit with 1', () => {
  const target = new EventEmitter();
  const exit = mock.fn();
  const spy = mock.method(console, 'error', () => {});
  try {
    installFatalErrorHandlers(target, exit as unknown as (code: number) => never);
    target.emit('uncaughtException', new TypeError('secret someone@example.test'));
    target.emit('unhandledRejection', 'plain string reason');
    const logged = spy.mock.calls.map(call => String(call.arguments[0]));
    assert.deepEqual(logged, [
      '{"event":"uncaught_exception","errorClass":"TypeError"}',
      '{"event":"unhandled_rejection","errorClass":"string"}',
    ]);
    assert.deepEqual(exit.mock.calls.map(call => call.arguments[0]), [1, 1]);
  } finally {
    spy.mock.restore();
  }
});

test('a listen error logs only its string code and exits with 1', () => {
  const server = new EventEmitter();
  const exit = mock.fn();
  const spy = mock.method(console, 'error', () => {});
  try {
    exitOnListenError(server, exit as unknown as (code: number) => never);
    server.emit('error', Object.assign(new Error('listen EADDRINUSE 127.0.0.1:3001'), { code: 'EADDRINUSE' }));
    assert.deepEqual(spy.mock.calls.map(call => String(call.arguments[0])), [
      '{"event":"listen_failed","errorCode":"EADDRINUSE"}',
    ]);
    assert.deepEqual(exit.mock.calls.map(call => call.arguments[0]), [1]);
  } finally {
    spy.mock.restore();
  }
});

test('index.ts registers the fatal handlers only after the startup assertions', () => {
  const source = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');
  const handlers = source.indexOf('installFatalErrorHandlers()');
  assert.ok(handlers > source.indexOf('assertJwtConfiguration();'));
  assert.ok(handlers > source.indexOf('assertSiteConfiguration();'));
  assert.ok(handlers > source.indexOf('assertNewsletterMailConfiguration();'));
});

test('the Vite dev server denies the log directory in addition to its defaults', () => {
  // The config cannot be imported here (it uses __dirname), so check its source.
  const source = readFileSync(fileURLToPath(new URL('../../vite.config.ts', import.meta.url)), 'utf8');
  const deny = source.match(/deny:\s*\[([^\]]*)\]/)?.[1] ?? '';
  for (const pattern of ['.env', '*.{crt,pem}', '**/.git/**', '**/logs/**']) {
    assert.ok(deny.includes(`'${pattern}'`), pattern);
  }
});
