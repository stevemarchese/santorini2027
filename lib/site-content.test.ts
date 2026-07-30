import { describe, it, expect } from 'vitest';
import { splitParagraphs, mergeSiteContent, DEFAULT_SITE_CONTENT } from './site-content';

describe('splitParagraphs', () => {
  it('splits on blank lines and trims each paragraph', () => {
    expect(splitParagraphs('One.\n\nTwo.\n\nThree.')).toEqual(['One.', 'Two.', 'Three.']);
  });
  it('collapses runs of blank lines and ignores surrounding whitespace', () => {
    expect(splitParagraphs('  One.  \n\n\n   Two.  ')).toEqual(['One.', 'Two.']);
  });
  it('returns a single paragraph when there are no blank lines', () => {
    expect(splitParagraphs('Just one line')).toEqual(['Just one line']);
  });
  it('returns an empty array for blank input', () => {
    expect(splitParagraphs('   ')).toEqual([]);
  });
});

describe('mergeSiteContent', () => {
  it('uses defaults when no rows are present', () => {
    expect(mergeSiteContent([], DEFAULT_SITE_CONTENT)).toEqual(DEFAULT_SITE_CONTENT);
  });
  it('overrides defaults with row values', () => {
    const merged = mergeSiteContent(
      [
        { key: 'letter', value: 'New letter' },
        { key: 'confirmation_attending', value: 'Yay' },
        { key: 'confirmation_not_attending', value: 'Aww' },
      ],
      DEFAULT_SITE_CONTENT
    );
    expect(merged).toEqual({
      letter: 'New letter',
      confirmationAttending: 'Yay',
      confirmationNotAttending: 'Aww',
    });
  });
  it('falls back to the default when a row value is blank', () => {
    const merged = mergeSiteContent([{ key: 'letter', value: '   ' }], DEFAULT_SITE_CONTENT);
    expect(merged.letter).toBe(DEFAULT_SITE_CONTENT.letter);
  });
});
