const API_BASE = 'http://localhost:4000/api';

export interface Article {
  id: number;
  slug: string;
  title: string;
  bodyMarkdown?: string;
  parentSlug?: string;
  spaceId: number;
  createdAt: string;
  updatedAt: string;
  currentVersion?: number;
}

export interface ArticleVersion {
  id: number;
  articleId: number;
  version: number;
  title: string;
  bodyMarkdown: string;
  createdAt: string;
  restoredFrom?: number;
}

export interface Space {
  id: number;
  slug: string;
  name: string;
  homePageSlug?: string | null;
  createdAt: string;
}

// Articles API
export const articles = {
  async list(spaceSlug?: string): Promise<Article[]> {
    const url = spaceSlug 
      ? `${API_BASE}/spaces/${encodeURIComponent(spaceSlug)}/articles`
      : `${API_BASE}/articles`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch articles');
    return res.json();
  },

  async get(slug: string): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch article');
    return res.json();
  },

  async create(article: { 
    title: string, 
    bodyMarkdown?: string, 
    parentSlug?: string,
    spaceId?: number 
  }): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (!res.ok) throw new Error('Failed to create article');
    return res.json();
  },

  async update(slug: string, article: {
    title?: string,
    bodyMarkdown?: string,
    parentSlug?: string
  }): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(article)
    });
    if (!res.ok) throw new Error('Failed to update article');
    return res.json();
  },

  async delete(slug: string): Promise<void> {
    const res = await fetch(`${API_BASE}/articles/${slug}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete article');
  },

  async search(query: string, opts?: { space?: string, limit?: number, offset?: number }): Promise<any> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (opts?.space) params.set('space', opts.space);
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.offset) params.set('offset', String(opts.offset));
    const res = await fetch(`${API_BASE}/articles/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search articles');
    return res.json();
  },

  async searchAll(query: string, opts?: { limit?: number, offset?: number }): Promise<any> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.offset) params.set('offset', String(opts.offset));
    const res = await fetch(`${API_BASE}/articles/search-all?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search');
    return res.json();
  },

  // Version management
  async getVersions(slug: string): Promise<ArticleVersion[]> {
    const res = await fetch(`${API_BASE}/articles/${slug}/versions`);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  async getVersion(slug: string, versionId: number): Promise<ArticleVersion> {
    const res = await fetch(`${API_BASE}/articles/${slug}/versions/${versionId}`);
    if (!res.ok) throw new Error('Failed to fetch version');
    return res.json();
  },

  async restoreVersion(slug: string, versionId: number): Promise<Article> {
    const res = await fetch(`${API_BASE}/articles/${slug}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId })
    });
    if (!res.ok) throw new Error('Failed to restore version');
    return res.json();
  }
};

// Spaces API
export const spaces = {
  async list(): Promise<Space[]> {
    const res = await fetch(`${API_BASE}/spaces`);
    if (!res.ok) throw new Error('Failed to fetch spaces');
    return res.json();
  },

  async get(slug: string): Promise<Space> {
    const res = await fetch(`${API_BASE}/spaces/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch space');
    return res.json();
  },

  async create(space: { name: string }): Promise<Space> {
    const res = await fetch(`${API_BASE}/spaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(space)
    });
    if (!res.ok) throw new Error('Failed to create space');
    return res.json();
  },

  async update(slug: string, space: { name?: string; homePageSlug?: string | null }): Promise<Space> {
    const res = await fetch(`${API_BASE}/spaces/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(space)
    });
    if (!res.ok) throw new Error('Failed to update space');
    return res.json();
  },

  async delete(slug: string): Promise<void> {
    const res = await fetch(`${API_BASE}/spaces/${slug}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete space');
  }
};
