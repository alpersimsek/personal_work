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
  assert.equal(classifySmtpError({ responseCode: 550, response: '550-5.4.5 Daily user sending limit exceeded' }), 'pause');
  assert.equal(classifySmtpError({ code: 'EAUTH', responseCode: 535, response: '535 Username and Password not accepted' }), 'pause');
  assert.equal(classifySmtpError({ responseCode: 550, response: '550 5.1.1 The email account does not exist' }), 'permanent');
  assert.equal(classifySmtpError({ code: 'ETIMEDOUT', message: 'Connection timeout' }), 'transient');
  assert.equal(classifySmtpError(new Error('boom')), 'transient');
});

test('sender-level rejections pause without touching recipients', () => {
  const cases: Array<[number, string]> = [
    [530, '530 5.7.0 Authentication Required'],
    [534, '534 5.7.9 Application-specific password required'],
    [535, '535 5.7.8 Username and Password not accepted'],
    [550, '550 5.7.1 Message blocked, sender not allowed'],
    [554, '554 5.7.1 Message rejected as spam'],
    [421, '421 4.7.0 Try again later, closing connection'],
  ];
  for (const [responseCode, response] of cases) {
    assert.equal(classifySmtpError({ responseCode, response }), 'pause', response);
  }
  assert.equal(classifySmtpError({ code: 'EAUTH', message: 'Invalid login' }), 'pause');
  assert.equal(classifySmtpError({ code: 'EENVELOPE', response: '530 Authentication required' }), 'pause');
  assert.equal(classifySmtpError({ responseCode: 451, response: '451 4.7.1 Try again later' }), 'pause');
  assert.equal(classifySmtpError({ responseCode: 452, response: '452 Too many recipients' }), 'pause');
});

test('other non-recipient 5xx rejections halt', () => {
  assert.equal(classifySmtpError({ responseCode: 552, response: '552 5.3.4 Message size exceeds fixed limit' }), 'halt');
  assert.equal(classifySmtpError({ responseCode: 554, response: '554 5.6.0 Message content rejected' }), 'halt');
  assert.equal(classifySmtpError({ responseCode: 550, response: '550 5.1.1 The email account does not exist' }), 'permanent');
  assert.equal(classifySmtpError({ responseCode: 553, response: '553 invalid recipient address' }), 'permanent');
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
    assert.equal(error.kind, 'pause');
    assert.doesNotMatch(error.message, /person@example\.test/);
    return true;
  });
});

test('missing mail configuration pauses instead of failing recipients', async () => {
  setNewsletterMailTransportForTests(undefined);
  process.env.NEWSLETTER_FROM = 'Tuğba <newsletter@example.test>';
  delete process.env.NEWSLETTER_SMTP_USER;
  await assert.rejects(new GmailNewsletterSender().send(message),
    (error: unknown) => error instanceof NewsletterSendError && error.kind === 'pause');
});

test('an address echoed in a rejection cannot turn it into a pause', () => {
  for (const address of ['quota@x.test', '5.7.0@x.test', 'daily-user-sending-limit@x.test', 'auth@x.test',
    'too-many@x.test', '"daily user sending limit"@x.test']) {
    for (const response of [
      `550 5.1.1 <${address}>: Recipient address rejected: User unknown`,
      `550-5.1.1 ${address} The email account that you tried to reach does not exist`,
      `550 ${address}: user unknown`,
    ]) {
      assert.equal(classifySmtpError({ responseCode: 550, response, message: `Can't send mail - all recipients were rejected: ${response}` }),
        'permanent', response);
    }
    assert.equal(classifySmtpError({ responseCode: 552, response: `552 5.3.4 <${address}> message too large` }), 'halt', address);
    assert.equal(classifySmtpError({ code: 'ETIMEDOUT', message: `timeout sending to ${address}` }), 'transient', address);
  }
});

test('structural codes win over free text and follow the documented precedence', () => {
  assert.equal(classifySmtpError({ response: '535 5.7.8 Username and Password not accepted' }), 'pause');
  assert.equal(classifySmtpError({ responseCode: 550, response: '550-5.4.5 Daily user sending limit exceeded' }), 'pause');
  assert.equal(classifySmtpError({ responseCode: 452, response: '452 4.2.2 The recipient mailbox is full' }), 'transient');
  assert.equal(classifySmtpError({ responseCode: 552, response: '552 5.2.2 The recipient mailbox is full' }), 'permanent');
  assert.equal(classifySmtpError({ responseCode: 451, response: '451 4.5.3 Too many recipients' }), 'pause');
  assert.equal(classifySmtpError({ responseCode: 550, response: '550 5.1.1 quota exceeded for this user' }), 'permanent');
  assert.equal(classifySmtpError({ responseCode: 451, response: '451 4.3.0 Temporary server error' }), 'transient');
});

test('a word inside an echoed domain is not a sender-level signal', () => {
  assert.equal(classifySmtpError({ responseCode: 421, response: '421 mx.quotacorp.com Service not available' }), 'transient');
  assert.equal(classifySmtpError({ code: 'ECONNECTION', message: 'connect ECONNREFUSED mx.quotacorp.com' }), 'transient');
  assert.equal(classifySmtpError({ message: 'greeting never received from toomanyhats.com' }), 'transient');
});
