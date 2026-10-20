import { articleService } from '../services/article.service.js';
export function health(req, res) { res.json({ ok: true, service: 'islamic-editorial-cms', time: new Date().toISOString() }); }
export function listArticles(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  res.json({ articles: articleService.listPublic({ q: String(req.query.q || '').slice(0, 100), category: String(req.query.category || '').slice(0, 80), limit, offset }) });
}
export function getArticle(req, res) {
  const article = articleService.getPublic(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Article not found.' });
  res.json({ article });
}
