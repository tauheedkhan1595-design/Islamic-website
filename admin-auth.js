import { getConfig } from '../config/env.js';
import { getDatabase } from '../database/connection.js';
import crypto from 'node:crypto';

const cookieName = 'editorial_admin';
function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}
export function issueAdminCookie(res) {
  const cfg = getConfig();
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(18).toString('hex');
  const payload = `${timestamp}.${nonce}`;
  getDatabase().prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(timestamp);
  getDatabase().prepare('INSERT INTO admin_sessions(nonce, expires_at, created_at) VALUES(?,?,?)')
    .run(nonce, timestamp + 8 * 60 * 60 * 1000, new Date(timestamp).toISOString());
  const value = `${payload}.${sign(payload, cfg.sessionSecret)}`;
  res.cookie(cookieName, value, {
    httpOnly: true,
    secure: cfg.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000
  });
}
export function revokeAdminSession(req) {
  const value = req.cookies?.[cookieName] || '';
  const parts = value.split('.');
  if (parts.length === 3 && /^[a-f0-9]{36}$/.test(parts[1])) {
    getDatabase().prepare('DELETE FROM admin_sessions WHERE nonce = ?').run(parts[1]);
  }
}
export function clearAdminCookie(res) {
  res.clearCookie(cookieName, { httpOnly: true, secure: getConfig().nodeEnv === 'production', sameSite: 'strict', path: '/' });
}
export function requireAdmin(req, res, next) {
  const cfg = getConfig();
  const value = req.cookies?.[cookieName] || '';
  const parts = value.split('.');
  if (!cfg.sessionSecret || parts.length !== 3) return res.status(401).json({ error: 'Admin login required.' });
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload, cfg.sessionSecret);
  const provided = parts[2];
  const valid = provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  const age = Date.now() - Number(parts[0]);
  if (!valid || !Number.isFinite(age) || age < 0 || age > 8 * 60 * 60 * 1000) return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
  const session = getDatabase().prepare('SELECT nonce FROM admin_sessions WHERE nonce = ? AND expires_at >= ?').get(parts[1], Date.now());
  if (!session) return res.status(401).json({ error: 'Admin session expired or revoked. Please log in again.' });
  next();
}
