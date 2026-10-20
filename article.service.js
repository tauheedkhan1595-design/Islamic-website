import slugify from 'slugify';
import sanitizeHtml from 'sanitize-html';
import { articlesRepository } from '../database/repositories/articles.repository.js';

const allowedTags = [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2', 'h3', 'u', 's', 'hr', 'figure', 'figcaption', 'details', 'summary', 'mark'];
const allowedAttributes = {
  a: ['href', 'name', 'target', 'rel'],
  '*': ['dir', 'lang', 'class']
};
export function sanitizeArticleHtml(input = '') {
  return sanitizeHtml(String(input), {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }, true)
    },
    exclusiveFilter: frame => ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'video', 'audio', 'img'].includes(frame.tag)
  });
}
export function normalizeArticlePayload(body = {}) {
  const title = String(body.title || '').trim().slice(0, 180);
  const rawHtml = String(body.contentHtml || body.content_html || '').trim();
  if (!title) throw Object.assign(new Error('Article title is required.'), { status: 400 });
  if (!rawHtml) throw Object.assign(new Error('Article content is required.'), { status: 400 });
  const content_html = sanitizeArticleHtml(rawHtml);
  if (!content_html.replace(/<[^>]*>/g, '').trim()) throw Object.assign(new Error('Article content is empty after safety filtering.'), { status: 400 });
  const baseSlug = slugify(String(body.slug || title), { lower: true, strict: true, trim: true }) || `article-${Date.now()}`;
  const category = String(body.category || 'General').trim().slice(0, 80) || 'General';
  const status = body.status === 'published' ? 'published' : 'draft';
  const excerpt = String(body.excerpt || content_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 320);
  const seo_title = String(body.seoTitle || body.seo_title || title).trim().slice(0, 180);
  const seo_description = String(body.seoDescription || body.seo_description || excerpt).trim().slice(0, 320);
  return { title, slug: baseSlug, excerpt, content_html, status, category, seo_title, seo_description };
}
export const articleService = {
  listPublic: opts => articlesRepository.listPublished(opts),
  getPublic: slug => articlesRepository.getPublishedBySlug(slug),
  listAdmin: () => articlesRepository.listAll(),
  getAdmin: id => articlesRepository.getById(id),
  create(body) {
    const payload = normalizeArticlePayload(body);
    payload.slug = uniqueSlug(payload.slug);
    return articlesRepository.create(payload);
  },
  update(id, body) {
    const payload = normalizeArticlePayload(body);
    payload.slug = uniqueSlug(payload.slug, Number(id));
    return articlesRepository.update(Number(id), payload);
  },
  delete: id => articlesRepository.remove(Number(id))
};
function uniqueSlug(base, exceptId = null) {
  const db = (awaitlessDb());
  let candidate = base, n = 2;
  while (true) {
    const row = exceptId
      ? db.prepare('SELECT id FROM articles WHERE slug=? AND id<>?').get(candidate, exceptId)
      : db.prepare('SELECT id FROM articles WHERE slug=?').get(candidate);
    if (!row) return candidate;
    candidate = `${base}-${n++}`;
  }
}
function awaitlessDb() {
  // Repository and service share the same initialized SQLite connection.
  return databaseAccessor();
}
import { getDatabase as databaseAccessor } from '../database/connection.js';
