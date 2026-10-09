/**
 * Sticker catalog — six collectible stickers per game, themed to that game, plus
 * a general set for anything without its own. A sticker id is `<setId>:<index>`.
 * Glyphs are drawn through <EmojiImage>, so prefer ones bundled in
 * assets/emoji/images.ts (others fall back to the system emoji font).
 */
export const STICKER_SETS = {
  'animal-safari': ['🦁', '🐘', '🦒', '🦓', '🐵', '🐸'],
  'simple-pairs': ['🐱', '🐶', '🐰', '🦊', '🐼', '🦄'],
  'count-and-pop': ['🎈', '🍓', '🍎', '🐞', '⭐', '🐟'],
  'numbers-land': ['🍊', '🍌', '🍋', '🦆', '🍇', '🫐'],
  'letter-land': ['✈', '🐝', '🌙', '👑', '🪁', '🎹'],
  'match-up': ['🐻', '🍯', '🐿', '🌰', '🐄', '🦋'],
  'shape-detective': ['🎩', '💡', '🔨', '⚽', '🧶', '🌂'],
  'candy-catch': ['🍦', '🧃', '🍐', '🥕', '🥚', '🍳'],
  'mouse-maze': ['🐭', '🧀', '🐌', '🐛', '🌻', '🪺'],
  'color-mixer': ['🎨', '🖌', '🌹', '🪶', '🐚', '🌊'],
  'balloon-archer': ['🐦', '🐤', '🐔', '☀', '🌳', '🎉'],
  'turbo-road': ['🚗', '🚀', '🚒', '🚓', '🚜', '🚐'],
  general: ['🏆', '🐧', '🐴', '🐋', '🦌', '🐑'],
} as const satisfies Record<string, readonly string[]>;

export type StickerSetId = keyof typeof STICKER_SETS;

/** Stars needed per sticker. Low on purpose: a sticker every few wins feels generous. */
export const STARS_PER_STICKER = 3;

export const stickerId = (set: string, index: number) => `${set}:${index}`;

export function stickerEmoji(id: string): string | undefined {
  const [set, idx] = id.split(':');
  return (STICKER_SETS as Record<string, readonly string[]>)[set]?.[Number(idx)];
}

export function setOf(id: string): string {
  return id.split(':')[0];
}

/** Every sticker id, set by set, in catalog order. */
export const ALL_STICKERS: string[] = Object.entries(STICKER_SETS).flatMap(([set, glyphs]) =>
  glyphs.map((_, i) => stickerId(set, i)),
);

/**
 * The next sticker to give for a win in `gameId`: the first one still missing
 * from that game's set, else from the general set, else from anywhere. Null once
 * the whole book is complete.
 */
export function nextSticker(gameId: string, owned: readonly string[]): string | null {
  const have = new Set(owned);
  const sets = gameId in STICKER_SETS ? [gameId, 'general'] : ['general'];
  for (const set of sets) {
    const glyphs = STICKER_SETS[set as StickerSetId];
    for (let i = 0; i < glyphs.length; i++) {
      const id = stickerId(set, i);
      if (!have.has(id)) return id;
    }
  }
  return ALL_STICKERS.find((id) => !have.has(id)) ?? null;
}
