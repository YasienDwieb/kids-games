/**
 * Play-time log for the parent corner (kg:playtime): seconds played per local
 * day and per game, plus any extra minutes a grown-up granted past today's
 * limit. Only the last couple of weeks of days are kept.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createStore } from '@/sdk/storage/createStore';
import { localDay } from '@/sdk/rewards/store';

export type Playtime = {
  /** Seconds played, keyed by YYYY-MM-DD. */
  days: Record<string, number>;
  /** Lifetime seconds per game id ('journey' for guided mode). */
  games: Record<string, number>;
  /** Extra minutes granted today by a grown-up, keyed by day. */
  extra: Record<string, number>;
};

export const DEFAULT_PLAYTIME: Playtime = { days: {}, games: {}, extra: {} };
export const playtimeStore = createStore<Playtime>('playtime', DEFAULT_PLAYTIME);

const KEEP_DAYS = 14;
/** How often a running session is written down (and on leave). */
const FLUSH_MS = 15_000;
/** Minutes a grown-up adds with "keep playing". */
export const EXTRA_MINUTES = 15;

let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
};

/** Keep the most recent KEEP_DAYS days (YYYY-MM-DD sorts chronologically). */
function prune<T>(byDay: Record<string, T>): Record<string, T> {
  const keep = Object.keys(byDay).sort().slice(-KEEP_DAYS);
  return Object.fromEntries(keep.map((d) => [d, byDay[d]]));
}

/** Add `seconds` of play to today and to `gameId`. */
export function addPlaytime(gameId: string, seconds: number, now = new Date()): Promise<void> {
  if (seconds <= 0) return Promise.resolve();
  return serial(async () => {
    const cur = await playtimeStore.get();
    const day = localDay(now);
    await playtimeStore.set({
      days: prune({ ...cur.days, [day]: (cur.days[day] ?? 0) + seconds }),
      games: { ...cur.games, [gameId]: (cur.games[gameId] ?? 0) + seconds },
      extra: prune(cur.extra),
    });
  });
}

/** A grown-up grants EXTRA_MINUTES more for today. */
export function grantExtraTime(now = new Date()): Promise<void> {
  return serial(async () => {
    const cur = await playtimeStore.get();
    const day = localDay(now);
    await playtimeStore.set({ ...cur, extra: { ...cur.extra, [day]: (cur.extra[day] ?? 0) + EXTRA_MINUTES } });
  });
}

export function secondsToday(p: Playtime, now = new Date()): number {
  return p.days[localDay(now)] ?? 0;
}

/** Seconds over the last 7 days, today included. */
export function secondsThisWeek(p: Playtime, now = new Date()): number {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    total += p.days[localDay(d)] ?? 0;
  }
  return total;
}

/** Whether today's play has used up the limit (+ any granted extra). */
export function overLimit(p: Playtime, limitMin: number | null, now = new Date()): boolean {
  if (limitMin == null) return false;
  const allowed = (limitMin + (p.extra[localDay(now)] ?? 0)) * 60;
  return secondsToday(p, now) >= allowed;
}

/**
 * Count play time while `gameId` is on screen and the app is in the
 * foreground. Pass null to pause (e.g. while a break screen is up).
 */
export function usePlaytimeTracker(gameId: string | null): void {
  const since = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (since.current == null || !gameId) return;
    const now = Date.now();
    const seconds = Math.round((now - since.current) / 1000);
    since.current = now;
    void addPlaytime(gameId, seconds);
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    since.current = AppState.currentState === 'active' ? Date.now() : null;
    const timer = setInterval(flush, FLUSH_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') since.current = Date.now();
      else {
        flush();
        since.current = null;
      }
    });
    return () => {
      flush();
      since.current = null;
      clearInterval(timer);
      sub.remove();
    };
  }, [gameId, flush]);
}

/** Live play-time log (parent corner, limit checks). */
export function usePlaytime(): Playtime {
  const [p, setP] = useState<Playtime>(DEFAULT_PLAYTIME);
  useEffect(() => {
    let alive = true;
    playtimeStore.get().then((v) => alive && setP(v));
    const unsub = playtimeStore.subscribe((v) => alive && setP(v));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return p;
}
