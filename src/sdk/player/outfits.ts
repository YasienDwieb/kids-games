/**
 * The buddy's wardrobe — things to wear, each unlocked by reaching a level.
 * `emoji` is the tile art in the wardrobe grid and the unlock card, and the
 * sticker `Mascot` draws on the buddy (the party hat is drawn by hand).
 *
 * Some items are each buddy's own: Mariam's flower and bow clip into her
 * pigtails, Anas gets a parrot on his shoulder and a medal. Same levels for
 * both; `twin` links them so a saved item carries over when the child switches
 * buddy. Never split by boy/girl.
 */
import type { BuddyId } from '@/sdk/buddy';
import type { OccasionId } from '@/sdk/content/types';

export type OutfitSlot = 'hat' | 'glasses';

/** Where `Mascot` draws an item that isn't worn on top of the head. */
export type OutfitSpot = 'side' | 'shoulder' | 'chest';

export type Outfit = {
  id: string;
  slot: OutfitSlot;
  /** Player level that unlocks it. */
  level: number;
  emoji: string;
  /** Drawn here instead of on top of the head. */
  spot?: OutfitSpot;
  /** Only this buddy wears it; `twin` is the other buddy's item at the same level. */
  buddy?: BuddyId;
  twin?: string;
  /** An occasion gift: unlocked by opening the app during this occasion; `level` is ignored. */
  occasion?: OccasionId;
};

export const OUTFITS: readonly Outfit[] = [
  { id: 'party-hat', slot: 'hat', level: 2, emoji: '🥳' },
  { id: 'cap', slot: 'hat', level: 3, emoji: '🧢' },
  { id: 'round-glasses', slot: 'glasses', level: 4, emoji: '👓' },
  { id: 'flower', slot: 'hat', level: 5, emoji: '🌸', spot: 'side', buddy: 'mariam', twin: 'parrot' },
  { id: 'parrot', slot: 'hat', level: 5, emoji: '🦜', spot: 'shoulder', buddy: 'anas', twin: 'flower' },
  { id: 'crown', slot: 'hat', level: 6, emoji: '👑' },
  { id: 'sunglasses', slot: 'glasses', level: 7, emoji: '🕶️' },
  { id: 'top-hat', slot: 'hat', level: 8, emoji: '🎩' },
  { id: 'bow', slot: 'hat', level: 10, emoji: '🎀', spot: 'side', buddy: 'mariam', twin: 'medal' },
  { id: 'medal', slot: 'hat', level: 10, emoji: '🏅', spot: 'chest', buddy: 'anas', twin: 'bow' },
  // Occasion gifts: given by opening the app during the occasion, not by level.
  { id: 'crescent-moon', slot: 'hat', level: 0, emoji: '🌙', occasion: 'ramadan' },
  { id: 'eid-balloon', slot: 'hat', level: 0, emoji: '🎈', spot: 'side', occasion: 'eid-al-fitr' },
  { id: 'eid-sheep', slot: 'hat', level: 0, emoji: '🐑', spot: 'side', occasion: 'eid-al-adha' },
];

export type OutfitId = (typeof OUTFITS)[number]['id'];

export function outfitById(id: string | null | undefined): Outfit | undefined {
  return OUTFITS.find((o) => o.id === id);
}

const fits = (o: Outfit, buddy: BuddyId) => !o.buddy || o.buddy === buddy;

/** What `buddy` can wear. */
export function outfitsFor(buddy: BuddyId): Outfit[] {
  return OUTFITS.filter((o) => fits(o, buddy));
}

/** A saved item as `buddy` wears it: another buddy's side item becomes its twin. */
export function outfitFor(id: string | null | undefined, buddy: BuddyId): Outfit | undefined {
  const o = outfitById(id);
  if (!o || fits(o, buddy)) return o;
  const twin = outfitById(o.twin);
  return twin && fits(twin, buddy) ? twin : undefined;
}

/** Items `buddy` unlocks at exactly `level` (shown on the level-up card). Never occasion gifts. */
export function unlocksAt(level: number, buddy: BuddyId): Outfit[] {
  return outfitsFor(buddy).filter((o) => !o.occasion && o.level === level);
}

/** Level items open at their level; occasion gifts once given (`gifts` = owned gift ids). */
export function isUnlocked(outfit: Outfit, level: number, gifts: readonly string[] = []): boolean {
  if (outfit.occasion) return gifts.includes(outfit.id);
  return level >= outfit.level;
}
