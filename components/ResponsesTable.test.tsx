import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResponsesTable from './ResponsesTable';

describe('ResponsesTable', () => {
  it('renders a row per response with key fields', () => {
    render(
      <ResponsesTable
        responses={[
          {
            id: '1',
            created_at: '2026-07-29T00:00:00Z',
            name: 'Steve',
            attending: true,
            party_size: 2,
            hotel_staying: true,
            hotel_nights: 3,
            window_1_selected: true,
            window_2_selected: false,
            window_3_selected: false,
            window_priority: 'window_1',
            travel_timing: 'both',
            travel_note: 'Flying in a day early',
            dinner_interested: true,
            cruise_interested: false,
            note: null,
          },
        ]}
      />
    );
    expect(screen.getByText('Steve')).toBeInTheDocument();
    expect(screen.getByText('6/30-7/6')).toBeInTheDocument();
    expect(screen.getByText('Flying in a day early')).toBeInTheDocument();
    expect(screen.getByText(new Date('2026-07-29T00:00:00Z').toLocaleDateString())).toBeInTheDocument();
  });
});
