import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Request } from 'express';
import { assertSiteConfiguration, siteOrigin } from '../seo/site.js';

const previous = { url: process.env.PUBLIC_SITE_URL, env: process.env.NODE_ENV };

function configure(url: string | undefined, env: string) {
  if (url === undefined) delete process.env.PUBLIC_SITE_URL;
  else process.env.PUBLIC_SITE_URL = url;
  process.env.NODE_ENV = env;
}

afterEach(() => configure(previous.url, previous.env ?? 'test'));

test('production refuses to start without PUBLIC_SITE_URL', () => {
  for (const url of [undefined, '', '   ']) {
    configure(url, 'production');
    assert.throws(assertSiteConfiguration, /PUBLIC_SITE_URL is not configured/, JSON.stringify(url));
  }
});

test('outside production PUBLIC_SITE_URL may be left unset', () => {
  configure(undefined, 'development');
  assert.doesNotThrow(assertSiteConfiguration);
});

test('a site address with or without a trailing slash is accepted', () => {
  for (const url of ['https://www.tugbasimsek.com.tr', 'https://www.tugbasimsek.com.tr/', 'http://localhost:3000']) {
    configure(url, 'production');
    assert.doesNotThrow(assertSiteConfiguration, url);
  }
});

test('anything that is not a bare http(s) site address is refused everywhere', () => {
  for (const url of ['www.tugbasimsek.com.tr', 'ftp://example.com', 'javascript:alert(1)', 'https://example.com/blog', 'https://example.com/?a=1', 'https://user:secret@example.com']) {
    configure(url, 'development');
    assert.throws(assertSiteConfiguration, /PUBLIC_SITE_URL must /, url);
  }
});

test('links use the parsed site address, not the text as typed', () => {
  const request = { protocol: 'http', get: () => 'attacker.example' } as unknown as Request;
  for (const url of ['https://www.tugbasimsek.com.tr///', 'https://www.tugbasimsek.com.tr?', 'https://www.tugbasimsek.com.tr/#', ' HTTPS://WWW.tugbasimsek.com.tr/. ']) {
    configure(url, 'production');
    assert.equal(siteOrigin(request), 'https://www.tugbasimsek.com.tr', url);
  }
});

test('without PUBLIC_SITE_URL links fall back to the address of the request', () => {
  configure(undefined, 'development');
  const request = { protocol: 'http', get: () => 'localhost:3000' } as unknown as Request;
  assert.equal(siteOrigin(request), 'http://localhost:3000');
});
