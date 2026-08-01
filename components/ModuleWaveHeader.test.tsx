import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModuleWaveHeader from './ModuleWaveHeader';

describe('ModuleWaveHeader', () => {
  it('renders the title', () => {
    render(<ModuleWaveHeader title="ThE BaSics" />);
    expect(screen.getByText('ThE BaSics')).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<ModuleWaveHeader title="ThE BaSics" subtitle="The simple questions" />);
    expect(screen.getByText('The simple questions')).toBeInTheDocument();
  });

  it('omits the subtitle when not provided', () => {
    const { container } = render(<ModuleWaveHeader title="ThE BaSics" />);
    expect(container.querySelectorAll('p').length).toBe(0);
  });
});
