import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('all referenced frontend assets exist', () => {
  for (const htmlPath of ['frontend/pages/index.html','frontend/pages/article.html','admin/index.html']) {
    const html = read(htmlPath);
    for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg))"/g)) {
      const url = match[1];
      if (/^(https?:|data:|#)/i.test(url)) continue;
      const mapped = url.startsWith('/admin/') ? url.slice(1) :
        url.startsWith('/styles/') ? `frontend${url}` :
        url.startsWith('/scripts/') ? `frontend${url}` : url === '/favicon.svg' ? 'frontend/pages/favicon.svg' : null;
      assert.ok(mapped && fs.existsSync(path.join(root, mapped)), `${htmlPath} references missing asset ${url}`);
    }
  }
});

test('all public and admin API paths used by the browser are registered', () => {
  const adminJs = read('admin/scripts/admin.js');
  const homeJs = read('frontend/scripts/home.js');
  const articleJs = read('frontend/scripts/article.js');
  const publicRoutes = read('backend/routes/api/v1/public.routes.js');
  const adminRoutes = read('backend/routes/api/v1/admin.routes.js');
  for (const route of ['/login','/logout','/session','/articles','/backup']) {
    assert.ok(adminRoutes.includes(route), `admin route missing ${route}`);
  }
  assert.match(adminRoutes, /router\.get\('\/articles\/:id'/);
  assert.match(adminRoutes, /router\.put\('\/articles\/:id'/);
  assert.match(adminRoutes, /router\.delete\('\/articles\/:id'/);
  assert.match(publicRoutes, /router\.get\('\/health'/);
  assert.match(publicRoutes, /router\.get\('\/articles'/);
  assert.match(publicRoutes, /router\.get\('\/articles\/:slug'/);
  assert.match(adminJs, /\/api\/v1\/admin\/articles/);
  assert.match(adminJs, /\/api\/v1\/admin\/backup/);
  assert.match(homeJs, /\/api\/v1\/articles/);
  assert.match(articleJs, /\/api\/v1\/articles\//);
});

test('Render configuration includes deploy commands, health check and persistent SQLite disk', () => {
  const render = read('render.yaml');
  assert.match(render, /runtime:\s*node/);
  assert.match(render, /buildCommand:\s*npm install/);
  assert.match(render, /npm run check/);
  assert.match(render, /npm test/);
  assert.match(render, /startCommand:\s*npm start/);
  assert.match(render, /healthCheckPath:\s*\/api\/v1\/health/);
  assert.match(render, /mountPath:\s*\/var\/data/);
  assert.match(render, /key:\s*ADMIN_SECRET_CODE\s*\n\s*sync:\s*false/);
  assert.match(render, /key:\s*SESSION_SECRET\s*\n\s*generateValue:\s*true/);
});


test('Smart Paste uses inert HTML parsing and keeps semantic inline formatting', () => {
  const admin = read('admin/scripts/admin.js');
  assert.match(admin, /document\.createElement\('template'\)/);
  assert.match(admin, /script,style,iframe,object,embed,form,input,button,video,audio,img,source,track,svg,canvas,link,meta/);
  assert.match(admin, /wrapContents\('strong'\)/);
  assert.match(admin, /wrapContents\('em'\)/);
  assert.match(admin, /wrapContents\('u'\)/);
});

test('API body limit accommodates HTML imports and their JSON metadata', () => {
  const app = read('backend/app.js');
  const admin = read('admin/scripts/admin.js');
  assert.match(admin, /file\.size>2\*1024\*1024/);
  assert.match(app, /express\.json\(\{ limit: '3mb' \}\)/);
  assert.match(app, /express\.urlencoded\(\{ extended: false, limit: '3mb' \}\)/);
});

test('admin small text meets WCAG AA contrast on paper and white surfaces', () => {
  const css = read('admin/styles/admin.css');
  const muted = css.match(/--muted:(#[0-9a-f]{6})/i)?.[1];
  const placeholder = css.match(/\.paste-area:empty:before\{[^}]*color:(#[0-9a-f]{6})/i)?.[1];
  assert.ok(muted, 'admin muted text color must be defined');
  assert.ok(placeholder, 'editor placeholder color must be defined');
  const luminance = hex => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const linear = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const contrast = (a, b) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  assert.ok(contrast(muted, '#f6f7f3') >= 4.5, `muted text contrast is ${contrast(muted, '#f6f7f3').toFixed(2)}:1`);
  assert.ok(contrast(placeholder, '#ffffff') >= 4.5, `placeholder contrast is ${contrast(placeholder, '#ffffff').toFixed(2)}:1`);
});

test('security middleware and admin route guards are configured', () => {
  const app = read('backend/app.js');
  const auth = read('backend/middleware/admin-auth.js');
  const routes = read('backend/routes/api/v1/admin.routes.js');
  assert.match(app, /app\.disable\('x-powered-by'\)/);
  assert.match(app, /app\.use\(helmet\(/);
  assert.match(app, /frameAncestors:\s*\["'none'"\]/);
  assert.match(app, /scriptSrc:\s*\["'self'"\]/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(auth, /sameSite:\s*'strict'/);
  assert.match(auth, /crypto\.timingSafeEqual/);
  assert.match(auth, /expires_at/);
  for (const path of ['/logout','/session','/articles','/articles/:id','/backup']) {
    assert.ok(routes.includes(`'${path}'`), `admin route missing ${path}`);
  }
  assert.match(routes, /router\.get\('\/articles\/:id', requireAdmin/);
  assert.match(routes, /router\.put\('\/articles\/:id', requireAdmin/);
  assert.match(routes, /router\.delete\('\/articles\/:id', requireAdmin/);
});

test('no real admin secret is committed in project source', () => {
  const forbidden = '786' + '78655';
  const files = [];
  const walk = dir => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory() && ent.name !== 'node_modules' && ent.name !== '.git') walk(full);
      else if (ent.isFile() && !/\.zip$/i.test(ent.name)) files.push(full);
    }
  };
  walk(root);
  for (const file of files) assert.ok(!fs.readFileSync(file, 'utf8').includes(forbidden), `secret found in ${path.relative(root,file)}`);
});
