const express = require('express');
const slugify = require('slugify');
const db = require('../db');
const router = express.Router();

// List spaces
router.get('/', (req, res) => {
  const spaces = db.listSpaces();
  res.json(spaces);
});

// Get space by slug
router.get('/:slug', (req, res) => {
  const space = db.getSpace(req.params.slug);
  if (!space) return res.status(404).json({ error: 'Space not found' });
  res.json(space);
});

// Create space
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  
  const slugBase = slugify(name, { lower: true, strict: true });
  let slug = slugBase;
  let suffix = 1;
  while (db.getSpace(slug)) {
    slug = `${slugBase}-${suffix++}`;
  }

  const space = db.createSpace({ slug, name });
  res.status(201).json(space);
});

// Update space
router.put('/:slug', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  
  const space = db.updateSpace(req.params.slug, { name });
  if (!space) return res.status(404).json({ error: 'Space not found' });
  
  res.json(space);
});

// Delete space
router.delete('/:slug', (req, res) => {
  if (req.params.slug === 'default') {
    return res.status(400).json({ error: 'Cannot delete default space' });
  }
  
  const deleted = db.deleteSpace(req.params.slug);
  if (!deleted) return res.status(404).json({ error: 'Space not found' });
  
  res.json({ success: true });
});

// List articles in space
router.get('/:slug/articles', (req, res) => {
  const space = db.getSpace(req.params.slug);
  if (!space) return res.status(404).json({ error: 'Space not found' });
  
  const articles = db.listArticles(space.id)
    .map(({ id, slug, title, createdAt, updatedAt, parentSlug }) => 
      ({ id, slug, title, createdAt, updatedAt, parentSlug }));
  
  res.json(articles);
});

module.exports = router;