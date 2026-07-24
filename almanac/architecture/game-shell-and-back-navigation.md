---
title: "Game Shell and Back Navigation Architecture"
summary: "GameShell supplies the AppBar-and-overlay chrome that shell-mode games render inside, while ScreenBackContext lets any game intercept both on-screen and Android hardware back presses before GamePlayerScreen navigates away."
topics: [architecture, games, navigation]
sources:
  - id: game-shell
    type: file
    path: src/sdk/layout/GameShell.tsx
  - id: game-shell-context
    type: file
    path: src/sdk/layout/GameShellContext.tsx
  - id: layout-types
    type: file
    path: src/sdk/layout/types.ts
  - id: screen-back-context
    type: file
    path: src/sdk/layout/ScreenBackContext.tsx
  - id: game-player-screen
    type: file
    path: src/screens/GamePlayerScreen.tsx
---

Every game plugged into `GamePlayerScreen` needs two things it should not
have to reimplement itself: a consistent header/overlay chrome, and a way to
tell the back button "not yet" when the game has its own internal navigation.
`GameShell` provides the first as an opt-out layout wrapper, and
`ScreenBackContext` provides the second as a small interception protocol that
both the on-screen back button and Android's hardware back key funnel
through. Both live under `src/sdk/layout/` and are wired together by
`GamePlayerScreen`, which decides per game whether to mount the shell at all
and which back handler ultimately wins.

## `GameShell`: chrome for shell-mode games

`GameShell` renders a `SafeContainer` containing an `AppBar` (title, an
optional back button, and a right-hand slot for a custom header node, a score
readout, and a pause button) followed by the game's `children`, with a
`GameOverlay` modal layered on top [@game-shell]. The overlay is not a stack
of independent modals; it is driven by one `overlays` state object keyed by
slot, and `GameShell` picks at most one slot to actually show, in a fixed
priority order: `['error', 'pause', 'win', 'loading']` — so an error interrupts
a pause screen, a pause interrupts a win screen, and so on [@game-shell]. A
game reaches this state through `useGameShell()`, which returns
`{ setScore, showOverlay, hideOverlay }` from `GameShellContext`
[@game-shell-context]. This is intentionally a small surface: a game can set
its score display and show or hide exactly one of four named overlay kinds,
but the shell — not the game — owns the header layout and the modal
mechanics around them.

## Layout modes: `shell` versus `bare`

Not every game wants this chrome. `GameConfig.layout` is optional and its
`mode` field is either `'shell'` (the default) or `'bare'`
[@layout-types]. `GamePlayerScreen` reads this field to decide what to render
around the game's root component: in `'bare'` mode the game gets a plain
`View` sized to the screen with only a floating `BackButton` on top, and owns
its own safe-area handling and canvas; in the default `'shell'` mode,
`GamePlayerScreen` wraps the game in `GameShell`, passing through
`layout.title ?? gameName(game)`, `game.backgroundColor`, and
`layout.showBack ?? true` [@game-player-screen]. This choice is made once,
per game, in that game's `config.ts` — a game with a full-bleed canvas (for
example a driving or drawing surface) picks `'bare'` to avoid fighting the
shell's own padding and header height, while a game with a conventional
scored-rounds structure takes the default `'shell'` chrome for free. The
[Game config schema](../reference/game-config-schema) reference page defines
the exact `layout` field shape; this page is about what each mode actually
renders.

## `ScreenBackContext`: one interceptor, two input sources

`ScreenBackContext` carries a single setter function,
`(fn: BackInterceptor | null) => void`, where `BackInterceptor` is
`() => boolean` [@screen-back-context]. A game calls the `useScreenBack(handler)`
hook to register itself: the hook calls the context setter with `handler` on
every render and clears it (`register(null)`) on unmount [@screen-back-context].
The contract is explicit in the hook's own comment: return `true` from the
handler to consume the back press — typically to pop an internal screen, like
going from a board view back to a picker — and return `false` to let the app
navigate up to Home [@screen-back-context]. Because the hook re-registers on
every render rather than once, "the latest handler always wins" — if a game
conditionally supplies a different closure depending on its own internal
state, the currently mounted closure is always the one `GamePlayerScreen`
calls, with no stale-handler risk across re-renders [@screen-back-context].

`GamePlayerScreen` is where the provider actually lives and where both input
sources converge on the same ref. It creates `interceptorRef`, wraps the
context's setter in `setInterceptor` so `ScreenBackContext.Provider` can hand
it to the mounted game, and defines `handleBack` as
`if (interceptorRef.current?.()) return; navigation.goBack();`
[@game-player-screen]. That same `interceptorRef.current` is also called from
a `BackHandler.addEventListener('hardwareBackPress', ...)` listener set up in
a `useEffect`, returning `true` or `false` straight from the interceptor's own
result [@game-player-screen]. In other words, the on-screen back button (via
`handleBack`, wired to `GameShell`'s `AppBar` or the bare-mode floating
`BackButton`) and Android's physical back key are two different entry points
into the exact same interceptor check — a game that registers a handler with
`useScreenBack` does not need to reason about which of the two the player
used.

This matters most for games that keep more than one internal screen alive at
once — the pattern shows up in `simple-pairs`, `turbo-road`, and
`color-mixer`, among others, wherever a game needs "back" to mean "go up one
level inside the game" before it means "leave the game." Any game without
that structure can simply never call `useScreenBack`, in which case the
interceptor ref stays `null` and both back paths fall straight through to
`navigation.goBack()`.

## How this fits with the rest of `GamePlayerScreen`

The [App entry and navigation](../architecture/app-entry-and-navigation) page
covers how `GamePlayerScreen` resolves `route.params.gameId` through the
[Game registry](../architecture/game-registry) and falls back to a
not-found view when the id doesn't resolve; this page picks up from there,
once a real `GameConfig` is in hand, to explain the two decisions
`GamePlayerScreen` still has to make about it — which layout mode to render
and which back interceptor to honor.
