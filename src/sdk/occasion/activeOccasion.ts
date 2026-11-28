import type { AppContentConfig, DateWindow, OccasionId } from '@/sdk/content/types';
import { OCCASION_TABLE } from './dates.generated';

/** When two windows overlap (an override moved Eid a day early), Eid wins. */
const PRECEDENCE: readonly OccasionId[] = ['eid-al-fitr', 'eid-al-adha', 'ramadan'];

const yearOf = (w: DateWindow) => w.start.slice(0, 4);

/**
 * The windows used for `id`: the bundled table, with any config window
 * replacing the table window that starts in the same Gregorian year.
 */
export function windowsFor(
  id: OccasionId,
  overrides: AppContentConfig['themes']['dates'],
  table: Record<OccasionId, readonly DateWindow[]> = OCCASION_TABLE,
): DateWindow[] {
  const extra = overrides[id] ?? [];
  const replaced = new Set(extra.map(yearOf));
  return [...table[id].filter((w) => !replaced.has(yearOf(w))), ...extra];
}

/**
 * The occasion on `today` ('YYYY-MM-DD', device-local), or null. `force` wins,
 * then config date overrides, then the bundled Umm al-Qura table. Pure.
 */
export function activeOccasion(
  today: string,
  themes: AppContentConfig['themes'],
  table: Record<OccasionId, readonly DateWindow[]> = OCCASION_TABLE,
): OccasionId | null {
  if (themes.force === 'none') return null;
  if (themes.force) return themes.force;
  for (const id of PRECEDENCE) {
    if (windowsFor(id, themes.dates, table).some((w) => w.start <= today && today <= w.end)) return id;
  }
  return null;
}

/** Device-local date as 'YYYY-MM-DD' (not UTC: the day the child is living). */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
