---
title: "Decision: Gate Settings Behind a Parent-Solvable Challenge"
summary: "SettingsScreen renders nothing until ParentGate is passed — a randomly generated multiplication problem (operands 6-9, three choices, re-rolled on a wrong answer) that is trivial for an adult and out of reach for the app's 2-10 year old players, because everything behind Settings (language, the age filter, journey composition and reset) can break a child's own experience if changed by accident."
topics: [decisions, settings]
sources:
  - id: parent-gate
    type: file
    path: src/components/common/ParentGate.tsx
  - id: parent-gate-test
    type: file
    path: src/components/common/__tests__/ParentGate.test.ts
  - id: settings-screen
    type: file
    path: src/screens/SettingsScreen.tsx
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
---

This decision adds a lightweight access-control step in front of
`SettingsScreen`, so that a child playing unsupervised cannot reach controls
that would silently break their own experience. It has no accounts, no
passwords, and no persisted "is unlocked" state — the gate is solved fresh
every time `SettingsScreen` mounts. The exact fields it now protects (and the
two, `soundEnabled` and `language`, that were deliberately moved out from
behind it) are listed on the [Settings schema](../reference/settings-schema)
reference page; `ParentGate` itself is built from the same
[design system](../architecture/design-system) `PressableButton` every other
choice-driven control in the app uses.

## Context

Before this change, `SettingsScreen` was reachable by tapping its gear icon
from Home with no friction at all. Several of its controls are not
reversible-by-accident in a way a young child would notice or undo: the
language switch reloads the whole app into a script the child may not read,
the age-band filter can hide games from the child's own Home grid, and the
guided-journey reset (`HoldToConfirm`) discards saved progress through the
flow sequence. The app's players are as young as two years old
[@parent-gate], so any friction had to be solvable by an adult glancing at
the screen for a few seconds, but must not be solvable by a toddler tapping
buttons at random, and it could not rely on reading comprehension, since a
pre-reader is exactly who the gate exists to stop.

## Decision

`ParentGate` (`src/components/common/ParentGate.tsx`) renders a single
multiplication challenge and blocks everything else until it is answered
correctly. `makeChallenge()` picks two operands in the `6`–`9` range —
"trivial for an adult, out of reach for the 2-10 year olds this gate exists
to stop," per the component's own comment [@parent-gate] — and offers three
choices: the correct product and two decoys drawn from plausible near-misses
(off by one operand, or off by 10), so the gate cannot be beaten by picking
whichever answer looks least round [@parent-gate]. Every wrong answer
re-rolls a brand-new challenge via a `round` state counter, so the gate cannot
be brute-forced by repeatedly tapping the same screen position
[@parent-gate]. `SettingsScreen` holds the pass/fail state itself: it renders
only `AppBar` plus `<ParentGate onPass={() => setUnlocked(true)} />` until
`unlocked` becomes `true`, at which point the real Settings content (general
toggles and the age-band chips, plus a separate "journey" tab for flow-game
selection and reset) renders instead [@settings-screen]. `unlocked` is local
component state — navigating away and back to Settings re-locks it.

Sound and language were deliberately kept *outside* the gate, on `HomeScreen`
itself, rather than moved behind it along with the rest of Settings — the
screen's own comment states why: "muting is the most urgent control in the
app and both are trivially reversible, so making a parent solve arithmetic
for them was the wrong trade" [@home-screen]. The language switcher, too, has
its own confirmation dialog on Home rather than relying on `ParentGate` for
protection, since it is already reversible in one tap either direction. The
challenge generator, `makeChallenge`, is exported specifically so its
invariants can be tested without rendering the component:
`ParentGate.test.ts` pins that it always returns exactly three distinct
choices including the correct answer, that operands always land in
`[6, 9]`, that no decoy is zero or negative, and that the answer is not
always in the same slot [@parent-gate-test].

## Status

Current.

## Consequences

Adding a new control to `SettingsScreen` means deciding explicitly whether it
belongs behind `ParentGate` (most controls do, by default) or should live
somewhere ungated like `HomeScreen`, following the sound/language precedent —
the criterion the code establishes is reversibility and urgency, not just
"is this a setting." Because the gate is unlocked state local to
`SettingsScreen`, there is no way to stay "trusted" across a navigation
away-and-back, and no way to disable the gate from within the app itself.
The gate protects only the in-app UI; it is not a security boundary against a
technically sophisticated user, and it was never designed to be one — its
entire job is to stop a young child from reaching a few specific controls
by accident.
