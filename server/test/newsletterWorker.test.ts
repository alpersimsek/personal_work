import 'dotenv/config';
import { test, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import { createNewsletterTick, startNewsletterWorker } from '../worker/newsletterWorker.js';
import type { BroadcastMessage, NewsletterSender } from '../services/newsletterSender.js';
import type { TickResult } from '../services/newsletterBroadcast.js';

class FakeSender implements NewsletterSender {
  readonly sent: BroadcastMessage[] = [];
  async send(message: BroadcastMessage): Promise<void> { this.sent.push(message); }
}

after(() => db.destroy());

async function withWorkerEnv(nodeEnv: string, flag: string | undefined, body: () => void | Promise<void>) {
  const saved = { nodeEnv: process.env.NODE_ENV, flag: process.env.NEWSLETTER_WORKER_ENABLED };
  process.env.NODE_ENV = nodeEnv;
  if (flag === undefined) delete process.env.NEWSLETTER_WORKER_ENABLED;
  else process.env.NEWSLETTER_WORKER_ENABLED = flag;
  try {
    await body();
  } finally {
    process.env.NODE_ENV = saved.nodeEnv;
    if (saved.flag === undefined) delete process.env.NEWSLETTER_WORKER_ENABLED;
    else process.env.NEWSLETTER_WORKER_ENABLED = saved.flag;
  }
}

test('the worker never starts under tests or when disabled', async () => {
  const setIntervalSpy = mock.method(globalThis, 'setInterval');
  try {
    await withWorkerEnv('test', 'true', () => startNewsletterWorker(new FakeSender())());
    await withWorkerEnv('development', 'false', () => startNewsletterWorker(new FakeSender())());
    await withWorkerEnv('production', 'false', () => startNewsletterWorker(new FakeSender())());
    assert.equal(setIntervalSpy.mock.callCount(), 0);
  } finally {
    setIntervalSpy.mock.restore();
  }
});

test('when enabled outside tests the worker starts a timer that stop clears', async () => {
  const setIntervalSpy = mock.method(globalThis, 'setInterval');
  const clearIntervalSpy = mock.method(globalThis, 'clearInterval');
  try {
    await withWorkerEnv('development', 'true', () => {
      const stop = startNewsletterWorker(new FakeSender());
      assert.equal(setIntervalSpy.mock.callCount(), 1);
      const timer = setIntervalSpy.mock.calls[0].result;
      stop();
      assert.equal(clearIntervalSpy.mock.callCount(), 1);
      assert.equal(clearIntervalSpy.mock.calls[0].arguments[0], timer);
    });
  } finally {
    setIntervalSpy.mock.restore();
    clearIntervalSpy.mock.restore();
  }
});

test('a failed tick logs the error class and code but never its message', async () => {
  const errorLog = mock.method(console, 'error', () => {});
  try {
    const tick = createNewsletterTick(new FakeSender(), async () => {
      const error = new Error("insert into `newsletter_verification_tokens` values ('someone@example.test')");
      Object.assign(error, { code: 'ER_DUP_ENTRY' });
      throw error;
    });
    await tick();
    const logged = errorLog.mock.calls.map(call => call.arguments.map(String).join(' ')).join('\n');
    assert.match(logged, /"errorClass":"Error"/);
    assert.match(logged, /"errorCode":"ER_DUP_ENTRY"/);
    assert.ok(!logged.includes('someone@example.test'));
    assert.ok(!logged.includes('insert into'));
  } finally {
    errorLog.mock.restore();
  }
});

test('a halted tick logs counts with a reason and pauses the next ticks', async () => {
  const log = mock.method(console, 'log', () => {});
  const errorLog = mock.method(console, 'error', () => {});
  let runs = 0;
  const halted: TickResult = { sent: 2, failed: 1, skipped: 0, halted: true, haltReason: 'transient' };
  try {
    const tick = createNewsletterTick(new FakeSender(), async () => { runs += 1; return halted; });
    await tick();
    await tick();
    assert.equal(runs, 1);
    assert.equal(log.mock.calls[0].arguments[0], 'Newsletter: sent 2, failed 1, skipped 0; halted: consecutive-transient');
  } finally {
    log.mock.restore();
    errorLog.mock.restore();
  }
});
