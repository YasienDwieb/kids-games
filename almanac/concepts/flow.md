---
title: "Flow"
summary: "A flow is a guided, scoreless sequence that interleaves content from multiple opted-in games into one continuous session, as an alternative to picking a single game from Home."
topics: [concepts, games, flow]
sources:
  - id: flow-registrar
    type: file
    path: src/flow/index.ts
  - id: flow-adapter
    type: file
    path: src/sdk/flow/adapter.ts
  - id: flow-player-screen
    type: file
    path: src/screens/FlowPlayerScreen.tsx
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
  - id: root-navigator
    type: file
    path: src/app/navigation/RootNavigator.tsx
---

A "flow" is a guided-play mode that strings together content units pulled
from several different games into one continuous, scoreless session, instead
of asking the player to pick a single game from Home and play it standalone.
Where playing a [game module](../concepts/game-module) means opening one
activity with its own score or level ladder, playing a flow means the app
decides what comes next: it walks a sequence of small rounds, each borrowed
from a different opted-in game, fading from one to the next inside a single
shared screen. `FlowPlayerScreen` is the real, registered `FlowPlayer` route
that plays this sequence — it is a shipped feature, not scaffolding
[@root-navigator].

## Why the product needs a separate mode

`HomeScreen`'s grid of game tiles is a "you choose" model: the player picks
one game, plays it, and comes back. That model is fine for score-driven play
but does not fit a parent who wants five minutes of varied, low-stakes
practice across several skills without deciding which game to open each time.
Flow answers that by removing the choice and the score: `HomeScreen` reads
`settings.flowGameIds` and, from a flow entry point, calls
`selectedAdapters()` to gather whichever games the player has opted into, then
navigates to `FlowPlayer` [@home-screen]. `FlowPlayerScreen` builds one
continuous sequence from those adapters with `useFlow` and renders each unit
in turn on top of an animated shared backdrop (`SceneCanvas`), cross-fading
between units as the player advances [@flow-player-screen].

## A flow unit is not a level

The building block a game contributes to a flow is a `FlowUnit`: a stable
`key` plus a `render(onComplete)` function that draws the game's existing
round content and calls `onComplete` when the child succeeds
[@flow-adapter]. There is no score, no level number, and no persisted
per-round result attached to a unit — completion is a boolean signal that
tells the sequence to advance, nothing more. This is the concrete way flow
differs from an ordinary game session: a normal game tracks `{level, score}`
progress through `useLevels`, while a flow unit is disposable and
`onComplete`-driven by design. A game does not automatically contribute to
flow just because it exists in the [Game registry](../architecture/game-registry) —
it has to opt in separately by registering a `FlowAdapter` (via
`registerFlowAdapter`) that knows how to produce a bounded number of units
from that game's own content [@flow-adapter].

## Which games participate

Six of the twelve registered games currently ship a `flow.tsx` adapter and
are wired into the flow registrar at `src/flow/index.ts`: `count-and-pop`,
`shape-detective`, `match-up`, `letter-land`, `numbers-land`, and
`animal-safari` [@flow-registrar]. The remaining six — `simple-pairs`,
`color-mixer`, `mouse-maze`, `balloon-archer`, `turbo-road`, and `candy-catch`
— have no flow adapter and never appear in a flow session. The player
controls which of the
eligible games are actually included through Settings, stored as
`settings.flowGameIds: string[] | null`; `null` means "all eligible games,"
otherwise only the listed ids are pulled in when `FlowPlayerScreen` builds its
sequence [@settings-store].

Flow's engineering is covered separately in the
[Flow engine](../architecture/flow-engine) page, and the reasoning for
building it as a registry parallel to, rather than layered on top of, the game
registry is recorded in
[Flow as a separate engine](../decisions/flow-as-separate-engine). To make an
existing game flow-eligible, see
[Add a game to flow](../guides/add-a-game-to-flow).
