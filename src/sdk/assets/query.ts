import { ASSETS, type AssetId } from './manifest';
import type { AssetEntry, AssetType } from './types';

export function getAsset(id: AssetId): AssetEntry {
  return ASSETS[id];
}

export function findAssets(filter: { type?: AssetType; tags?: string[] }): AssetId[] {
  return (Object.keys(ASSETS) as AssetId[]).filter((id) => {
    const entry = ASSETS[id];
    if (filter.type && entry.type !== filter.type) return false;
    if (filter.tags && !filter.tags.every((t) => entry.tags.includes(t))) return false;
    return true;
  });
}

/** Best single asset for an intent: the first asset whose tags include the intent. */
export function pickAsset(intent: string): AssetId | undefined {
  return (Object.keys(ASSETS) as AssetId[]).find((id) => ASSETS[id].tags.includes(intent));
}
