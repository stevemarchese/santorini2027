import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutIcon from './AboutIcon';
import { LETTER_PARAGRAPHS } from '@/lib/letter-content';

describe('AboutIcon', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<AboutIcon visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens an overlay with the letter text when clicked, and closes it', async () => {
    const user = userEvent.setup();
    render(<AboutIcon visible={true} />);

    expect(screen.queryByText(LETTER_PARAGRAPHS[0])).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /about this trip/i }));
    expect(screen.getByText(LETTER_PARAGRAPHS[0])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(screen.queryByText(LETTER_PARAGRAPHS[0])).not.toBeInTheDocument();
  });
});
