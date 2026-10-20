import { getDatabase } from '../connection.js';

export const articlesRepository = {
  listPublished({ q = '', category = '', limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    const clauses = ["status = 'published'"];
    const params = [];
    if (q) { clauses.push('(title LIKE ? OR excerpt LIKE ? OR content_html LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (category) { clauses.push('category = ?'); params.push(category); }
    params.push(limit, offset);
    return db.prepare(`SELECT id,title,slug,excerpt,category,seo_title,seo_description,published_at,created_at FROM articles WHERE ${clauses.join(' AND ')} ORDER BY published_at DESC LIMIT ? OFFSET ?`).all(...params);
  },
  getPublishedBySlug(slug) {
    return getDatabase().prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published'").get(slug);
  },
  listAll() {
    return getDatabase().prepare('SELECT id,title,slug,excerpt,category,status,updated_at,published_at FROM articles ORDER BY updated_at DESC').all();
  },
  getById(id) { return getDatabase().prepare('SELECT * FROM articles WHERE id = ?').get(id); },
  create(article) {
    const now = new Date().toISOString();
    const result = getDatabase().prepare(`INSERT INTO articles(title,slug,excerpt,content_html,status,category,seo_title,seo_description,created_at,updated_at,published_at)
      VALUES(@title,@slug,@excerpt,@content_html,@status,@category,@seo_title,@seo_description,@created_at,@updated_at,@published_at)`)
      .run({ ...article, created_at: now, updated_at: now, published_at: article.status === 'published' ? now : null });
    return this.getById(Number(result.lastInsertRowid));
  },
  update(id, article) {
    const existing = this.getById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const publishedAt = article.status === 'published' ? (existing.published_at || now) : null;
    getDatabase().prepare(`UPDATE articles SET title=@title,slug=@slug,excerpt=@excerpt,content_html=@content_html,status=@status,category=@category,seo_title=@seo_title,seo_description=@seo_description,updated_at=@updated_at,published_at=@published_at WHERE id=@id`)
      .run({ ...article, id, updated_at: now, published_at: publishedAt });
    return this.getById(id);
  },
  remove(id) { return getDatabase().prepare('DELETE FROM articles WHERE id = ?').run(id).changes > 0; }
};
