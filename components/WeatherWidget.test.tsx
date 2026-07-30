import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WeatherWidget from './WeatherWidget';

describe('WeatherWidget', () => {
  it('renders the temperature after a successful fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ current: { temperature_2m: 81.4 } }),
      })
    );

    render(<WeatherWidget />);

    expect(await screen.findByText('81°F')).toBeInTheDocument();
    expect(screen.getByText('Santorini')).toBeInTheDocument();
  });

  it('renders nothing if the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const { container } = render(<WeatherWidget />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
