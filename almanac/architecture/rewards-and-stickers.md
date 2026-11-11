---
title: "Rewards: Stars, Stickers, and the Daily Goal"
summary: "awardStars is the one entry point every game calls to grant stars; a single kg:rewards record turns a lifetime star total into a sticker collection (STARS_PER_STICKER stars per sticker, from a per-game themed catalog) and a gentle daily goal, with a serialized read-modify-write queue so concurrent awards never lose a star."
topics: [architecture, sdk, engagement]
sources:
  - id: rewards-store
    type: file
    path: src/sdk/rewards/store.ts
  - id: stickers
    type: file
    path: src/sdk/rewards/stickers.ts
  - id: sticker-component
    type: file
    path: src/sdk/rewards/Sticker.tsx
  - id: sticker-toast
    type: file
    path: src/sdk/rewards/StickerToast.tsx
  - id: rewards-test
    type: file
    path: src/sdk/rewards/__tests__/rewards.test.ts
  - id: level-up
    type: file
    path: src/sdk/feedback/LevelUp.tsx
  - id: wardrobe-screen
    type: file
    path: src/screens/WardrobeScreen.tsx
  - id: gdd-readme
    type: file
    path: docs/gdd/README.md
---

Before this subsystem existed, a win in most games just updated that one
game's own `score` — nothing tied a child's play together across games, and
nothing was ever collected or shown off. The engagement audit names this
directly: "No app-wide rewards (stars, stickers, collection, streak,
avatar); scores never aggregated, some never shown," true of every game
except Turbo Road's garage and Color Mixer's own discovery collection
[@gdd-readme]. `src/sdk/rewards/` is the fix: one app-wide star total, a
sticker book stars pay into, and a daily goal with no punishment for missing
it — matching the audit's own "P3 Sticker book & stars" and "P8 daily goal
(gentle)" platform systems [@gdd-readme].

## `awardStars`: the one write path, serialized

`awardStars(gameId, stars = 1)` is the function every game calls after a win
to grant stars; it is "safe to fire and forget" by design, so a game never
has to `await` it before moving on [@rewards-store]. Internally, every call
is chained onto a single module-level `queue: Promise<unknown>` rather than
running its read-modify-write independently — `const run = queue.then(async
() => { ... }); queue = run.catch(() => undefined); return run;` — which is
what keeps two awards that land in the same tick from both reading the same
stale total and each writing back `total + stars` only to have the second
write clobber the first [@rewards-store]. `rewards.test.ts` proves this
directly: firing `awardStars('match-up')` ten times concurrently with
`Promise.all` still leaves `rewardsStore`'s `stars` at exactly 10, not less
[@rewards-test]. Without the queue, this is exactly the kind of lost-update
bug that silently erases a child's progress — the same class of bug the
[Storage and progress](storage-and-progress) page's `createStore` merge
exists to guard against for a different failure mode (a missing field after
an app update), but here the risk is concurrent writers racing each other
within one session, not schema drift across versions.

## Stars become stickers through a themed catalog

`Rewards` is `{ stars, stickers, unseen, today, byGame }`, persisted as the
single record `rewardsStore = createStore('rewards', DEFAULT_REWARDS)` under
`kg:rewards` [@rewards-store]. `stickers.ts` defines `STICKER_SETS`: six
emoji glyphs per game (`'turbo-road': ['🚗','🚀','🚒','🚓','🚜','🚐']` and
eleven more sets, one per registered game, plus a thirteenth `general` set
for overflow) [@stickers]. `STARS_PER_STICKER` is `3` — deliberately low, so
a sticker arrives every few wins rather than requiring a long grind
[@stickers]. Inside `awardStars`, `owed = Math.floor(total / STARS_PER_STICKER)`
decides how many stickers the new total has earned in total, and a `while`
loop calls `nextSticker(gameId, stickers)` until the owned list catches up
[@rewards-store]. `nextSticker` picks the game's own set first, falls back
to `general` once that set is exhausted (or immediately, for a game with no
set of its own), and finally scans every sticker in the whole catalog if
even `general` is used up — returning `null` only once the entire 78-sticker
book (`ALL_STICKERS`, six glyphs × thirteen sets) is complete, at which point
stars still accumulate but stop minting new stickers [@stickers]
[@rewards-test]. New stickers land in both `stickers` (owned) and `unseen`
(not yet opened in the collection screen); `markStickersSeen()` clears
`unseen` once the child opens that screen [@rewards-store].

## The daily goal is gentle by construction

`DAILY_GOAL` is `3` stars. `rewardsStore.today` tracks `{ date, stars }` for
the current local calendar day (`localDay()` formats `YYYY-MM-DD` from
wall-clock date parts, not UTC, so "today" matches the child's actual day);
`starsToday(r)` returns `r.today.stars` only if `r.today.date` still matches
today, so the counter silently resets to zero on a new day rather than
needing an explicit rollover step [@rewards-store]. There is no streak
counter and no penalty for a missed day anywhere in this module — consistent
with the audit's own framing of the goal as "no punishment for missed days"
[@gdd-readme]. When an award's `before < DAILY_GOAL && after >= DAILY_GOAL`,
`awardStars` fires the sentinel `DAILY_GOAL_EVENT` through the same
unlock-listener channel as a sticker id, so the UI can treat "goal reached"
as one more thing to celebrate without a second notification mechanism
[@rewards-store].

## How a reward actually reaches the screen

`onStickerUnlocked(fn)` registers a listener against a module-level
`Set`, called once per newly-unlocked sticker id and once with
`DAILY_GOAL_EVENT` [@rewards-store]. `StickerToast`, mounted inside
`CelebrationProvider` (see
[Celebration, combo streaks, and the hint ladder](celebration-and-hints)),
is the concrete subscriber: it queues incoming ids, waits for any modal game
overlay to clear via `whenOverlayClear` so a toast behind one would not
expire unseen, then shows a `Sticker` with a spoken "new sticker" line,
reserving the voice channel for the clip's measured length the same way
`Celebration.tsx`'s own praise line does [@sticker-toast]. `Sticker` itself
is a small presentational component — a glyph on a die-cut rounded card, or
a locked `?` card when `locked` is passed — reused both by the toast and by
the collection screen [@sticker-component]. `useRewards()` is the live read
hook (subscribe-on-mount, same shape as every other `createStore`-backed
hook in the app) that screens call to show the running total and the
collection itself [@rewards-store].

The collection screen this PR introduced shipped as its own route,
`StickerBookScreen`; that route no longer exists — the sticker grid now
lives as one tab (`'stickers'`) inside `WardrobeScreen`, alongside the
outfit-unlock tabs a later feature added, and leaving that screen still
calls `markStickersSeen()` the same way the original screen did
[@wardrobe-screen]. A reader checking out an older commit should not expect
to find `StickerBookScreen` still wired into navigation.

## What grew on top of this, out of scope here

`rewardsStore`'s `awardStars` has since grown two side effects this page
does not cover: it calls `onLevelUp` listeners when a rising lifetime star
total crosses into a new player level (consumed by a full-screen "LEVEL UP!"
card, `feedback/LevelUp.tsx`, mounted the same way `StickerToast` is)
[@level-up], and it calls `trackRound(gameId, stars)` to report the award to
the app's analytics layer, which is also how every game's `round_complete`
event reaches analytics without per-game code — see
[Analytics: anonymous usage events](analytics). Both belong to later,
separate systems (a player-level/wardrobe system and an analytics layer)
built on top of the star total this page describes, not to the rewards
module itself — see [Buddy, mascot, and wardrobe](buddy-and-wardrobe) for the
player-level-to-outfit-unlock chain in full.
