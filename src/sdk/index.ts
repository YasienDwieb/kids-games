// SDK barrel — single import surface for games.
export const SDK_VERSION = '0.1.0';

// Config & registry
export * from './config/types';
export { registerGame, getGame, getAllGames, getGamesForAge } from './config/registry';
export { validateGameConfig } from './config/validate';

// Design tokens (re-exported so games have one surface)
export { COLORS, ACCENTS, type AccentName } from '@/constants/colors';
export { SPACING, BORDER_RADIUS, TOUCH_TARGET, FONT_SIZES, SHADOWS } from '@/constants/dimensions';
export { FONTS } from '@/constants/typography';

// Design-system UI primitives — always prefer these over hand-rolled controls.
export {
  PressableButton,
  BigButton,
  IconButton,
  AppBar,
  Chip,
  HudPill,
  hudTextStyle,
  EmojiFrame,
  Star,
  GameCard,
  BackButton,
  SafeContainer,
} from '@/components/common';

// Assets
export { ASSETS } from './assets/manifest';
export type { AssetId } from './assets/manifest';
export { getAsset, findAssets, pickAsset, pickModule } from './assets/query';
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

// Motion & orientation
export { useTilt } from './motion/useTilt';
export { useFreeOrientation } from './orientation/useFreeOrientation';

// Layout
export { GameShell } from './layout/GameShell';
export { GameOverlay } from './layout/GameOverlay';
export { useGameShell } from './layout/GameShellContext';
export { ScreenBackContext, useScreenBack } from './layout/ScreenBackContext';
export type { BackInterceptor } from './layout/ScreenBackContext';
export type { GameShellApi } from './layout/GameShellContext';
export type { GameShellProps, OverlaySlot } from './layout/types';

// Age
export { AGE_BANDS, bandsForGame, gamesForBand } from './age/bands';
export type { AgeBand } from './age/bands';

// Settings hook
export { useSettings } from './settings/useSettings';

// Progress & levels
export { levelsFromList, levelsFromGenerator } from './progress/source';
export type { LevelSource } from './progress/source';
export { createProgressStore, DEFAULT_PROGRESS } from './progress/store';
export type { Progress } from './progress/store';
export { resumeStatusFor } from './progress/status';
export type { ResumeStatus } from './progress/status';
export { useLevels } from './progress/useLevels';
export type { UseLevelsResult } from './progress/useLevels';
export { ResumePrompt } from './progress/ResumePrompt';
export type { ResumePromptProps } from './progress/ResumePrompt';

// i18n — single translation surface for games & screens.
// Games import { useTranslation } and call t('namespace:key'); they register
// their own bundles via registerTranslations() from a side-effect module.
export { useTranslation, Trans } from 'react-i18next';
export { i18n, registerTranslations, currentLanguage } from './i18n';
export {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  languageMeta,
  isRTL,
} from './i18n/types';
export type { LanguageCode, LanguageMeta } from './i18n/types';
export {
  useLanguage,
  applyLanguage,
  bootstrapLanguage,
} from './i18n/useLanguage';
export { gameName, gameDescription } from './i18n/gameMeta';
