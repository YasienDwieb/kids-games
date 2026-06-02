// SDK barrel — single import surface for games.
export const SDK_VERSION = '0.1.0';

// Config & registry
export * from './config/types';
export { registerGame, getGame, getAllGames, getGamesForAge } from './config/registry';
export { validateGameConfig } from './config/validate';

// Design tokens (re-exported so games have one surface)
export { COLORS } from '@/constants/colors';
export { SPACING, BORDER_RADIUS, TOUCH_TARGET, FONT_SIZES } from '@/constants/dimensions';
