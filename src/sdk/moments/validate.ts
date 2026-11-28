import type { Moment } from './types';

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;

/** Why `m` may not be shown, or null when it may. */
export function momentProblem(m: Moment): string | null {
  if (!filled(m.id)) return 'missing id';
  if (!filled(m.reviewedBy)) return 'missing reviewedBy';
  if (!filled(m.reviewedOn)) return 'missing reviewedOn';
  switch (m.type) {
    case 'ayah':
      if (!filled(m.recitation?.permission)) return 'missing recitation.permission';
      if (!filled(m.textAr)) return 'missing textAr';
      return null;
    case 'hadith':
    case 'dua':
    case 'howto':
      if (!filled(m.source?.book) || !filled(m.source?.number)) return 'missing source';
      if (m.type === 'howto' && m.steps.length < 3) return 'needs at least 3 steps';
      return null;
    default:
      return 'unknown type';
  }
}

/**
 * Keeps only moments that are sourced and reviewed. `dropped` names each
 * rejected moment with its reason; a test fails CI if any bundled one is dropped.
 */
export function validateMoments(list: readonly Moment[]): { moments: Moment[]; dropped: string[] } {
  const moments: Moment[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();
  for (const m of list) {
    const problem = momentProblem(m) ?? (seen.has(m.id) ? 'duplicate id' : null);
    if (problem) dropped.push(`${m.id || '(no id)'}: ${problem}`);
    else {
      seen.add(m.id);
      moments.push(m);
    }
  }
  return { moments, dropped };
}
