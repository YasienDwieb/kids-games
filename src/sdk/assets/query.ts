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

/** A random variant module for an intent, or undefined if the intent matches nothing. */
export function pickModule(intent: string): number | undefined {
  const id = pickAsset(intent);
  if (!id) return undefined;
  const mods = getAsset(id).modules as readonly number[];
  return mods[Math.floor(Math.random() * mods.length)];
}
