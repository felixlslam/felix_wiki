import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SpaceSelector from '../SpaceSelector';

const spaces = [
  { id: 1, slug: 'default', name: 'Default Space', createdAt: '' },
  { id: 2, slug: 'docs', name: 'Docs', createdAt: '' },
];

describe('SpaceSelector', () => {
  it('renders current space and changes on selection', async () => {
    const onSpaceChange = vi.fn();

    render(
      <SpaceSelector
        spaces={spaces}
        currentSpace={spaces[0]}
        onSpaceChange={onSpaceChange}
        onSpaceCreate={vi.fn()}
        onSpaceUpdate={vi.fn()}
        onSpaceDelete={vi.fn()}
      />
    );

    // Find the combobox and open menu
    const user = userEvent.setup();
    const select = screen.getByRole('combobox');
    await user.click(select);
    const docsOption = await screen.findByRole('option', { name: 'Docs' });
    await user.click(docsOption);

    expect(onSpaceChange).toHaveBeenCalledTimes(1);
    expect(onSpaceChange).toHaveBeenCalledWith(spaces[1]);
  });
});
