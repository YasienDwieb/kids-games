import {
  MOMENT_TYPES,
  OCCASION_IDS,
  type AppContentConfig,
  type CatalogueConfig,
  type DateWindow,
  type MomentsConfig,
  type MomentType,
  type OccasionId,
  type ThemesConfig,
} from './types';

export const MIN_MOMENT_EVERY = 2;
export const MAX_MOMENTS_PER_JOURNEY = 5;

/** Today's behaviour: nothing hidden, no forced theme, moments off. */
export const SAFE_DEFAULT: AppContentConfig = {
  schemaVersion: 1,
  revision: 'safe-default',
  catalogue: { order: [], hidden: [], enabled: [] },
  themes: { force: null, dates: {} },
  moments: { enabled: false, every: 4, maxPerJourney: 2, types: [] },
};

export type ContentValidation = {
  config: AppContentConfig;
  /** One entry per thing that was dropped, clamped or defaulted. Empty = clean. */
  problems: string[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Checks untrusted config JSON. A broken document (not an object, wrong
 * `schemaVersion`, a missing section) falls back to `SAFE_DEFAULT`; a bad part
 * is dropped or clamped on its own so the rest still applies. Never throws.
 */
export function validateContentConfig(input: unknown): ContentValidation {
  const problems: string[] = [];
  const fail = (why: string): ContentValidation => ({ config: SAFE_DEFAULT, problems: [why] });

  if (!isObj(input)) return fail('content: config is not an object');
  if (input.schemaVersion !== 1) return fail(`content: unsupported schemaVersion ${String(input.schemaVersion)}`);
  for (const key of ['catalogue', 'themes', 'moments'] as const) {
    if (!isObj(input[key])) return fail(`content: missing section ${key}`);
  }

  let revision = SAFE_DEFAULT.revision;
  if (typeof input.revision === 'string' && input.revision.length > 0) revision = input.revision;
  else problems.push('content: revision must be a non-empty string');

  return {
    config: {
      schemaVersion: 1,
      revision,
      catalogue: catalogue(input.catalogue as Obj, problems),
      themes: themes(input.themes as Obj, problems),
      moments: moments(input.moments as Obj, problems),
    },
    problems,
  };
}

function idList(value: unknown, path: string, problems: string[]): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    problems.push(`${path}: must be an array`);
    return [];
  }
  const out: string[] = [];
  for (const v of value) {
    if (typeof v === 'string' && v.length > 0) {
      if (!out.includes(v)) out.push(v);
    } else {
      problems.push(`${path}: dropped non-string id ${JSON.stringify(v)}`);
    }
  }
  return out;
}

function catalogue(c: Obj, problems: string[]): CatalogueConfig {
  return {
    order: idList(c.order, 'catalogue.order', problems),
    hidden: idList(c.hidden, 'catalogue.hidden', problems),
    enabled: idList(c.enabled, 'catalogue.enabled', problems),
  };
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A real calendar date in 'YYYY-MM-DD' form (rejects 2027-02-30). */
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

const isOccasion = (v: unknown): v is OccasionId => OCCASION_IDS.includes(v as OccasionId);

function themes(t: Obj, problems: string[]): ThemesConfig {
  let force: ThemesConfig['force'] = null;
  if (t.force === null || t.force === undefined) force = null;
  else if (t.force === 'none' || isOccasion(t.force)) force = t.force;
  else problems.push(`themes.force: unknown value ${JSON.stringify(t.force)}`);

  const dates: ThemesConfig['dates'] = {};
  if (t.dates !== undefined && !isObj(t.dates)) {
    problems.push('themes.dates: must be an object');
  } else if (isObj(t.dates)) {
    for (const [id, windows] of Object.entries(t.dates)) {
      if (!isOccasion(id)) {
        problems.push(`themes.dates: dropped unknown occasion ${id}`);
        continue;
      }
      if (!Array.isArray(windows)) {
        problems.push(`themes.dates.${id}: must be an array`);
        continue;
      }
      const kept: DateWindow[] = [];
      for (const w of windows) {
        if (isObj(w) && isIsoDate(w.start) && isIsoDate(w.end) && w.start <= w.end) {
          kept.push({ start: w.start, end: w.end });
        } else {
          problems.push(`themes.dates.${id}: dropped invalid window ${JSON.stringify(w)}`);
        }
      }
      if (kept.length > 0) dates[id] = kept;
    }
  }
  return { force, dates };
}

function int(value: unknown, path: string, fallback: number, min: number, max: number, problems: string[]): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    if (value !== undefined) problems.push(`${path}: must be a number`);
    return fallback;
  }
  const n = Math.round(value);
  const clamped = Math.min(max, Math.max(min, n));
  if (clamped !== value) problems.push(`${path}: clamped ${value} to ${clamped}`);
  return clamped;
}

function moments(m: Obj, problems: string[]): MomentsConfig {
  const d = SAFE_DEFAULT.moments;
  let enabled = d.enabled;
  if (typeof m.enabled === 'boolean') enabled = m.enabled;
  else if (m.enabled !== undefined) problems.push('moments.enabled: must be a boolean');

  const types: MomentType[] = [];
  if (Array.isArray(m.types)) {
    for (const t of m.types) {
      if (MOMENT_TYPES.includes(t as MomentType)) {
        if (!types.includes(t as MomentType)) types.push(t as MomentType);
      } else {
        problems.push(`moments.types: dropped unknown type ${JSON.stringify(t)}`);
      }
    }
  } else if (m.types !== undefined) {
    problems.push('moments.types: must be an array');
  }

  return {
    enabled,
    every: int(m.every, 'moments.every', d.every, MIN_MOMENT_EVERY, Number.MAX_SAFE_INTEGER, problems),
    maxPerJourney: int(m.maxPerJourney, 'moments.maxPerJourney', d.maxPerJourney, 0, MAX_MOMENTS_PER_JOURNEY, problems),
    types,
  };
}
