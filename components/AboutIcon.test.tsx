import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutIcon from './AboutIcon';

const PARAGRAPHS = ['First paragraph.', 'Second paragraph.'];

describe('AboutIcon', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<AboutIcon visible={false} paragraphs={PARAGRAPHS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('opens an overlay with the provided letter text when clicked, and closes it', async () => {
    const user = userEvent.setup();
    render(<AboutIcon visible={true} paragraphs={PARAGRAPHS} />);

    expect(screen.queryByText(PARAGRAPHS[0])).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /about this trip/i }));
    expect(screen.getByText(PARAGRAPHS[0])).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(screen.queryByText(PARAGRAPHS[0])).not.toBeInTheDocument();
  });
});
