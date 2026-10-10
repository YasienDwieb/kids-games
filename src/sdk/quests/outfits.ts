/**
 * Lulu's wardrobe — things she can wear, each unlocked by reaching a level.
 * The 3D owl draws every item (see Lulu3D); `emoji` is the tile art in the
 * wardrobe grid and the unlock card.
 */
export type OutfitSlot = 'hat' | 'glasses';

export type Outfit = {
  id: string;
  slot: OutfitSlot;
  /** Player level that unlocks it. */
  level: number;
  emoji: string;
};

export const OUTFITS: readonly Outfit[] = [
  { id: 'party-hat', slot: 'hat', level: 2, emoji: '🥳' },
  { id: 'cap', slot: 'hat', level: 3, emoji: '🧢' },
  { id: 'round-glasses', slot: 'glasses', level: 4, emoji: '👓' },
  { id: 'flower', slot: 'hat', level: 5, emoji: '🌸' },
  { id: 'crown', slot: 'hat', level: 6, emoji: '👑' },
  { id: 'sunglasses', slot: 'glasses', level: 7, emoji: '🕶️' },
  { id: 'top-hat', slot: 'hat', level: 8, emoji: '🎩' },
  { id: 'bow', slot: 'hat', level: 10, emoji: '🎀' },
];

export type OutfitId = (typeof OUTFITS)[number]['id'];

export function outfitById(id: string | null | undefined): Outfit | undefined {
  return OUTFITS.find((o) => o.id === id);
}

/** Items unlocked at exactly `level` (shown on the level-up card). */
export function unlocksAt(level: number): Outfit[] {
  return OUTFITS.filter((o) => o.level === level);
}

export function isUnlocked(outfit: Outfit, level: number): boolean {
  return level >= outfit.level;
}
