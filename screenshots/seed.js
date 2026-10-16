#!/usr/bin/env node
// Demo state for store screenshots, anchored to a day (default today) so the
// "today" stars always read as current. Emits SQL for
// AsyncStorage's RKStorage database (table catalystLocalStorage, kg:* keys).
//
//   node screenshots/seed.js [--day YYYY-MM-DD] [--lang en|ar] > seed.sql

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const day = args.day || new Date().toISOString().slice(0, 10);
const lang = args.lang || 'en';

// 48 lifetime stars = level 7 (crown + sunglasses unlocked), a few stars into it.
const byGame = {
  'count-and-pop': 9, 'balloon-archer': 8, 'letter-land': 7, 'animal-safari': 6,
  'turbo-road': 5, 'match-up': 5, 'shape-detective': 4, 'mouse-maze': 4,
};
const stars = Object.values(byGame).reduce((a, b) => a + b, 0);

// A week of gentle sessions ending on the anchor day; per-game minutes follow
// the stars so the parents' "time and stars by game" list reads plausibly.
function playtime() {
  const perDay = [14, 0, 22, 18, 11, 25, 17]; // minutes, oldest → anchor day
  const days = {};
  perDay.forEach((m, i) => {
    const d = new Date(`${day}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (perDay.length - 1 - i));
    if (m) days[d.toISOString().slice(0, 10)] = m * 60;
  });
  const total = perDay.reduce((a, b) => a + b, 0);
  const games = Object.fromEntries(Object.entries(byGame).map(([g, s]) => [g, Math.round((s / stars) * total) * 60]));
  return { days, games, extra: {} };
}

const state = {
  settings: {
    soundEnabled: true, hapticsEnabled: true, ageBand: null, language: lang,
    mode: 'free', flowGameIds: null, dailyLimitMin: 30,
  },
  rewards: {
    // One sticker per 3 stars, from the sets of the games played.
    stars,
    stickers: Object.entries(byGame).flatMap(([g, n]) => [...Array(Math.min(6, Math.floor(n / 2))).keys()].map((i) => `${g}:${i}`)).slice(0, Math.floor(stars / 3)),
    unseen: [],
    today: { date: day, stars: 4 }, byGame,
  },
  playtime: playtime(),
  outfit: { hat: 'crown', glasses: 'sunglasses' },
  tutorial: { seen: ['mouse-maze'] },
  // The 3D road reads better in a still than the 2D one (no overlapping car sprites).
  'turbo-road:prefs': { control: 'drag', view: '3d' },
  'rtl-reload': { pending: false, ignored: false },
};

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const rows = Object.entries(state).map(
  ([k, v]) => `INSERT OR REPLACE INTO catalystLocalStorage (key, value) VALUES (${q(`kg:${k}`)}, ${q(JSON.stringify(v))});`,
);
process.stdout.write(
  ['CREATE TABLE IF NOT EXISTS catalystLocalStorage (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
    'BEGIN;', 'DELETE FROM catalystLocalStorage;', ...rows, 'COMMIT;', ''].join('\n'),
);
