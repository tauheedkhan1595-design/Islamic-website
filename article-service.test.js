import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeArticleHtml, normalizeArticlePayload } from '../backend/services/article.service.js';

test('requires a title and content', () => {
  assert.throws(() => normalizeArticlePayload({ title: '', contentHtml: '<p>Body</p>' }), /title is required/i);
  assert.throws(() => normalizeArticlePayload({ title: 'Title', contentHtml: '' }), /content is required/i);
});
test('removes scripts, event handlers, images and unsafe links', () => {
  const clean = sanitizeArticleHtml('<h2>Title</h2><script>alert(1)</script><p onclick="evil()">Hello</p><img src="x"><a href="javascript:alert(1)">bad</a>');
  assert.match(clean, /<h2>Title<\/h2>/);
  assert.doesNotMatch(clean, /script|onclick|<img|javascript:/i);
});
test('normalizes slug and default SEO metadata', () => {
  const value = normalizeArticlePayload({ title: 'A Test Article', contentHtml: '<p>Useful text</p>', status: 'published' });
  assert.equal(value.slug, 'a-test-article');
  assert.equal(value.status, 'published');
  assert.equal(value.seo_title, 'A Test Article');
  assert.match(value.content_html, /Useful text/);
});
