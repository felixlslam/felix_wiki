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
}

export interface Space {
  id: number;
  slug: string;
  name: string;
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

  async update(slug: string, space: { name: string }): Promise<Space> {
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
