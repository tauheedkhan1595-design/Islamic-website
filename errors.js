export function notFound(req, res) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  res.status(404).sendFile(new URL('../../frontend/pages/404.html', import.meta.url).pathname);
}
export function errorHandler(err, req, res, next) {
  const status = Number(err.status) || 500;
  if (status >= 500) console.error('Request failed:', err.message);
  if (req.path.startsWith('/api/')) return res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
  res.status(status).send(status >= 500 ? 'Something went wrong.' : err.message);
}
