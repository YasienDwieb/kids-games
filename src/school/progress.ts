/**
 * School progress (kg:school): best stars per lesson, which unit intros were
 * heard and which treasure chests were opened. Stars only go up — replaying a
 * lesson can improve it, never lower it — and only the improvement is paid out
 * as app stars, so School rewards mastery, not grinding.
 */
import { useEffect, useState } from 'react';
import { awardStars } from '@/sdk';
import { createStore } from '@/sdk/storage/createStore';
import { CHEST_STARS, type Lesson, type Subject, type Unit } from './types';

export type LessonRecord = {
  /** Best stars so far (1–3). */
  stars: number;
  /** Wrong taps on the best run (the parents' "worth practising"). */
  misses: number;
  /** Last time it was finished (ms). */
  at: number;
};

export type SchoolProgress = {
  lessons: Record<string, LessonRecord>;
  intros: string[];
  chests: string[];
};

export const DEFAULT_SCHOOL: SchoolProgress = { lessons: {}, intros: [], chests: [] };

export const schoolStore = createStore<SchoolProgress>('school', DEFAULT_SCHOOL);

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
}

/** Stars for a finished lesson from its total wrong taps. */
export function lessonStars(misses: number, rounds: number): 1 | 2 | 3 {
  if (misses === 0) return 3;
  if (misses <= Math.max(1, Math.floor(rounds / 2))) return 2;
  return 1;
}

/**
 * Save a finished lesson. Resolves with the stars earned this run and how many
 * of them are new (paid out to the app's star total under `school-<subject>`).
 */
export function finishLesson(
  subject: Subject,
  lesson: Lesson,
  misses: number,
): Promise<{ stars: number; gained: number }> {
  return serial(async () => {
    const cur = await schoolStore.get();
    const stars = lessonStars(misses, lesson.rounds.length);
    const prev = cur.lessons[lesson.id];
    const gained = Math.max(0, stars - (prev?.stars ?? 0));
    const best = !prev || stars >= prev.stars;
    await schoolStore.set({
      ...cur,
      lessons: {
        ...cur.lessons,
        [lesson.id]: best ? { stars, misses, at: Date.now() } : { ...prev, at: Date.now() },
      },
    });
    if (gained > 0) void awardStars(`school-${subject}`, gained);
    return { stars, gained };
  });
}

export function markIntroHeard(unitId: string): Promise<void> {
  return serial(async () => {
    const cur = await schoolStore.get();
    if (!cur.intros.includes(unitId)) await schoolStore.set({ ...cur, intros: [...cur.intros, unitId] });
  });
}

/** Open a finished unit's chest once; resolves true if it opened now. */
export function openChest(unit: Unit): Promise<boolean> {
  return serial(async () => {
    const cur = await schoolStore.get();
    if (cur.chests.includes(unit.id) || !unitDone(unit, cur)) return false;
    await schoolStore.set({ ...cur, chests: [...cur.chests, unit.id] });
    void awardStars(`school-${unit.subject}`, CHEST_STARS);
    return true;
  });
}

// --- derived views ---------------------------------------------------------

export function starsOf(lessonId: string, p: SchoolProgress): number {
  return p.lessons[lessonId]?.stars ?? 0;
}

export function unitStars(unit: Unit, p: SchoolProgress): { have: number; total: number } {
  return {
    have: unit.lessons.reduce((n, l) => n + starsOf(l.id, p), 0),
    total: unit.lessons.length * 3,
  };
}

export function unitDone(unit: Unit, p: SchoolProgress): boolean {
  return unit.lessons.every((l) => starsOf(l.id, p) > 0);
}

/** Index of the stop to play next (the first lesson without stars), or -1 if all done. */
export function nextLessonIndex(unit: Unit, p: SchoolProgress): number {
  return unit.lessons.findIndex((l) => starsOf(l.id, p) === 0);
}

/** First unit not finished yet (or the last one), for opening a subject. */
export function currentUnitIndex(units: Unit[], p: SchoolProgress): number {
  const i = units.findIndex((u) => !unitDone(u, p));
  return i < 0 ? Math.max(0, units.length - 1) : i;
}

export type Badge = 'bronze' | 'silver' | 'gold';
export const BADGES: readonly Badge[] = ['bronze', 'silver', 'gold'];

/** Badge thresholds as a share of all the subject's stars. */
const BADGE_AT: Record<Badge, number> = { bronze: 1 / 3, silver: 2 / 3, gold: 1 };

export function subjectStars(units: Unit[], p: SchoolProgress): { have: number; total: number } {
  return units.reduce(
    (acc, u) => {
      const s = unitStars(u, p);
      return { have: acc.have + s.have, total: acc.total + s.total };
    },
    { have: 0, total: 0 },
  );
}

export function badgeTarget(badge: Badge, total: number): number {
  return Math.ceil(total * BADGE_AT[badge]);
}

export function badgesEarned(units: Unit[], p: SchoolProgress): Badge[] {
  const { have, total } = subjectStars(units, p);
  if (total === 0) return [];
  return BADGES.filter((b) => have >= badgeTarget(b, total));
}

export function useSchoolProgress(): SchoolProgress {
  const [p, setP] = useState<SchoolProgress>(DEFAULT_SCHOOL);
  useEffect(() => {
    let alive = true;
    schoolStore.get().then((v) => alive && setP(v));
    const unsub = schoolStore.subscribe((v) => alive && setP(v));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return p;
}
