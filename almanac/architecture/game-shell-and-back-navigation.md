---
title: "Game Shell and Back Navigation Architecture"
summary: "GameShell supplies a floating back button, HUD (score/pause), and overlay chrome that shell-mode games render inside, while ScreenBackContext lets any game — shell or bare — intercept both on-screen and Android hardware back presses before GamePlayerScreen navigates away. Shell and bare modes now share the same floating-chrome look; GameShell no longer renders a title or an AppBar."
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
  - id: back-button
    type: file
    path: src/components/common/BackButton.tsx
  - id: hud-pill
    type: file
    path: src/components/common/HudPill.tsx
  - id: match-up-index
    type: file
    path: src/games/match-up/index.tsx
  - id: listen-find-board
    type: file
    path: src/games/_shared/listen-find/ListenFindBoard.tsx
---

Every game plugged into `GamePlayerScreen` needs two things it should not
have to reimplement itself: a consistent floating chrome (back button, score,
pause), and a way to tell the back button "not yet" when the game has its own
internal navigation. `GameShell` provides the first as an opt-out layout
wrapper, and `ScreenBackContext` provides the second as a small interception
protocol that both the on-screen back button and Android's hardware back key
funnel through. Both live under `src/sdk/layout/` and are wired together by
`GamePlayerScreen`, which decides per game whether to mount the shell at all
and which back handler ultimately wins.

## `GameShell`: floating chrome, not a header bar

`GameShell` used to render an `AppBar` — a full-width tinted strip holding a
centered game title, a back chevron, and a bare score number — above the
game's content. That made the shell-mode games (`animal-safari`,
`shape-detective`, `count-and-pop`, `letter-land`, `numbers-land`) look like a
different app from the bare-mode games, which floated a back button top-start
and a rounded `HudPill` top-end directly over the playfield with no reserved
header row. `GameShell` was rewritten to match the bare look instead of the
other way around: it renders a `SafeContainer` with padding reset to zero, the
game's `children` filling the whole canvas, a floating `BackButton` top-start
when `showBack && onBack`, and a floating HUD cluster top-end holding any
custom `header` node, a `HudPill` score readout, and a `HudPill`-wrapped pause
button — each only rendered when its prop is actually supplied [@game-shell].
`HudPill` itself is just a small shared surface component — a rounded,
shadowed pill that lays out whatever children it's given — used identically
by `GameShell`'s own HUD and by any bare-mode game that builds its own
floating readout, such as `match-up` below [@hud-pill].
The game title is gone entirely, on purpose: the child already tapped a named
tile on Home to get here, so repeating the name in a header is chrome that
costs a whole row of playfield and tells the player nothing new. `GameConfig`
and `GameShellProps` no longer have a `title` field at all — see the
[Game config schema](../reference/game-config-schema) reference for the
current field list.

Because the chrome floats over the playfield instead of reserving a header
row, a game's own top-corner content can end up visually underneath it. The
shared `_shared/listen-find/ListenFindBoard` — the board behind
`letter-land`, `numbers-land`, and `animal-safari` — has a large tappable hero
picture near the top of its layout; after the `AppBar` row was removed, that
picture's corner sat under the floating back button, so a child aiming for
the picture could tap the button and leave the game instead [@listen-find-board].
The fix was extra top padding on the board itself (`paddingTop: SPACING.xxl +
SPACING.md`), not a change to `GameShell` — the shell only reserves space for
its own floating elements, never for the game's content, so any game with
interactive elements near a top corner has to leave room for the floating
back button and HUD itself [@listen-find-board].

A `GameOverlay` modal still layers on top of everything, driven by one
`overlays` state object keyed by slot, with `GameShell` picking at most one
slot to actually show in a fixed priority order: `['error', 'pause', 'win',
'loading']` — an error interrupts a pause screen, a pause interrupts a win
screen, and so on [@game-shell]. A game reaches this state through
`useGameShell()`, which returns `{ setScore, showOverlay, hideOverlay }` from
`GameShellContext` [@game-shell-context]. This remains a small surface: a
game can set its score display and show or hide exactly one of four named
overlay kinds, but the shell — not the game — owns the floating layout and
the modal mechanics around them.

### Positioning the floating HUD under safe-area insets

Because `SafeContainer`'s padding is reset to zero so the playfield can run
edge to edge, the absolutely-positioned HUD cluster no longer inherits any
safe-area inset from its parent — `GameShell` has to add it back manually,
the same way `BackButton` already did: `top: insets.top + SPACING.xs, end:
(I18nManager.isRTL ? insets.left : insets.right) + SPACING.md` [@game-shell].
Skipping this is a real, recurring bug shape in this codebase, not a
theoretical one — `match-up` (a bare-mode game that renders its own local
`HudPill` rather than going through `GameShell`, since it never mounts the
shell at all) shipped with a plain `top: SPACING.sm` on its score pill and it
rendered half-hidden under the Android status bar; the fix was the identical
pattern, computing `top`/`end` from `useSafeAreaInsets()` at render and
passing them as an inline style override rather than a static `StyleSheet`
value [@match-up-index]. Any new floating overlay element — in `GameShell` or
in a bare-mode game that rolls its own HUD — needs this same treatment:
static `StyleSheet` offsets are wrong the moment the parent's own padding
stops carrying the safe-area inset for it.

### Convention: hide the score HUD outside `'playing'`

Every game that reports a score to `GameShell.setScore` (or, for bare-mode
games, to a local `HudPill`) follows the same rule: pass the real score while
`status === 'playing'`, and pass `null` otherwise — `shell.setScore(status ===
'playing' ? score : null)` appears verbatim in `count-and-pop`,
`shape-detective`, and the shared `useListenFind` hook that backs
`letter-land`, `numbers-land`, and `animal-safari` [@game-shell]. `GameShell`
only renders the `HudPill` when `score != null`, so passing `null` on the
loading and resume screens removes the pill entirely rather than showing a
stale or zeroed number the child has no use for while the resume prompt is
still on screen.

## Layout modes: `shell` versus `bare`

Not every game wants even this floating chrome. `GameConfig.layout` is
optional and its `mode` field is either `'shell'` (the default) or `'bare'`
[@layout-types]. `GamePlayerScreen` reads this field to decide what to render
around the game's root component: in `'bare'` mode the game gets a plain
`View` sized to the screen with only a floating `BackButton` on top, and owns
its own safe-area handling, canvas, and any score/pause HUD it wants to show;
in the default `'shell'` mode, `GamePlayerScreen` wraps the game in
`GameShell`, passing through `game.backgroundColor` and `layout.showBack ??
true` [@game-player-screen]. This choice is made once, per game, in that
game's `config.ts` — a game with a full-bleed canvas (for example a driving
or drawing surface) picks `'bare'` to avoid fighting the shell's own padding,
while a game with a conventional scored-rounds structure takes the default
`'shell'` chrome for free. Since both modes now render the identical
floating-chrome look, the practical difference between them is narrower than
it used to be: `'bare'` means the game owns and lays out its own HUD content
(as `match-up` does), while `'shell'` means `GameShell` owns that HUD and the
game only calls `useGameShell()` to feed it a score or a header node.

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
`handleBack`, wired to the floating `BackButton` — rendered by `GameShell` in
shell mode or directly by `GamePlayerScreen` in bare mode, either way the same
component [@back-button]) and Android's physical back key are two different
entry points into the exact same interceptor check — a game that registers a
handler with `useScreenBack` does not need to reason about which of the two
the player used.

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
