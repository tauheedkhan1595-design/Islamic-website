import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../config/env.js';
import { getDatabase } from '../database/connection.js';
import { articleService } from '../services/article.service.js';
import { issueAdminCookie, clearAdminCookie, revokeAdminSession } from '../middleware/admin-auth.js';

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && aa.length > 0 && crypto.timingSafeEqual(aa, bb);
}
export function login(req, res) {
  const cfg = getConfig();
  if (!cfg.adminSecretCode || !cfg.sessionSecret) return res.status(503).json({ error: 'Admin secrets are not configured. Set ADMIN_SECRET_CODE and SESSION_SECRET.' });
  if (!safeEqual(req.body?.secretCode, cfg.adminSecretCode)) return res.status(401).json({ error: 'Incorrect secret code.' });
  issueAdminCookie(res);
  res.json({ ok: true, message: 'Admin session started.' });
}
export function logout(req, res) { revokeAdminSession(req); clearAdminCookie(res); res.json({ ok: true }); }
export function session(req, res) { res.json({ authenticated: true, role: 'admin' }); }
export function listArticles(req, res) { res.json({ articles: articleService.listAdmin() }); }
export function getArticle(req, res) {
  const article = articleService.getAdmin(req.articleId);
  if (!article) return res.status(404).json({ error: 'Article not found.' });
  res.json({ article });
}
export function createArticle(req, res) {
  try { res.status(201).json({ article: articleService.create(req.body) }); }
  catch (e) { res.status(e.status || 400).json({ error: e.message }); }
}
export function updateArticle(req, res) {
  try {
    const article = articleService.update(req.articleId, req.body);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    res.json({ article });
  } catch (e) { res.status(e.status || 400).json({ error: e.message }); }
}
export function deleteArticle(req, res) {
  if (!articleService.delete(req.articleId)) return res.status(404).json({ error: 'Article not found.' });
  res.json({ ok: true });
}
export function backup(req, res) {
  const cfg = getConfig();
  const db = getDatabase();
  db.pragma('wal_checkpoint(TRUNCATE)');
  const file = path.resolve(cfg.dataDir, 'content.sqlite');
  res.download(file, `islamic-editorial-backup-${new Date().toISOString().slice(0,10)}.sqlite`);
}
