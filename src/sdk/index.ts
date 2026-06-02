// SDK barrel — single import surface for games.
export const SDK_VERSION = '0.1.0';

// Config & registry
export * from './config/types';
export { registerGame, getGame, getAllGames, getGamesForAge } from './config/registry';
export { validateGameConfig } from './config/validate';

// Design tokens (re-exported so games have one surface)
export { COLORS } from '@/constants/colors';
export { SPACING, BORDER_RADIUS, TOUCH_TARGET, FONT_SIZES } from '@/constants/dimensions';

// Assets
export { ASSETS } from './assets/manifest';
export type { AssetId } from './assets/manifest';
export { getAsset, findAssets, pickAsset } from './assets/query';
export type { AssetEntry, AssetType } from './assets/types';

// Storage
export { createStore } from './storage/createStore';
export type { Store } from './storage/createStore';

// Settings
export { settingsStore, DEFAULT_SETTINGS } from './settings/store';
export type { Settings } from './settings/store';

// Audio
export { useSound } from './audio/useSound';
export type { PlayOptions } from './audio/useSound';
