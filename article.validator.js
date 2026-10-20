export function validateArticleId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid article ID.' });
  req.articleId = id;
  next();
}
