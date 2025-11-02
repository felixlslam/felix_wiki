import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PageTree from '../PageTree';

const articles = [
  { id: 1, slug: 'parent', title: 'Parent', createdAt: '', updatedAt: '' },
  { id: 2, slug: 'child-a', title: 'Child A', parentSlug: 'parent', createdAt: '', updatedAt: '' },
  { id: 3, slug: 'child-b', title: 'Child B', parentSlug: 'parent', createdAt: '', updatedAt: '' },
  { id: 4, slug: 'root-page', title: 'Root Page', createdAt: '', updatedAt: '' },
];

describe('PageTree', () => {
  it('renders top-level pages and nested children', () => {
    render(
      <MemoryRouter>
        <PageTree articles={articles} />
      </MemoryRouter>
    );

    // Root entries (use getAllByText in case of duplicate rendered anchors)
    expect(screen.getAllByText('Parent')[0]).toBeInTheDocument();
    expect(screen.getByText('Root Page')).toBeInTheDocument();

    // Children under Parent
    expect(screen.getByText('Child A')).toBeInTheDocument();
    expect(screen.getByText('Child B')).toBeInTheDocument();
  });

  it('calls onNewSubpage when clicking the add-subpage button', async () => {
    const onNewSubpage = vi.fn();
    render(
      <MemoryRouter>
        <PageTree articles={articles} onNewSubpage={onNewSubpage} />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    // Click all visible "Add subpage" buttons to avoid hover visibility issues
    const addButtons = screen.getAllByTitle('Add subpage');
    for (const btn of addButtons) {
      await user.click(btn);
    }

    expect(onNewSubpage).toHaveBeenCalled();
    expect(onNewSubpage).toHaveBeenCalledWith('parent');
  });
});
