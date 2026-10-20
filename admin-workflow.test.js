import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'noor-admin-test-'));
process.env.DATA_DIR = dataDir;
process.env.ADMIN_SECRET_CODE = 'test-admin-secret-only';
process.env.SESSION_SECRET = 'test-session-secret-long-enough-for-tests';
process.env.NODE_ENV = 'development';

const { default: app } = await import('../backend/app.js');
const { initializeDatabase } = await import('../backend/database/connection.js');
initializeDatabase();
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

async function request(route, options = {}, cookie = '') {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;
  if (options.body && !headers['content-type']) headers['content-type'] = 'application/json';
  const response = await fetch(base + route, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body };
}

test('admin auth, article CRUD, public publishing and backup flow', async () => {
  const unauth = await request('/api/v1/admin/articles');
  assert.equal(unauth.response.status, 401);

  const badLogin = await request('/api/v1/admin/login', {
    method: 'POST', body: JSON.stringify({ secretCode: 'wrong' })
  });
  assert.equal(badLogin.response.status, 401);

  const login = await request('/api/v1/admin/login', {
    method: 'POST', body: JSON.stringify({ secretCode: process.env.ADMIN_SECRET_CODE })
  });
  assert.equal(login.response.status, 200);
  const setCookie = login.response.headers.get('set-cookie');
  assert.ok(setCookie, 'login should issue an HTTP cookie');
  const cookie = setCookie.split(';')[0];

  const session = await request('/api/v1/admin/session', {}, cookie);
  assert.equal(session.response.status, 200);
  assert.equal(session.body.authenticated, true);

  const created = await request('/api/v1/admin/articles', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Integration Test Article',
      contentHtml: '<h2>Heading</h2><p>Article body</p>',
      status: 'published',
      category: 'Test'
    })
  }, cookie);
  assert.equal(created.response.status, 201);
  assert.equal(created.body.article.slug, 'integration-test-article');
  const id = created.body.article.id;

  const publicList = await request('/api/v1/articles');
  assert.equal(publicList.response.status, 200);
  assert.ok(publicList.body.articles.some(a => a.slug === 'integration-test-article'));

  const publicArticle = await request('/api/v1/articles/integration-test-article');
  assert.equal(publicArticle.response.status, 200);
  assert.match(publicArticle.body.article.content_html, /Article body/);

  const detail = await request(`/api/v1/admin/articles/${id}`, {}, cookie);
  assert.equal(detail.response.status, 200);
  assert.match(detail.body.article.content_html, /Heading/);

  const updated = await request(`/api/v1/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Updated Integration Test',
      contentHtml: '<p>Updated content</p>',
      status: 'draft',
      category: 'Test'
    })
  }, cookie);
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.article.status, 'draft');

  const hiddenPublic = await request('/api/v1/articles/updated-integration-test');
  assert.equal(hiddenPublic.response.status, 404);

  const backup = await request('/api/v1/admin/backup', {}, cookie);
  assert.equal(backup.response.status, 200);
  assert.ok(backup.response.headers.get('content-disposition')?.includes('attachment'), 'backup should be served as a downloadable attachment');

  const deleted = await request(`/api/v1/admin/articles/${id}`, { method: 'DELETE' }, cookie);
  assert.equal(deleted.response.status, 200);
  const gone = await request(`/api/v1/admin/articles/${id}`, {}, cookie);
  assert.equal(gone.response.status, 404);

  const logout = await request('/api/v1/admin/logout', { method: 'POST', body: '{}' }, cookie);
  assert.equal(logout.response.status, 200);
  const afterLogout = await request('/api/v1/admin/session', {}, cookie);
  assert.equal(afterLogout.response.status, 401);
});

test.after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
