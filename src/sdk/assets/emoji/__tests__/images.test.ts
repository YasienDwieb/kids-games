/**
 * Emoji image map — guards that word-picture glyphs used by the listen-and-find
 * games resolve to a bundled image (FE0F-stripped keys, per getEmojiImage).
 */

import { getEmojiImage } from '../images';

// One representative glyph per game inventory that was added for word pictures.
const WORD_PICTURES = ['⚽', '🐼', '🦓', '🐪', '🦒', '🚀', '📱', '☀️', '✈️', '✋'];

describe('word-picture emoji', () => {
  it('resolves every newly-bundled word glyph (incl. FE0F variants)', () => {
    for (const g of WORD_PICTURES) {
      expect(getEmojiImage(g)).toBeDefined();
    }
  });
});
