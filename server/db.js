const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { 
      articles: [],
      spaces: [
        { id: 1, slug: 'default', name: 'Default Space', createdAt: new Date().toISOString(), homePageSlug: null }
      ],
      articleVersions: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Normalize existing DBs: ensure spaces and spaceId on articles
    if (!db.spaces || !Array.isArray(db.spaces) || db.spaces.length === 0) {
      db.spaces = [
        { id: 1, slug: 'default', name: 'Default Space', createdAt: new Date().toISOString(), homePageSlug: null }
      ];
    }
    // Add homePageSlug to spaces that don't have it
    db.spaces = db.spaces.map(s => ({
      ...s,
      homePageSlug: s.homePageSlug || null
    }));
    if (Array.isArray(db.articles)) {
      db.articles = db.articles.map(a => ({
        ...a,
        spaceId: a.spaceId || 1,
      }));
    } else {
      db.articles = [];
    }
    // Initialize articleVersions if missing
    if (!Array.isArray(db.articleVersions)) {
      db.articleVersions = [];
    }
    return db;
  } catch (err) {
    console.error('Failed reading DB, reinitializing', err);
    const init = { 
      articles: [],
      spaces: [
        { id: 1, slug: 'default', name: 'Default Space', createdAt: new Date().toISOString(), homePageSlug: null }
      ],
      articleVersions: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = {
  getArticle(slug) {
    const db = readDB();
    return db.articles.find(a => a.slug === slug) || null;
  },
  createArticle({ slug, title, bodyMarkdown, parentSlug, spaceId, createdAt, updatedAt }) {
    const db = readDB();
    const id = db.articles.length ? (Math.max(...db.articles.map(a=>a.id)) + 1) : 1;
    const article = { 
      id, 
      slug, 
      title, 
      bodyMarkdown: bodyMarkdown || '', 
      parentSlug,
      spaceId: spaceId || 1,
      createdAt, 
      updatedAt,
      currentVersion: 1
    };
    db.articles.push(article);
    
    // Create initial version (v1)
    const versionId = db.articleVersions.length ? (Math.max(...db.articleVersions.map(v=>v.id)) + 1) : 1;
    db.articleVersions.push({
      id: versionId,
      articleId: article.id,
      version: 1,
      title,
      bodyMarkdown: bodyMarkdown || '',
      createdAt: createdAt || new Date().toISOString()
    });
    
    writeDB(db);
    return article;
  },
  updateArticle(slug, { title, bodyMarkdown, parentSlug }) {
    const db = readDB();
    const idx = db.articles.findIndex(a => a.slug === slug);
    if (idx === -1) return null;
    
    const article = db.articles[idx];
    const newVersion = (article.currentVersion || 1) + 1;
    
    // Update article with new content
    db.articles[idx].title = title ?? db.articles[idx].title;
    db.articles[idx].bodyMarkdown = bodyMarkdown ?? db.articles[idx].bodyMarkdown;
    if (parentSlug !== undefined) db.articles[idx].parentSlug = parentSlug;
    db.articles[idx].updatedAt = new Date().toISOString();
    db.articles[idx].currentVersion = newVersion;
    
    // Create new version entry
    const versionId = db.articleVersions.length ? (Math.max(...db.articleVersions.map(v=>v.id)) + 1) : 1;
    db.articleVersions.push({
      id: versionId,
      articleId: article.id,
      version: newVersion,
      title: db.articles[idx].title,
      bodyMarkdown: db.articles[idx].bodyMarkdown,
      createdAt: new Date().toISOString()
    });
    
    writeDB(db);
    return db.articles[idx];
  },
  deleteArticle(slug) {
    const db = readDB();
    const before = db.articles.length;
    db.articles = db.articles.filter(a => a.slug !== slug);
    writeDB(db);
    return db.articles.length !== before;
  },
  search(q) {
    // Backwards compatible simple search across all spaces
    return module.exports.searchArticles(q, {});
  },

  // Simple full-text search helper with optional spaceId, limit and offset
  // Returns { total, results: [{ id, slug, title, parentSlug, excerpt, score }] }
  searchArticles(q, opts = {}) {
    const { spaceId, limit = 20, offset = 0 } = opts || {};
    if (!q || !String(q).trim()) return { total: 0, results: [] };
    const db = readDB();
    const nq = String(q).toLowerCase();

    function excerptForMatch(text = '') {
      const t = String(text || '');
      const idx = t.toLowerCase().indexOf(nq);
      if (idx === -1) return (t.length > 140) ? t.slice(0, 140) + '…' : t;
      const start = Math.max(0, idx - 60);
      const end = Math.min(t.length, idx + nq.length + 60);
      return (start > 0 ? '…' : '') + t.slice(start, end).replace(/\s+/g, ' ') + (end < t.length ? '…' : '');
    }

    const candidates = db.articles.filter(a => {
      if (typeof spaceId !== 'undefined' && a.spaceId !== spaceId) return false;
      const title = (a.title || '').toLowerCase();
      const body = (a.bodyMarkdown || '').toLowerCase();
      return title.includes(nq) || body.includes(nq);
    });

    const scored = candidates.map(a => {
      const title = (a.title || '');
      const body = (a.bodyMarkdown || '');
      const titleIdx = title.toLowerCase().indexOf(nq);
      const bodyIdx = body.toLowerCase().indexOf(nq);
      let score = 0;
      if (titleIdx !== -1) score += 200 - titleIdx; // title matches are stronger
      if (bodyIdx !== -1) score += 100 - Math.floor(bodyIdx/10);
      // small boost for exact word match
      const wordRegex = new RegExp('\\b' + nq.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
      if (wordRegex.test(title + ' ' + body)) score += 10;
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        parentSlug: a.parentSlug,
        spaceId: a.spaceId,
        excerpt: excerptForMatch(body || title),
        score,
        updatedAt: a.updatedAt
      };
    });

    scored.sort((x, y) => {
      if (y.score !== x.score) return y.score - x.score;
      return (y.updatedAt < x.updatedAt) ? -1 : 1;
    });

    const total = scored.length;
    const results = scored.slice(offset, offset + limit);
    return { total, results };
  },

  // Unified search (spaces + articles)
  searchAll(q, opts = {}) {
    const { limit = 20, offset = 0 } = opts || {};
    if (!q || !String(q).trim()) return { total: 0, results: [] };
    const db = readDB();
    const nq = String(q).toLowerCase();

    const spaceResults = [];
    const articleResults = [];

    // Search spaces
    db.spaces.forEach(space => {
      const name = (space.name || '').toLowerCase();
      if (name.includes(nq)) {
        const nameIdx = name.indexOf(nq);
        spaceResults.push({
          type: 'space',
          id: space.id,
          slug: space.slug,
          name: space.name,
          score: 300 - nameIdx, // Spaces get higher base score
        });
      }
    });

    // Search articles
    const articleSearch = this.searchArticles(q, { limit: 100 });
    articleSearch.results.forEach(article => {
      articleResults.push({
        type: 'article',
        ...article,
      });
    });

    // Combine and sort
    const allResults = [...spaceResults, ...articleResults];
    allResults.sort((a, b) => {
      // Spaces always first if both match
      if (a.type === 'space' && b.type === 'article') return -1;
      if (a.type === 'article' && b.type === 'space') return 1;
      return b.score - a.score;
    });

    const total = allResults.length;
    const results = allResults.slice(offset, offset + limit);
    return { total, results };
  },

  // Space management
  listSpaces() {
    const db = readDB();
    return db.spaces.slice().sort((a, b) => a.name.localeCompare(b.name));
  },

  getSpace(slug) {
    const db = readDB();
    return db.spaces.find(s => s.slug === slug) || null;
  },

  createSpace({ slug, name }) {
    const db = readDB();
    const id = db.spaces.length ? Math.max(...db.spaces.map(s => s.id)) + 1 : 1;
    const space = {
      id,
      slug,
      name,
      homePageSlug: null,
      createdAt: new Date().toISOString()
    };
    db.spaces.push(space);
    writeDB(db);
    return space;
  },

  updateSpace(slug, { name, homePageSlug }) {
    const db = readDB();
    const idx = db.spaces.findIndex(s => s.slug === slug);
    if (idx === -1) return null;
    if (name !== undefined) db.spaces[idx].name = name;
    if (homePageSlug !== undefined) db.spaces[idx].homePageSlug = homePageSlug;
    writeDB(db);
    return db.spaces[idx];
  },

  deleteSpace(slug) {
    const db = readDB();
    const space = db.spaces.find(s => s.slug === slug);
    if (!space) return false;
    const before = db.spaces.length;
    db.spaces = db.spaces.filter(s => s.slug !== slug);
    // Remove all articles that belonged to the deleted space.
    // Deleting a space permanently removes its pages to avoid silently mixing content into other spaces.
    const deletedArticleIds = db.articles.filter(a => a.spaceId === space.id).map(a => a.id);
    db.articles = db.articles.filter(a => a.spaceId !== space.id);
    // Also delete all versions of deleted articles
    db.articleVersions = db.articleVersions.filter(v => !deletedArticleIds.includes(v.articleId));
    writeDB(db);
    return db.spaces.length !== before;
  },

  // Update article listing to support spaces
  listArticles(spaceId) {
    const db = readDB();
    const articles = spaceId 
      ? db.articles.filter(a => a.spaceId === spaceId)
      : db.articles;
    return articles.slice().sort((a,b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },

  // Article version management
  getArticleVersions(articleId) {
    const db = readDB();
    return db.articleVersions
      .filter(v => v.articleId === articleId)
      .sort((a, b) => b.version - a.version); // Most recent first
  },

  getArticleVersion(articleId, version) {
    const db = readDB();
    return db.articleVersions.find(v => v.articleId === articleId && v.version === version) || null;
  },

  restoreArticleVersion(slug, versionId) {
    const db = readDB();
    const article = db.articles.find(a => a.slug === slug);
    if (!article) return null;

    const version = db.articleVersions.find(v => v.id === versionId && v.articleId === article.id);
    if (!version) return null;

    // Create a new version with the restored content
    const newVersion = (article.currentVersion || 1) + 1;
    const idx = db.articles.findIndex(a => a.id === article.id);
    
    db.articles[idx].title = version.title;
    db.articles[idx].bodyMarkdown = version.bodyMarkdown;
    db.articles[idx].updatedAt = new Date().toISOString();
    db.articles[idx].currentVersion = newVersion;

    // Create new version entry (restoration creates a new version)
    const newVersionId = db.articleVersions.length ? (Math.max(...db.articleVersions.map(v=>v.id)) + 1) : 1;
    db.articleVersions.push({
      id: newVersionId,
      articleId: article.id,
      version: newVersion,
      title: version.title,
      bodyMarkdown: version.bodyMarkdown,
      createdAt: new Date().toISOString(),
      restoredFrom: version.version
    });

    writeDB(db);
    return db.articles[idx];
  }
}
