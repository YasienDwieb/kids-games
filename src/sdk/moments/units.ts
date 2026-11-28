import type { MomentType } from '@/sdk/content/types';
import type { HowToStep, Moment } from './types';

/** Steps per how-to unit: wudu (8 steps) and salah each span 2 units. */
export const STEPS_PER_UNIT = 4;

/** One playable moment: a whole ayah/hadith/dua, or a 3–4 step slice of a how-to. */
export type MomentUnitData =
  | { kind: 'whole'; moment: Exclude<Moment, { type: 'howto' }> }
  | {
      kind: 'howto';
      moment: Extract<Moment, { type: 'howto' }>;
      /** Steps already done before this slice (shown, not asked). */
      before: HowToStep[];
      /** The steps the child places in this unit. */
      steps: HowToStep[];
      part: number;
    };

/**
 * Splits a how-to into even slices of at most STEPS_PER_UNIT and at least 3
 * steps (8 → 4+4, 7 → 4+3, 6 → 3+3, 9 → 3+3+3). A 5-step how-to stays whole
 * rather than leave a 2-step unit.
 */
export function slices<T>(items: readonly T[]): T[][] {
  let k = Math.ceil(items.length / STEPS_PER_UNIT);
  if (items.length / k < 3) k = Math.max(1, Math.floor(items.length / 3));
  const out: T[][] = [];
  let at = 0;
  for (let i = 0; i < k; i++) {
    const size = Math.ceil((items.length - at) / (k - i));
    out.push(items.slice(at, at + size));
    at += size;
  }
  return out;
}

/** Every unit the moments contribute, in content order, filtered by allowed `types`. */
export function momentUnits(moments: readonly Moment[], types: readonly MomentType[]): MomentUnitData[] {
  const allowed = new Set(types);
  return moments
    .filter((m) => allowed.has(m.type))
    .flatMap((m): MomentUnitData[] => {
      if (m.type !== 'howto') return [{ kind: 'whole', moment: m }];
      let done: HowToStep[] = [];
      return slices(m.steps).map((steps, part) => {
        const unit: MomentUnitData = { kind: 'howto', moment: m, before: done, steps, part };
        done = [...done, ...steps];
        return unit;
      });
    });
}

/** A key stable across sessions for a unit (React key + analytics id). */
export function unitId(u: MomentUnitData): string {
  return u.kind === 'howto' ? `${u.moment.id}#${u.part}` : u.moment.id;
}
