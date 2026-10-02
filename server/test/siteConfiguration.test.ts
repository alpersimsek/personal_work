import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { assertSiteConfiguration } from '../seo/site.js';

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
  for (const url of ['www.tugbasimsek.com.tr', 'ftp://example.com', 'javascript:alert(1)', 'https://example.com/blog', 'https://example.com/?a=1']) {
    configure(url, 'development');
    assert.throws(assertSiteConfiguration, /PUBLIC_SITE_URL must be/, url);
  }
});
