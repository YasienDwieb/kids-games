---
title: "Play Time Limit"
summary: "A parent-set daily minute limit (settings.dailyLimitMin) tracked by a per-day/per-game playtime log; once a child's today total reaches the limit, GamePlayerScreen and FlowPlayerScreen swap the game for a calm Recharge break screen, and a grown-up can grant 15 more minutes by solving the same ParentGate challenge used to unlock Settings."
topics: [architecture, settings, engagement]
sources:
  - id: playtime
    type: file
    path: src/sdk/playtime/playtime.ts
  - id: play-limit-gate
    type: file
    path: src/screens/PlayLimitGate.tsx
  - id: game-player-screen
    type: file
    path: src/screens/GamePlayerScreen.tsx
  - id: flow-player-screen
    type: file
    path: src/screens/FlowPlayerScreen.tsx
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
  - id: settings-screen
    type: file
    path: src/screens/SettingsScreen.tsx
---

Alongside the age-band filter and the guided-journey configuration, a parent
can set a daily play-time limit in minutes — `settings.dailyLimitMin`, `null`
meaning no limit — from a chip row on `SettingsScreen`, behind the
[parent gate](../decisions/parent-gate-for-settings) like every other
Settings control except sound and language [@settings-store]
[@settings-screen]. `PlayLimitGate` is the component that enforces it: it
wraps the actual play surface inside both `GamePlayerScreen` and
`FlowPlayerScreen`, logging time while a game is on screen and swapping it
for a break screen once the day's limit is used up [@game-player-screen]
[@flow-player-screen] [@play-limit-gate].

## The playtime log: per-day, per-game, plus granted extra minutes

`src/sdk/playtime/playtime.ts` persists one record at `kg:playtime`:
`{ days: Record<date, seconds>, games: Record<gameId, seconds>, extra:
Record<date, minutes> }` [@playtime]. `days` and `extra` are both pruned to
the most recent 14 days (`KEEP_DAYS`) every time they are written, keyed by
`YYYY-MM-DD` strings that sort chronologically so "keep the last N" is a
plain slice [@playtime]. `usePlaytimeTracker(trackId)` is what actually
accumulates seconds: while mounted with a non-null `trackId`, it tracks
elapsed time through React Native's `AppState`, flushing to `addPlaytime()`
every 15 seconds and again on unmount or on a transition to background, so a
backgrounded app never silently keeps counting [@playtime]. Passing `null`
instead of a `trackId` pauses tracking entirely — `PlayLimitGate` does this
while the break screen itself is showing, so the time spent reading the
break screen is never counted against the next day [@play-limit-gate]
[@playtime]. `overLimit(playtime, limitMin)` is the one function that decides
whether to block: `secondsToday(playtime) >= (limitMin + extraMinutesToday) *
60` [@playtime].

## The gate: block before the game ever mounts

`PlayLimitGate` wraps `children` (the actual game or journey content) and
decides what to render in three states. Both `playtimeStore` and
`settingsStore` load asynchronously, and the component deliberately renders
an empty `View` — not the game, and not a loading spinner — until *both* have
resolved; the component's own comment explains why: mounting the game against
default values first "would let an over-limit child hear its sounds/tutorial
before the break screen swaps in" [@play-limit-gate]. Once both are loaded,
`overLimit()` decides whether the real game renders or the `Recharge` break
screen takes over [@play-limit-gate].

`Recharge` is a calm, deliberately low-stimulation scene, not a dead end: a
night sky with a moon, a battery-drain animation, the child's own chosen buddy
dozing as a `<Lulu3D mood="encourage">` with a buddy-specific rest line
(`` buddy.${buddy}.rest ``), and three numbered stretch suggestions
(`break.stretch1`–`break.stretch3`) [@play-limit-gate]. See
[Buddy, mascot, and wardrobe](buddy-and-wardrobe) for what else `Lulu3D`
renders and why it is not behind the same `lazy()`/`Suspense` boundary as
every other 3D component in the app. Two buttons close the scene: "Home"
navigates away, and "grown-up, +15 more minutes" swaps itself for an inline
`<ParentGate>` — the same multiplication challenge
[Parent gate for Settings](../decisions/parent-gate-for-settings) documents —
and calls `grantExtraTime()` on a correct answer, adding `EXTRA_MINUTES`
(`15`) to that day's `extra` bucket rather than resetting or raising the
configured limit itself [@play-limit-gate] [@playtime]. This is a third reuse
of `ParentGate` purely as proof-of-adult rather than as a reversibility
check, alongside Settings itself and the
[store review prompt](store-review-prompt).

## Consequences for anything that plays time-tracked content

Any new top-level play surface that is not routed through
`GamePlayerScreen`/`FlowPlayerScreen` will not be subject to the daily limit
at all, since `PlayLimitGate` is wired at exactly those two call sites, not
inside the games themselves [@game-player-screen] [@flow-player-screen]. A
granted extra-time allowance is per calendar day and does not persist into
tomorrow — `extra` is keyed by the same `YYYY-MM-DD` day string as `days`, so
a fresh day always starts with zero extra minutes regardless of what was
granted the day before [@playtime].
