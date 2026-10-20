import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArticleId } from '../backend/validators/article.validator.js';

function run(value) {
  const req = { params: { id: value } };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let continued = false;
  validateArticleId(req, res, () => { continued = true; });
  return { req, res, continued };
}

test('accepts a positive safe integer article ID', () => {
  const result = run('12');
  assert.equal(result.continued, true);
  assert.equal(result.req.articleId, 12);
  assert.equal(result.res.statusCode, 200);
});

test('rejects malformed, non-positive and unsafe article IDs', () => {
  for (const id of ['abc', '', '0', '-1', '1.5', '9007199254740992']) {
    const result = run(id);
    assert.equal(result.continued, false, `unexpectedly accepted ${id}`);
    assert.equal(result.res.statusCode, 400);
    assert.equal(result.res.body.error, 'Invalid article ID.');
  }
});
