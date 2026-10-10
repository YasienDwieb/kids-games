/**
 * Daily quests — three small goals a day plus a mystery chest for finishing
 * them all. Quests are built from stars, which every game already awards, so no
 * game needs extra wiring:
 *
 *   - `game-stars`: win `target` rounds of one game ("Win 3 in Balloon Archer")
 *   - `variety`:    win in `target` different games
 *   - `stars`:      earn `target` stars today, anywhere
 *
 * The set is picked once per local day from a date-seeded shuffle, so it stays
 * put across restarts. Nothing is lost on a missed day — tomorrow simply brings
 * a new board. State lives under kg:quests.
 */
import { useEffect, useState } from 'react';
import { createStore } from '@/sdk/storage/createStore';
import { getAllGames } from '@/sdk/config/registry';
import { gamesForBand } from '@/sdk/age/bands';
import { settingsStore } from '@/sdk/settings/store';
import { awardStars, localDay, onStarsAwarded } from '@/sdk/rewards/store';

export type QuestKind = 'game-stars' | 'variety' | 'stars';

export type Quest = {
  id: string;
  kind: QuestKind;
  /** The game a `game-stars` quest is about. */
  gameId?: string;
  target: number;
  progress: number;
  claimed: boolean;
};

export type QuestDay = {
  date: string;
  quests: Quest[];
  /** Games won in today (drives `variety`). */
  played: string[];
  chestOpened: boolean;
};

export const QUEST_COUNT = 3;
/** Bonus stars for claiming one finished quest. */
export const CLAIM_STARS = 1;
/** Bonus stars inside the mystery chest. */
export const CHEST_STARS = 3;
/** Award source id for quest bonuses; never counts toward quests itself. */
export const QUEST_SOURCE = 'quests';

const EMPTY_DAY: QuestDay = { date: '', quests: [], played: [], chestOpened: false };

export const questStore = createStore<QuestDay>('quests', EMPTY_DAY);

// Small deterministic PRNG (mulberry32) seeded from the date string.
function seeded(seedText: string): () => number {
  let a = 0;
  for (let i = 0; i < seedText.length; i++) a = (Math.imul(a ^ seedText.charCodeAt(i), 2654435761) >>> 0);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a day's quest board from the games this child can see. Pure. */
export function buildQuests(date: string, gameIds: readonly string[]): Quest[] {
  const rand = seeded(date);
  const pool = [...gameIds];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const quests: Quest[] = [];
  const picks = pool.slice(0, 2);
  picks.forEach((gameId, i) =>
    quests.push({ id: `g${i}`, kind: 'game-stars', gameId, target: i === 0 ? 3 : 2, progress: 0, claimed: false }),
  );
  // Alternate the third quest between "try lots of games" and "lots of stars".
  if (pool.length >= 3 && rand() < 0.5) {
    quests.push({ id: 'v', kind: 'variety', target: 3, progress: 0, claimed: false });
  } else {
    quests.push({ id: 's', kind: 'stars', target: 5, progress: 0, claimed: false });
  }
  return quests;
}

async function visibleGameIds(): Promise<string[]> {
  const { ageBand } = await settingsStore.get();
  const games = ageBand ? gamesForBand(ageBand) : getAllGames();
  return games.map((g) => g.id);
}

// Read-modify-write on one key; chain like rewards so quick wins can't race.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
}

async function loadToday(): Promise<QuestDay> {
  const today = localDay();
  const cur = await questStore.get();
  if (cur.date === today && cur.quests.length > 0) return cur;
  const fresh: QuestDay = { date: today, quests: buildQuests(today, await visibleGameIds()), played: [], chestOpened: false };
  await questStore.set(fresh);
  return fresh;
}

/** Today's board, generating it on the first call of the day. */
export function ensureQuests(): Promise<QuestDay> {
  return serial(loadToday);
}

type QuestListener = (quest: Quest) => void;
const doneListeners = new Set<QuestListener>();

/** Be told when a quest reaches its target (the in-game "Quest done!" toast). */
export function onQuestDone(fn: QuestListener): () => void {
  doneListeners.add(fn);
  return () => {
    doneListeners.delete(fn);
  };
}

/** Pure progress step: the board after `gameId` earned `stars`. */
export function applyStars(day: QuestDay, gameId: string, stars: number): QuestDay {
  const played = day.played.includes(gameId) ? day.played : [...day.played, gameId];
  const quests = day.quests.map((q) => {
    let progress = q.progress;
    if (q.kind === 'game-stars' && q.gameId === gameId) progress += stars;
    if (q.kind === 'stars') progress += stars;
    if (q.kind === 'variety') progress = played.length;
    return { ...q, progress: Math.min(q.target, progress) };
  });
  return { ...day, played, quests };
}

export function recordQuestStars(gameId: string, stars: number): Promise<QuestDay> {
  return serial(async () => {
    const day = await loadToday();
    const next = applyStars(day, gameId, stars);
    await questStore.set(next);
    next.quests.forEach((q, i) => {
      if (q.progress >= q.target && day.quests[i].progress < q.target) {
        doneListeners.forEach((fn) => fn(q));
      }
    });
    return next;
  });
}

export function questDone(q: Quest): boolean {
  return q.progress >= q.target;
}

export function chestReady(day: QuestDay): boolean {
  return day.quests.length > 0 && day.quests.every((q) => q.claimed) && !day.chestOpened;
}

/** Collect a finished quest's bonus star. No-op if unfinished or already claimed. */
export function claimQuest(id: string): Promise<boolean> {
  return serial(async () => {
    const day = await loadToday();
    const q = day.quests.find((x) => x.id === id);
    if (!q || q.claimed || !questDone(q)) return false;
    await questStore.set({ ...day, quests: day.quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)) });
    void awardStars(QUEST_SOURCE, CLAIM_STARS);
    return true;
  });
}

/** Open today's chest once every quest is claimed. */
export function openChest(): Promise<boolean> {
  return serial(async () => {
    const day = await loadToday();
    if (!chestReady(day)) return false;
    await questStore.set({ ...day, chestOpened: true });
    void awardStars(QUEST_SOURCE, CHEST_STARS);
    return true;
  });
}

// Count every real win toward today's board. Quest bonuses don't count.
onStarsAwarded((gameId, stars) => {
  if (gameId === QUEST_SOURCE) return;
  void recordQuestStars(gameId, stars);
});

/** Live board for screens (Home card, quest board). */
export function useQuests(): QuestDay {
  const [day, setDay] = useState<QuestDay>(EMPTY_DAY);
  useEffect(() => {
    let alive = true;
    ensureQuests().then((d) => alive && setDay(d));
    const unsub = questStore.subscribe((d) => alive && setDay(d));
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return day;
}
