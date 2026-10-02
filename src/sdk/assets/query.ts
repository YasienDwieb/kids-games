import { ASSETS, type AssetId } from './manifest';
import type { AssetEntry, AssetType } from './types';

export function getAsset(id: AssetId): AssetEntry {
  return ASSETS[id];
}

export function findAssets(filter: { type?: AssetType; tags?: string[] }): AssetId[] {
  return (Object.keys(ASSETS) as AssetId[]).filter((id) => {
    const entry = ASSETS[id];
    if (filter.type && entry.type !== filter.type) return false;
    if (filter.tags && !filter.tags.every((t) => (entry.tags as readonly string[]).includes(t))) return false;
    return true;
  });
}

/** Best single asset for an intent: the first asset whose tags include the intent. */
export function pickAsset(intent: string): AssetId | undefined {
  return (Object.keys(ASSETS) as AssetId[]).find((id) => (ASSETS[id].tags as readonly string[]).includes(intent));
}

/**
 * Per-game asset swaps: when an intent resolves to the key asset, the value asset
 * plays instead (e.g. `{ 'sfx.win': 'jingle.sax-10' }` gives a game its own win
 * jingle while every `play('win')` call site stays the same).
 */
export type SoundOverrides = Partial<Record<AssetId, AssetId>>;

/** Every variant module for an intent — used to load them all up front. */
export function modulesFor(intent: string, overrides: SoundOverrides = {}): readonly number[] {
  const id = pickAsset(intent);
  if (!id) return [];
  return getAsset(overrides[id] ?? id).modules as readonly number[];
}

/** A random variant module for an intent, or undefined if the intent matches nothing. */
export function pickModule(intent: string, overrides: SoundOverrides = {}): number | undefined {
  const mods = modulesFor(intent, overrides);
  if (mods.length === 0) return undefined;
  return mods[Math.floor(Math.random() * mods.length)];
}
