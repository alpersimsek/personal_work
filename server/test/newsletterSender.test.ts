import 'dotenv/config';
import { test, after, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/knex.js';
import { setNewsletterMailTransportForTests } from '../services/newsletterMail.js';
import { classifySmtpError, GmailNewsletterSender, NewsletterSendError } from '../services/newsletterSender.js';

const watchedKeys = ['NEWSLETTER_FROM', 'NEWSLETTER_SMTP_USER'] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of watchedKeys) savedEnv[key] = process.env[key];
});

afterEach(() => {
  setNewsletterMailTransportForTests(undefined);
  for (const key of watchedKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

after(async () => { setNewsletterMailTransportForTests(undefined); await db.destroy(); });

const message = {
  to: 'person@example.test', subject: 'Konu', text: 'metin', html: '<p>metin</p>',
  unsubscribeUrl: 'http://localhost:3000/api/subscribe/unsubscribe/confirm?token=abc',
};

test('classifies Gmail failures', () => {
  assert.equal(classifySmtpError({ responseCode: 550, response: '550-5.4.5 Daily user sending limit exceeded' }), 'halt');
  assert.equal(classifySmtpError({ code: 'EAUTH', responseCode: 535, response: '535 Username and Password not accepted' }), 'halt');
  assert.equal(classifySmtpError({ responseCode: 550, response: '550 5.1.1 The email account does not exist' }), 'permanent');
  assert.equal(classifySmtpError({ code: 'ETIMEDOUT', message: 'Connection timeout' }), 'transient');
  assert.equal(classifySmtpError(new Error('boom')), 'transient');
});

test('sends one message with a List-Unsubscribe header and no other recipients', async () => {
  process.env.NEWSLETTER_FROM = 'Tuğba <newsletter@example.test>';
  const sent: Array<Record<string, unknown>> = [];
  setNewsletterMailTransportForTests({
    sendMail: async m => { sent.push(m as Record<string, unknown>); return {} as never; },
  });
  await new GmailNewsletterSender().send(message);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'person@example.test');
  assert.equal(sent[0].cc, undefined);
  assert.equal(sent[0].bcc, undefined);
  assert.deepEqual(sent[0].headers, { 'List-Unsubscribe': `<${message.unsubscribeUrl}>` });
});

test('wraps SMTP errors with their kind and never leaks the recipient', async () => {
  process.env.NEWSLETTER_FROM = 'Tuğba <newsletter@example.test>';
  setNewsletterMailTransportForTests({
    sendMail: async () => { throw Object.assign(new Error('rejected person@example.test'), { responseCode: 550, response: '550 5.4.5 Daily user sending limit exceeded' }); },
  });
  await assert.rejects(new GmailNewsletterSender().send(message), (error: unknown) => {
    assert.ok(error instanceof NewsletterSendError);
    assert.equal(error.kind, 'halt');
    assert.doesNotMatch(error.message, /person@example\.test/);
    return true;
  });
});

test('missing mail configuration halts instead of failing recipients', async () => {
  setNewsletterMailTransportForTests(undefined);
  delete process.env.NEWSLETTER_SMTP_USER;
  await assert.rejects(new GmailNewsletterSender().send(message),
    (error: unknown) => error instanceof NewsletterSendError && error.kind === 'halt');
});
