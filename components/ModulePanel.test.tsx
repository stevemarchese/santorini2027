import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModulePanel from './ModulePanel';

describe('ModulePanel', () => {
  it('renders its children', () => {
    render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
