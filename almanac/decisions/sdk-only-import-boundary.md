---
title: "Decision: SDK-Only Import Boundary Between Games"
summary: "Games may import only from the @/sdk barrel, never from each other or from deep src/ paths, with a single carved-out exception for a shared listen-and-find engine."
topics: [decisions, sdk, games]
sources:
  - id: contributing
    type: file
    path: CONTRIBUTING.md
  - id: claude-md
    type: file
    path: CLAUDE.md
  - id: listen-find-dir
    type: file
    path: src/games/_shared/listen-find/
---

This decision fixes how the twelve game modules under `src/games/` are allowed
to depend on each other: not at all, except through the `@/sdk` barrel, with one
narrow, explicitly named exception. It is what keeps a codebase built by many
different contributors — human and AI agent alike — from turning into a web of
undocumented cross-game coupling. The rule that results is the
[SDK boundary](../concepts/sdk-boundary), and it is what makes a
[game module](../concepts/game-module) an independently reviewable unit rather
than a thread in a larger tangle.

## Context

`src/games/` holds more than a dozen independent game folders, several of which
were built at different times by different people and by AI coding agents
working from the shared `CONTRIBUTING.md`/`CLAUDE.md` instructions rather than
from each other's source. Left unconstrained, nothing would stop one game's
code from reaching into another game's internal component, hook, or util — a
shortcut that is tempting whenever two games look similar, but that quietly
creates a dependency edge no one tracks. Once that edge exists, changing or
deleting the game on the other end risks breaking a sibling game that was never
supposed to know it existed. At the same time, some game mechanics really are
identical across games. "Listen to a clue, then find the matching tile in a
scrambled board" is the same interaction whether the tiles are letters, numbers,
or animals, and writing that board/generation/pick logic three separate times
invites the three copies to drift out of sync as bugs are fixed in only one of
them.

## Decision

The project enforces that every game imports exclusively from `@/sdk`.
`CONTRIBUTING.md` states this as the SDK contract in bold: "All games import
exclusively from `@/sdk`. This is the stable public surface. Never reach into
another game's folder, and never import from deep `src/` paths like
`@/sdk/audio/useSound` or `../../components/common`" [@contributing]. `CLAUDE.md`
repeats the same rule for the project's own repo intent — "Games never share
mutable state or import from one another" — and lists `@/sdk` as "the single
import surface for games" [@claude-md].

The one exception the project has carved out is `src/games/_shared/listen-find/`,
a reusable listen-and-find engine that exports board rendering
(`ListenFindBoard`), pick/replay/correct-index state (`useListenFind`), and level
generation logic (`generate.ts`, `orderStore.ts`) through a single `index.ts`
barrel [@listen-find-dir]. Three sibling games import it directly —
`letter-land`, `numbers-land`, and `animal-safari` — each using it for both its
standalone play mode and its flow adapter. This module deliberately does not
live inside `@/sdk`; it lives inside `src/games/`, one level below the game
folders it serves, which marks it as scoped to this one shared mechanic rather
than promoted to the general SDK surface. No other `_shared` subfolder exists
in the repository, and no game reaches into another game's own folder — the
`_shared/listen-find` path is the only sanctioned crack in the boundary.

## Status

Current and enforced by documented convention. Based on the evidence reviewed
here — `CONTRIBUTING.md` and `CLAUDE.md` state the rule, and no ESLint or other
build-time import-restriction configuration exists in the repository to reject
a violation automatically — this boundary is a contributor discipline, not a
lint gate.

## Consequences

Every game stays independently reviewable and removable: deleting or rewriting
a game's folder cannot silently break a sibling, because nothing outside
`_shared/listen-find` is allowed to depend on that folder's internals. The
tradeoff moves onto the SDK instead — because it is the one surface every game
touches, any breaking change to `@/sdk` now has to be considered against all
twelve games at once, which raises the bar for changing that surface casually.
This is the same reason the [game registry](../architecture/game-registry) can
stay a simple in-memory map: it only ever has to reason about one game at a
time, never about one game reaching into another.

The decision also creates a recurring question whenever a mechanic turns out to
be shared by more than one or two games: duplicate the logic, promote it into
`@/sdk` for good, or add a new narrowly-scoped `_shared/<name>` module the way
`listen-find` was added. So far the project has chosen the narrow-module path
exactly once. Because the rule is convention rather than a lint rule, staying
inside the boundary depends on contributors (and the agents acting on their
behalf) reading and following `CONTRIBUTING.md`, not on a build failure catching
a violation.
