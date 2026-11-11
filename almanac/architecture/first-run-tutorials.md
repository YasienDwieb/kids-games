---
title: "First-Run Tutorials"
summary: "useFirstRun gates a per-game demo to show once per device, DemoHand draws the looping ghost-hand animation that demo plays, and useIdle re-arms that same help if a child stalls mid-game — three small, independent primitives that together replace per-game onboarding code with one pattern."
topics: [architecture, sdk, engagement]
sources:
  - id: use-first-run
    type: file
    path: src/sdk/tutorial/useFirstRun.ts
  - id: demo-hand
    type: file
    path: src/sdk/tutorial/DemoHand.tsx
  - id: use-idle
    type: file
    path: src/sdk/tutorial/useIdle.ts
  - id: first-run-test
    type: file
    path: src/sdk/tutorial/__tests__/useFirstRun.test.tsx
  - id: mouse-maze-index
    type: file
    path: src/games/mouse-maze/index.tsx
  - id: gdd-readme
    type: file
    path: docs/gdd/README.md
  - id: claude-md
    type: file
    path: CLAUDE.md
---

The cross-game engagement audit in `docs/gdd/README.md` lists "No
onboarding / demo hand" as a gap shared by all twelve games — a pre-reader
dropped into a game with only a line of text to go on has no way to learn
what to actually do with their finger [@gdd-readme]. The tutorial kit under
`src/sdk/tutorial/` is the SDK-wide fix: `useFirstRun` decides *whether* to
show a demo, `DemoHand` draws *what* the demo looks like, and `useIdle`
decides *when* to show it again if the first showing didn't stick. None of
the three depends on the other two — a game can use `DemoHand` without
`useFirstRun`, or gate something else entirely with `useFirstRun` — but they
are designed to compose, and `mouse-maze` is the reference integration that
uses all three together: a first-run drag demo on level one, re-armed by an
idle timer if the child stalls partway through a later level
[@mouse-maze-index] [@claude-md].

## `useFirstRun`: a persisted gate, once per id

`useFirstRun(id)` returns `{ status, complete }`, where `status` starts at
`'loading'` while a saved list of seen tutorial ids is read from storage,
then resolves to `'show'` if `id` is not yet in that list or `'done'` if it
is [@use-first-run]. Calling `complete()` immediately flips local `status` to
`'done'` and, if `id` isn't already recorded, appends it to the persisted
list — the optimistic local flip happens before the write resolves, so a
game doesn't have to wait on storage before hiding its own demo
[@use-first-run]. The persisted shape is `TutorialProgress = { seen: string[]
}`, stored under the single shared key `kg:tutorial` via
`tutorialStore = createStore('tutorial', { seen: [] })` — every game's seen
tutorials live in one list, not one key per game, which is why `id` has to be
chosen carefully: a game with more than one distinct demo uses a namespaced
id like `'color-mixer:drag'` rather than relying on the bare game id to mean
only one thing [@use-first-run]. `useFirstRun.test.tsx` is the behavioral
proof of the gate: a fresh id resolves to `'show'`, calling `complete()`
flips it to `'done'` for that hook instance, and a second `useFirstRun` call
for the same id — simulating a later app launch — resolves straight to
`'done'` without ever passing through `'show'` again [@first-run-test].

Because the gate is per `id` and permanent once completed, there is no
"show again" affordance built into the hook itself; a game that wants a
replayable demo has to pair `useFirstRun` with its own UI for that (a help
button), or rely on `useIdle` below to resurface help without needing the
gate to reopen.

## `DemoHand`: the ghost hand, in physical coordinates

`<DemoHand mode="tap" points={[{x,y}]} />` or `<DemoHand mode="drag"
points={[a, b, c]} />` renders a looping, `pointerEvents="none"` emoji glyph
that either taps each point in sequence (move, pulse, pause) or glides
smoothly through all of them before fading out and restarting
[@demo-hand]. The component's own comment states its coordinate contract
plainly: points are in the physical coordinate space of the hand's parent,
not mirrored for Arabic — "games pinned with `direction: 'ltr'` pass the
same values in both languages" [@demo-hand]. This is a deliberate,
narrower version of the RTL coordinate rule covered on the
[i18n and RTL](i18n-and-rtl) page: a demo hand choreographed for a specific
pixel layout has to land on the same literal spot the child's finger needs
to touch, in whichever language the game itself keeps physically pinned —
mirroring the demo's path without also mirroring the game board underneath
it would point at empty space.

`DemoHand` has no storage and no gating logic of its own; it is pure
animation driven entirely by the `mode`/`points`/`size`/`pauseMs` props a
game passes in, which is why it composes cleanly with either
`useFirstRun`'s one-time gate or `useIdle`'s repeating one below.

## `useIdle`: re-arming help without being asked

`useIdle(ms, active)` returns `{ idle, poke }`. It starts a timer that flips
`idle` to `true` after `ms` of inactivity; calling `poke()` — wired to every
meaningful touch in the game — resets that timer and clears `idle` again
[@use-idle]. The `active` flag gates the whole mechanism from outside: a
game passes something like `status === 'playing' && !state.won` so the timer
only runs during actual gameplay, not on a win screen or while loading
[@use-idle] [@mouse-maze-index]. A game typically renders its `DemoHand` (or
some other hint) conditionally on `idle`, so a child who stops interacting
for the configured window sees the same kind of help the first-run demo gave
them, without the game needing a second, separate "are they stuck" system.

## Why this stays three primitives, not one hook

`useFirstRun`, `DemoHand`, and `useIdle` could have been collapsed into a
single "show the game's tutorial" hook, but keeping them separate is what
lets `mouse-maze`'s actual wiring — one `DemoHand` instance, shown once by
`useFirstRun` and again on demand by `useIdle` — exist without any
combinator layer in the SDK itself. A future game that only needs idle-based
re-prompting (no first-run gate at all), or only needs the first-run gate
to show something that isn't a `DemoHand`, is already supported by this
shape. See [Celebration, combo streaks, and the hint ladder](celebration-and-hints)
for the companion engagement-kit page from the same effort, and
[Storage and progress](storage-and-progress) for how `createStore` backs
`tutorialStore` the same way it backs every other persisted slice in the
app.
