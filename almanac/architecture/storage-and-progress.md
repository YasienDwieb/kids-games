---
title: "Storage and Progress Architecture"
summary: "createStore is the single AsyncStorage primitive behind two systems: per-game level/resume progress driven by useLevels and resumeStatusFor, and app-wide settings driven by useSettings — both namespaced under kg: keys."
topics: [architecture, storage, progress, settings]
sources:
  - id: create-store
    type: file
    path: src/sdk/storage/createStore.ts
  - id: progress-store
    type: file
    path: src/sdk/progress/store.ts
  - id: progress-status
    type: file
    path: src/sdk/progress/status.ts
  - id: use-levels
    type: file
    path: src/sdk/progress/useLevels.ts
  - id: progress-source
    type: file
    path: src/sdk/progress/source.ts
  - id: resume-prompt
    type: file
    path: src/sdk/progress/ResumePrompt.tsx
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
  - id: settings-hook
    type: file
    path: src/sdk/settings/useSettings.ts
---

Everything the app persists between launches — a game's saved level, its
cumulative score, whether sound and haptics are on, which age band and
language the parent picked — goes through one function: `createStore`. It is
the only place `@react-native-async-storage/async-storage` is touched
directly, and every higher-level system in this area is built by calling it
once with a namespace and a default value. Two independent systems sit on top
of it: per-game progress (`useLevels`, backed by `resumeStatusFor` and
`ResumePrompt`) and app-wide settings (`useSettings`). Both follow the same
read-merge-write, fire-and-forget persistence pattern, which is worth
recognizing once so it doesn't need re-explaining at each call site.

## `createStore`: the shared primitive

`createStore<T>(namespace, defaultValue)` returns `{ get, set, subscribe }`
backed by `AsyncStorage`, with the storage key computed as `` `kg:${namespace}` ``
[@create-store]. `get()` reads that key, parses it as JSON, and falls back to
`defaultValue` both when the key is missing and when `JSON.parse` throws — a
corrupted or unexpected value on disk degrades to the default rather than
crashing the caller [@create-store]. `set(value)` writes the JSON-serialized
value and then synchronously calls every subscriber function with the new
value, so a store update is visible to every mounted consumer without an
extra read round-trip [@create-store]. `subscribe(fn)` adds `fn` to an
internal `Set` and returns an unsubscribe closure [@create-store]. Nothing
above this layer needs to know it's `AsyncStorage` underneath — both progress
and settings just call `createStore` with their own namespace and shape. The
[Storage keys](../reference/storage-keys) reference page lists every
namespace this produces across the app.

## Per-game progress: `Progress`, `useLevels`, and resuming

A game's saved state is the `Progress` shape: `{ level, score, updatedAt }`,
with `DEFAULT_PROGRESS = { level: 1, score: 0, updatedAt: 0 }` — the `0` in
`updatedAt` is an explicit sentinel meaning "never played," not a real
timestamp [@progress-store]. `createProgressStore(gameId)` is just
`createStore('progress:' + gameId, DEFAULT_PROGRESS)`, so each game's
progress lands under its own `kg:progress:<gameId>` key, fully isolated from
every other game's save data [@progress-store].

Whether a returning player should be offered "continue" or dropped straight
into a fresh game is decided by one function: `resumeStatusFor(progress)`
returns `'resumable'` if `progress.level > 1 || progress.score > 0`, and
`'playing'` otherwise [@progress-status]. That is the whole resume rule —
reaching past level one or earning any score at all is enough to be worth
resuming; a player who backed out on level one with no score looks
indistinguishable from a player who never started.

`useLevels({gameId, source})` is the state machine games actually call. It
loads the saved `Progress` once on mount and sets `status` to `'loading'`
until that resolves, then to whatever `resumeStatusFor` decides
[@use-levels]. `start()` moves straight to `'playing'` without touching the
saved level or score — this is the "continue" path. `startOver()` persists a
fresh `{level: 1, score: 0, updatedAt: Date.now()}` and also sets `'playing'`
— this is the "start over" path [@use-levels]. Both paths are exactly what
`ResumePrompt` offers: a card showing the localized `resume.welcomeBack`
title with a `resume.continueLevel` button that calls `onContinue` and a
`resume.startOver` button that calls `onStartOver`, wired to `start`/`startOver`
by whichever game embeds it [@resume-prompt]. Every write from `useLevels` —
`persist`, called by `startOver`, `advance`, `addScore`, and `goTo` — updates
local state synchronously and then calls `store.set(next)` without awaiting
it, a fire-and-forget write that matches the same pattern `useSettings.update`
uses below [@use-levels].

`advance(deltaScore?)` is the one operation that has to know about a level
source's upper bound: `const max = source.count; const nextLevel = max != null
? Math.min(cur.level + 1, max) : cur.level + 1;` — so an endless generator
(`count` is `undefined`) just keeps incrementing, while a finite source clamps
at its last level instead of ever asking for a level that doesn't exist
[@use-levels]. That clamping is deliberate compensation for how
`LevelSource` itself behaves: `levelsFromList(items)` throws a `RangeError`
both for an empty `items` array and for any out-of-range `get(level)` call,
because a hand-authored list has a hard edge that should never silently be
crossed [@progress-source]. `levelsFromGenerator(generate, {count?})`, by
contrast, does not range-check its own `get()` at all — the source file's own
comment notes this is unlike `levelsFromList` — because a runtime generator
can synthesize a level for any input; `useLevels` is what keeps `advance()`
from ever asking a bounded generator for a level past `count`, via the
`Math.min` clamp above rather than via a `RangeError` inside the source
itself [@progress-source]. `isLast` mirrors that same clamp as a boolean:
`source.count != null && progress.level >= source.count` [@use-levels].

## App settings: one global, namespaced record

`Settings` covers every cross-game preference: `soundEnabled`,
`hapticsEnabled`, `ageBand: string | null`, `language: string | null`,
`mode: 'free' | 'guided'`, and `flowGameIds: string[] | null`
[@settings-store]. `DEFAULT_SETTINGS` turns every boolean on and leaves every
nullable field `null` [@settings-store]. `settingsStore` is
`createStore('settings', DEFAULT_SETTINGS)`, persisting under the single key
`kg:settings` [@settings-store] — the [Settings schema](../reference/settings-schema)
reference page documents every field's meaning and valid values in full.
`useSettings()` reads the store once on mount, subscribes for live updates via
`settingsStore.subscribe`, and exposes `update(patch: Partial<Settings>)` as
`const next = { ...(await settingsStore.get()), ...patch }; await
settingsStore.set(next);` — a read-merge-write that lets any caller update a
single field without clobbering the rest of the record [@settings-hook].

`mode` and `flowGameIds` exist specifically to support the guided-journey
feature: `flowGameIds` selects which games' content feeds that journey, and
`mode` records whether the app is currently in the free game-grid mode or the
guided one. Neither field is read or written by anything in this file's own
scope — they are consumed by the flow-selection logic covered in the
[Flow engine](../architecture/flow-engine) architecture page, which this page
only needs to flag as the reason those two fields live on `Settings` at all.

## Why one primitive backs both systems

Progress and settings look different in shape — one is namespaced per game
and reset with a two-button prompt, the other is a single global record
updated by patch — but both being built on the same `createStore` means a
maintainer only has to understand one persistence contract (JSON-in,
default-on-miss, synchronous subscriber notification, fire-and-forget writes)
to reason about either system. Any future feature needing its own persisted
slice — a new per-game record, or a new app-wide preference — has an obvious
place to start: call `createStore` with a new namespace rather than touching
`AsyncStorage` directly.
