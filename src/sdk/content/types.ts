/**
 * The app's content config: which games show and in what order, which
 * occasion theme is on, and how journey moments are inserted. Bundled in the
 * app today (`src/content/config.json`); phase 2 fetches the same shape from a
 * server, so keep it plain JSON.
 */

export type OccasionId = 'ramadan' | 'eid-al-fitr' | 'eid-al-adha';
export const OCCASION_IDS: readonly OccasionId[] = ['ramadan', 'eid-al-fitr', 'eid-al-adha'];

export type MomentType = 'ayah' | 'hadith' | 'dua' | 'howto';
export const MOMENT_TYPES: readonly MomentType[] = ['ayah', 'hadith', 'dua', 'howto'];

/** 'YYYY-MM-DD', inclusive, device-local date. */
export type DateWindow = { start: string; end: string };

export type CatalogueConfig = {
  /** Game ids listed first, in this order; the rest follow by `GameConfig.order`. Unknown ids are ignored. */
  order: string[];
  /** Never shown on Home, in category chips, in the journey or in the Settings journey picker. */
  hidden: string[];
  /** Turns on games that ship with `GameConfig.dark: true`. */
  enabled: string[];
};

export type ThemesConfig = {
  /** null = pick by date; 'none' = never theme; an id = force that theme. */
  force: OccasionId | 'none' | null;
  /** Replaces bundled table windows of the same occasion that overlap the same Gregorian year. */
  dates: Partial<Record<OccasionId, DateWindow[]>>;
};

export type MomentsConfig = {
  enabled: boolean;
  /** Insert a moment after every Nth game unit. Min 2. */
  every: number;
  /** 0..5 */
  maxPerJourney: number;
  types: MomentType[];
};

export type AppContentConfig = {
  schemaVersion: 1;
  /** e.g. '2026-11-28.1'; becomes the phase 2 cache key. */
  revision: string;
  catalogue: CatalogueConfig;
  themes: ThemesConfig;
  moments: MomentsConfig;
};
