// How the Voice Studio groups and filters clips. Shared by the page and its tests.

/** 'new' for clips without an up-to-date recording, else the game of the clip's first use. */
export function sectionFor(clip) {
  return clip.state === 'ok' ? clip.uses[0]?.game ?? 'new' : 'new';
}

/** New / missing first, then one section per game in `games` order; each clip appears once. */
export function groupClips(clips, games) {
  const sections = [{ id: 'new', title: 'New / missing' }, ...games.map((g) => ({ id: g.id, title: g.name, game: g }))];
  return sections
    .map((s) => ({ ...s, clips: clips.filter((c) => sectionFor(c) === s.id) }))
    .filter((s) => s.clips.length);
}

/** Narrow by game (any use), language, flagged-only and a case-insensitive text search. */
export function filterClips(clips, { game = 'all', lang = 'all', flaggedOnly = false, q = '' }) {
  const needle = q.trim().toLowerCase();
  return clips.filter(
    (c) =>
      (game === 'all' || c.uses.some((u) => u.game === game)) &&
      (lang === 'all' || c.lang === lang) &&
      (!flaggedOnly || c.flag) &&
      (!needle || c.text.toLowerCase().includes(needle)),
  );
}
