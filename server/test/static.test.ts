import 'dotenv/config';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db/knex.js';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-fixture-'));
fs.writeFileSync(path.join(dir, 'index.html'), '<html><body>fixture</body></html>');
fs.writeFileSync(path.join(dir, 'asset.js'), 'fixtureAsset');
after(async () => { fs.rmSync(dir, { recursive: true }); await db.destroy(); });

test('serves SPA fallback and static assets when enabled', async () => {
  const app = createApp({ serveStatic: true, staticDir: dir });
  assert.match((await request(app).get('/some/frontend/route').expect(200)).text, /fixture/);
  assert.equal((await request(app).get('/asset.js').expect(200)).text, 'fixtureAsset');
});

test('unknown API paths return JSON 404 for GET and POST, never the SPA', async () => {
  const app = createApp({ serveStatic: true, staticDir: dir });
  for (const response of [await request(app).get('/api/does-not-exist'), await request(app).post('/api/does-not-exist')]) {
    assert.equal(response.status, 404);
    assert.equal(response.body.error, 'Bulunamadı.');
    assert.match(response.headers['content-type'], /json/);
  }
});

test('static serving can be disabled and API health remains available', async () => {
  const app = createApp({ serveStatic: false, staticDir: dir });
  assert.equal((await request(app).get('/')).status, 404);
  assert.equal((await request(app).get('/api/health')).body.status, 'ok');
});
