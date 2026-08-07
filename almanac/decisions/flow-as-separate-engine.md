---
title: "Decision: Flow as a Separate Engine"
summary: "Guided cross-game play is built as a second, parallel registry and a separate persisted checkpoint instead of extending each game's own registry entry or progress store."
topics: [decisions, flow, architecture]
sources:
  - id: flow-adapter
    type: file
    path: src/sdk/flow/adapter.ts
  - id: flow-progress
    type: file
    path: src/sdk/flow/progress.ts
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
---

This decision explains why "guided journey" mode — the app choosing what to
play next across several games in one continuous session — is not a mode flag
bolted onto the existing game registry and progress system, but an entirely
parallel one: a second adapter registry, a second persisted checkpoint, and its
own screen. The mode itself is the concept of [Flow](../concepts/flow); this
page records why its implementation, the
[flow engine](../architecture/flow-engine), was built as a sibling to the
[game registry](../architecture/game-registry) rather than as an extension of
it.

## Context

The product wanted a low-pressure, guided mode where a parent or the app itself
picks what a child plays next, moving across several games in one continuous
session rather than one game at a time from the home grid. That mode has to
coexist with each game's existing, independent level/score progression without
disturbing it — a child's progress in `letter-land`'s own levels should be
untouched by whatever happens while they are inside a guided flow session. Not
every game mechanic translates cleanly into a scoreless "unit" a guided flow can
hand off between games; only some games make sense to include. Any design here
had to answer both questions at once: how does a game opt in to guided content,
and where does the flow's own position get remembered between app launches,
given that it is not any single game's position.

## Decision

Flow is implemented as a fully separate system rather than an extension of the
existing game infrastructure. It has its own adapter registry —
`registerFlowAdapter`/`getFlowAdapter` in `src/sdk/flow/adapter.ts` — distinct
from the game registry (`registerGame`/`getGame` in `src/sdk/config/registry.ts`)
that every game already uses to appear on the home screen [@flow-adapter]. A
`FlowAdapter` is a small, explicit opt-in contract: a `gameId`, a `count` of
finite content units the game contributes, and a `unitAt(i, seed)` function that
builds one scoreless `FlowUnit` — a `render(onComplete)` closure the flow calls
into [@flow-adapter]. `selectedAdapters(flowGameIds)` resolves which adapters a
session should pull from, `null` meaning "all eligible games are included"
[@flow-adapter]. `Settings.flowGameIds` is exactly that `string[] | null`
selection, persisted alongside the app's other settings and read through
`useSettings` [@settings-store].

Flow's own position is a second, separate persisted checkpoint. `src/sdk/flow/
progress.ts` defines `FlowProgress = { step, seed, updatedAt }` and stores it
under its own store namespace via `createFlowProgressStore()`, which resolves to
the key `kg:flow:progress` [@flow-progress] — distinct from each game's own
`kg:progress:<gameId>` checkpoint. The comment in the file states the design
intent directly: "Guided-journey checkpoint. Scoreless by design — we persist
only how far through the interleaved sequence the child has reached (`step`)
plus the session `seed` so resumed content is identical to what they left"
[@flow-progress]. `resolveStart` and `advanceStep` implement the resume/advance
rules against that checkpoint: an empty journey or a saved step at or past the
total is treated as "done," otherwise the saved step is honored and clamped into
range [@flow-progress]. A dedicated navigation screen (`FlowPlayerScreen`) hosts
this loop, rather than a mode flag threaded through `GamePlayerScreen`.

A game opts in by writing a `flow.tsx` file that calls `registerFlowAdapter`.
That is a deliberate, per-game choice — only 6 of the repository's 12 games
(`animal-safari`, `count-and-pop`, `letter-land`, `match-up`, `numbers-land`,
`shape-detective`) currently ship one.

## Status

Implemented and shipped; `FlowPlayerScreen` is a live, reachable route, and the
settings screen already exposes which games feed a session through
`Settings.flowGameIds` [@settings-store].

## Consequences

The project now maintains two parallel registries (game registry and flow
adapter registry) and two parallel persistence schemes (per-game
`kg:progress:<gameId>` and the single `kg:flow:progress` checkpoint, both built
on the same [storage and progress](../architecture/storage-and-progress)
primitives) instead of one unified system. That is a real, ongoing maintenance
cost: any future change to how progress or registration works has to be
considered for both systems independently.

In exchange, a game's flow adapter can reuse the game's own board or rendering
component — the `FlowUnit.render` closure is typically the game's existing
round/puzzle view — so guided mode does not duplicate UI, only the
scoring-free wiring that lets that view slot into a cross-game sequence
[@flow-adapter]. A game can ship standalone without ever supporting flow, since
nothing about the game registry or a game's own progress store depends on
whether a `flow.tsx` file exists. Flow support can be added to a game later,
purely by adding an adapter, without touching that game's own registry entry or
progress data at all.
