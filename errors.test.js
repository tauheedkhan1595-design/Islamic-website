import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler, notFound } from '../backend/middleware/errors.js';

function responseStub() {
  return {
    statusCode: 200,
    body: null,
    sentFile: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
    sendFile(file) { this.sentFile = file; return this; }
  };
}

test('unknown API routes return a JSON 404', () => {
  const res = responseStub();
  notFound({ path: '/api/v1/unknown' }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'API route not found.' });
});

test('API errors hide internal messages for server failures', () => {
  const res = responseStub();
  const original = console.error;
  console.error = () => {};
  try {
    errorHandler(new Error('database password leaked?'), { path: '/api/v1/articles' }, res, () => {});
  } finally {
    console.error = original;
  }
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: 'Internal server error.' });
  assert.doesNotMatch(JSON.stringify(res.body), /password leaked/i);
});

test('client-safe API errors retain the status and message', () => {
  const res = responseStub();
  errorHandler(Object.assign(new Error('Invalid article ID.'), { status: 400 }), { path: '/api/v1/admin/articles/x' }, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: 'Invalid article ID.' });
});
