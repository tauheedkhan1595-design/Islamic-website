import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../backend/app.js';
import { initializeDatabase } from '../backend/database/connection.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('health and public article routes respond with JSON', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'noor-cms-'));
  process.env.DATA_DIR = dir;
  initializeDatabase();
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const health = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);
    const list = await fetch(`http://127.0.0.1:${port}/api/v1/articles`);
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).articles, []);
    const missing = await fetch(`http://127.0.0.1:${port}/api/v1/articles/not-real`);
    assert.equal(missing.status, 404);
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
