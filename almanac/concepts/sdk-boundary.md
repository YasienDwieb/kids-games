---
title: "SDK Boundary"
summary: "The rule that every game imports only from @/sdk, never from another game or a deep src/ path, with one narrow sanctioned exception."
topics: [concepts, sdk, games]
sources:
  - id: claude-md
    type: file
    path: CLAUDE.md
  - id: contributing
    type: file
    path: CONTRIBUTING.md
  - id: sdk-barrel
    type: file
    path: src/sdk/index.ts
  - id: alias-test
    type: file
    path: src/sdk/__tests__/alias.test.ts
  - id: listen-find-dir
    type: file
    path: src/games/_shared/listen-find/
  - id: listen-find-index
    type: file
    path: src/games/_shared/listen-find/index.ts
---

The SDK boundary is the rule that every game folder under `src/games/` imports
exclusively from `@/sdk` — never from another game's folder, and never from a
deep `src/` path such as `@/sdk/audio/useSound` or `../../components/common`
[@contributing]. `@/sdk` is a single barrel module, `src/sdk/index.ts`, that
re-exports everything a game is allowed to touch: the config/registry API,
design tokens, UI primitives, the asset manifest, storage, settings, audio,
speech, motion, layout (`GameShell`), age bands, progress/levels, i18n, and the
flow engine [@sdk-barrel]. The boundary exists so that twelve independently
built games, written at different times by different contributors, cannot
develop hidden coupling to each other's internals — a game can only break by
changing its own code or the SDK's public contract, never by another game
changing an implementation detail it never should have reached into
[@contributing].

## Why the boundary is a single barrel, not a convention

Nothing in the type system stops a file under `src/games/letter-land/` from
writing `import { Foo } from '../numbers-land/utils/levels'` — the boundary is
enforced by review discipline and by the shape of the barrel, not by a lint
rule. Routing every game through one export surface has a second, more
concrete payoff: it turns SDK-internal circular imports into a single
loud test failure instead of an intermittent runtime crash. `src/sdk/index.ts`
re-exports `components/common` (the UI primitives), and if any SDK-internal
module imported those primitives back through the `@/sdk` barrel instead of by
direct path, the circular import would leave some exports `undefined` at
access time — the exact "Cannot read property 'IconButton' of undefined"
crash. `src/sdk/__tests__/alias.test.ts` guards against this by asserting that
roughly twenty of the barrel's named exports (UI primitives, layout, registry,
tokens, i18n) are all defined immediately after the barrel loads
[@alias-test]. That test is the boundary's only automated enforcement; the
"games don't import each other" half of the rule is enforced by code review
against [@claude-md] and [@contributing].

This makes the `@/sdk` import boundary a foundational fact for understanding
any [Game module](../concepts/game-module): a game's own folder is the only
place its code lives, and the [Game registry](../architecture/game-registry)
is the only channel through which that folder's existence becomes visible to
the rest of the app.

## The one sanctioned exception

`src/games/_shared/listen-find/` breaks the "never import another game's
folder" half of the rule, deliberately and narrowly. It is a reusable
listen-and-find engine — `ListenFindBoard`, `useListenFind`, a level generator,
an order-seeding store, and shared types — consumed directly by three sibling
games: `letter-land`, `numbers-land`, and `animal-safari`, each importing it
from both their standalone `index.tsx` entry point and their `flow.tsx` flow
adapter [@listen-find-dir]. Like the SDK itself, it exposes one entry point,
`src/games/_shared/listen-find/index.ts`, rather than letting consumers reach
into its individual files [@listen-find-index]. The exception is scoped
tightly on purpose: it is one mechanic (hear a prompt, tap the matching tile
among a set of choices) reused by exactly three games that all need the same
generation and playback logic, not a general escape hatch for cross-game
sharing. Any other cross-game reuse is expected to be promoted into `@/sdk`
itself rather than added as a second `_shared/` folder.

The [SDK-only import boundary](../decisions/sdk-only-import-boundary) decision
page records why this exception was accepted instead of generalized, and the
[Game registry](../architecture/game-registry) explains how a game's `config.ts`
uses the registry half of the `@/sdk` surface to make itself visible without
ever needing to import another game directly.
