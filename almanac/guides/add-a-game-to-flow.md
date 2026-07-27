---
title: "Add a Game to Flow"
summary: "Make an already-shipped game flow-eligible by writing a flow.tsx adapter that replays its existing board component in scoreless rounds inside guided mode."
topics: [guides, games, flow]
sources:
  - id: animal-safari-flow
    type: file
    path: src/games/animal-safari/flow.tsx
  - id: flow-index
    type: file
    path: src/flow/index.ts
  - id: adapter-ts
    type: file
    path: src/sdk/flow/adapter.ts
  - id: use-flow-round
    type: file
    path: src/sdk/flow/useFlowRound.ts
  - id: settings-screen
    type: file
    path: src/screens/SettingsScreen.tsx
  - id: animal-safari-levels
    type: file
    path: src/games/animal-safari/utils/levels.ts
---

Use this guide when a game already exists and is registered on Home, and you
want its content to also appear as scoreless rounds inside the app's guided
[Flow](../concepts/flow) journey — the interleaved sequence `FlowPlayerScreen`
plays through across every flow-enabled game. By the end, a parent will be
able to pick your game from the flow game list in Settings and see its
rounds mixed in with the others.

This guide assumes the game itself already exists; see
[Add a new game](../guides/add-a-new-game) for scaffolding one from scratch —
that task is not repeated here.

## Steps

**1. Create `flow.tsx` in the game's folder.** This file is where the whole
adapter lives; nothing outside the game folder needs to know about its
internals.

**2. Call `registerFlowAdapter({ gameId, count, unitAt })`.** `count` is the
number of distinct content units the game can contribute to one journey, and
`unitAt(i, seed)` builds the unit for local index `i`, returning a
`FlowUnit = { key, render(onComplete) }` [@adapter-ts]. Reuse the game's
existing board or rendering component instead of building new UI for flow —
`animal-safari/flow.tsx` is the concrete pattern to follow: its
`AnimalSafariFlowRound` component renders the exact same shared
`ListenFindBoard` the standalone game uses, just wired to flow's completion
callback instead of the game's own score state [@animal-safari-flow]. If the
round's interaction shape is a simple tap-a-choice pattern, pull in
`useFlowRound` from `@/sdk` — it centralizes the correct/wrong tap handling,
the success sound cue, and the `onComplete` timing so each adapter stays thin
[@use-flow-round].

**3. Make the unit scoreless.** Call the `onComplete` callback `useFlowRound`
gives you when the round finishes; do not touch the game's own level or score
state from inside the adapter. `useFlowRound`'s `complete()` plays the
`'success'` sound cue and calls `onComplete` after a short delay, and is
idempotent against being triggered twice [@use-flow-round].

**Honor the `seed` argument — do not recompute your own.** `unitAt(i, seed)`
is handed a per-journey seed that changes every time the player calls
`reset()`; thread it into whatever PRNG state drives your round's layout
instead of deriving a seed purely from `i`. `animal-safari/flow.tsx`
originally ignored the incoming seed and recomputed `level * 7919` itself, so
`reset()` had no visible effect — every journey replayed the exact same
distractors and correct-tile position. `roundForUnit(i, sessionSeed)` in
`animal-safari/utils/levels.ts` is the pattern to copy: mix the seed into
layout only, and keep it out of which content item unit `i` actually
represents, so guided mode still plays the same content ladder as the
standalone game [@animal-safari-levels].

**4. Add one side-effect import to `src/flow/index.ts`.** This file is the
flow equivalent of `src/games/index.ts` — the single place that imports every
flow-enabled game's adapter module for its registration side effect
[@flow-index]. Add `import '../games/<id>/flow';` alongside the existing
entries; that's the only shared file this task touches.

## Verification

Run the app, open Settings, and select your game in the guided-journey game
list — `SettingsScreen` reads `eligibleGameIds()` to populate that list, so a
game only appears there once its `flow.tsx` module has registered an adapter
[@settings-screen]. Start guided mode and confirm your game's rounds appear
in the flow sequence. Then play the same game standalone from Home and
confirm its own score and level are unaffected by having played it through
flow — flow tracks its own journey checkpoint separately from any single
game's progress, as detailed on the
[Storage keys](../reference/storage-keys) reference page, so a round played
through flow should never move the needle on the game's own save file.
