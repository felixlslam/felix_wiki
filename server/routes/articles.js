const express = require('express');
const slugify = require('slugify');
const db = require('../db');
const router = express.Router();

function nowISO() { return new Date().toISOString(); }

// List
router.get('/', (req, res) => {
  // include parentSlug so frontend can build hierarchy
  const rows = db.listArticles().map(({ id, slug, title, createdAt, updatedAt, parentSlug }) => ({ id, slug, title, createdAt, updatedAt, parentSlug }));
  res.json(rows);
});

// Get by slug
// NOTE: keep more specific routes (like /search) before the '/:slug' catch-all

// Search (q query param) - path: /api/articles/search?q=...
router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const spaceParam = req.query.space;
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

  let spaceId;
  if (spaceParam) {
    const s = db.getSpace(String(spaceParam));
    if (s) spaceId = s.id;
  }

  const { total, results } = db.searchArticles(q, { spaceId, limit, offset });
  // return results already shaped with excerpt and score
  res.json({ q, total, limit, offset, results });
});

// Unified search (spaces + articles) - path: /api/articles/search-all?q=...
router.get('/search-all', (req, res) => {
  const q = req.query.q || '';
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

  const { total, results } = db.searchAll(q, { limit, offset });
  res.json({ q, total, limit, offset, results });
});

// Get by slug
router.get('/:slug', (req, res) => {
  const row = db.getArticle(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Get version history for an article
router.get('/:slug/versions', (req, res) => {
  const article = db.getArticle(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  const versions = db.getArticleVersions(article.id);
  res.json(versions);
});

// Get specific version content
router.get('/:slug/versions/:versionId', (req, res) => {
  const article = db.getArticle(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  const versionId = parseInt(req.params.versionId, 10);
  const versions = db.getArticleVersions(article.id);
  const version = versions.find(v => v.id === versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });
  res.json(version);
});

// Restore article to a specific version
router.post('/:slug/restore', (req, res) => {
  const { versionId } = req.body || {};
  if (!versionId) return res.status(400).json({ error: 'versionId required' });
  const restored = db.restoreArticleVersion(req.params.slug, parseInt(versionId, 10));
  if (!restored) return res.status(404).json({ error: 'Article or version not found' });
  res.json(restored);
});


// Create
router.post('/', (req, res) => {
  const { title, bodyMarkdown, parentSlug, spaceId } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const slugBase = slugify(title, { lower: true, strict: true });
  let slug = slugBase;
  let suffix = 1;
  while (db.getArticle(slug)) {
    slug = `${slugBase}-${suffix++}`;
  }
  const createdAt = nowISO();
  const updatedAt = createdAt;
  const newRow = db.createArticle({ slug, title, bodyMarkdown: bodyMarkdown || '', parentSlug, spaceId, createdAt, updatedAt });
  res.status(201).json(newRow);
});

// Update
router.put('/:slug', (req, res) => {
  const { title, bodyMarkdown, parentSlug } = req.body || {};
  const slug = req.params.slug;
  const row = db.getArticle(slug);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const updated = db.updateArticle(slug, { title, bodyMarkdown, parentSlug });
  res.json(updated);
});

// Delete
router.delete('/:slug', (req, res) => {
  const slug = req.params.slug;
  const ok = db.deleteArticle(slug);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
