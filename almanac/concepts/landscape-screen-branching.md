---
title: "Concept: Landscape Screen Branching"
summary: "Across many game screens, a component reads `useWindowDimensions()`, computes `landscape = width > height`, and renders a distinct landscape JSX tree and stylesheet instead of one fluid layout. The app-level orientation lock does not make this redundant: it only guarantees landscape on native, and most of these screens were authored portrait-first, one at a time, before or independent of that lock."
topics: [concepts, design-system]
sources:
  - id: turbo-road-start
    type: file
    path: src/games/turbo-road/components/StartScreen.tsx
  - id: turbo-road-garage
    type: file
    path: src/games/turbo-road/components/GarageScreen.tsx
  - id: turbo-road-win
    type: file
    path: src/games/turbo-road/components/WinOverlay.tsx
  - id: turbo-road-pause
    type: file
    path: src/games/turbo-road/components/PauseOverlay.tsx
  - id: turbo-road-playfield
    type: file
    path: src/games/turbo-road/components/Playfield.tsx
  - id: turbo-road-constants
    type: file
    path: src/games/turbo-road/constants.ts
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
  - id: difficulty-select
    type: file
    path: src/games/simple-pairs/components/DifficultySelect.tsx
  - id: how-many
    type: file
    path: src/games/count-and-pop/components/HowMany.tsx
  - id: pattern-puzzle
    type: file
    path: src/games/shape-detective/components/PatternPuzzle.tsx
  - id: back-button
    type: file
    path: src/components/common/BackButton.tsx
  - id: dimensions-ts
    type: file
    path: src/constants/dimensions.ts
---

A recurring layout technique shows up across this codebase's screens: rather
than writing one flexible layout that reflows at any aspect ratio, a component
calls `useWindowDimensions()`, computes `const landscape = width > height`,
and renders either a second, purpose-built JSX tree for landscape or the same
tree with a parallel set of `landscape && styles.xLandscape` style overrides.
`HomeScreen` is the earliest example already covered in
[App entry and navigation](../architecture/app-entry-and-navigation)
[@home-screen]; `turbo-road`'s `StartScreen`, `GarageScreen`, `WinOverlay`, and
`PauseOverlay` are the newest, all rewritten in one pass to add landscape trees
after having none [@turbo-road-start] [@turbo-road-garage] [@turbo-road-win]
[@turbo-road-pause]. `simple-pairs`'s `DifficultySelect`, `count-and-pop`'s
`HowMany`, and `shape-detective`'s `PatternPuzzle` use the identical
`width > height` idiom [@difficulty-select] [@how-many] [@pattern-puzzle]. A
future agent adding or fixing a game screen should recognize this as an
established pattern, not a one-off, and know the two gotchas below that have
already bitten it twice.

## Why the app-level orientation lock doesn't make this redundant

[Landscape orientation lock](../decisions/landscape-orientation-lock) fixes
the *device's* orientation on native platforms, but it does not fix a given
screen's *own* layout for that shape — two gaps keep per-screen branching
necessary. First, the runtime lock is explicitly skipped on web, so a web
build gets whatever aspect ratio the browser window happens to be; a screen
with only a landscape-shaped tree and no portrait fallback breaks there.
Second, most game screens in this repo were written before, or independently
of, the app going landscape-only, so their only layout was ever a portrait
one; each screen has to be revisited individually to grow a landscape branch,
which is exactly what the `turbo-road` range that introduced `StartScreen`'s
and `GarageScreen`'s `landscape` branches did — the portrait branch was left
in place, untouched, as the fallback for web and as the pre-existing behavior
[@turbo-road-start] [@turbo-road-garage]. On native, once a screen does have a
landscape branch, that branch is what players actually see, since the lock
guarantees `width > height` there; the portrait branch becomes effectively
dead code on native, kept alive only for the web target.

## Two gotchas already found twice

**A portrait-authored full-screen overlay can clip itself on a short
landscape screen.** A scrim that centers its card with `justifyContent` and
does not scroll will silently cut off the top or bottom of a card that is
taller than the available height — there is no error, the content is just
gone. `WinOverlay` and `PauseOverlay` were both rewritten with landscape
variants for this reason: `WinOverlay` splits its result (trophy, title, cup
banner, stars) and its actions (coins pill, buttons) into two side-by-side
columns instead of one stacked column, and shrinks the trophy, title, and star
sizes in that branch; `PauseOverlay` shrinks its glyph and padding and lays
its two buttons side by side instead of stacked [@turbo-road-win]
[@turbo-road-pause]. Any new full-screen overlay in this repo needs the same
check on a short landscape viewport before it ships.

**Bare-mode landscape headers must clear the floating `BackButton`'s exact
footprint.** `BackButton` is absolutely positioned at `start: startInset +
SPACING.md` and is a `TOUCH_TARGET.recommended` (64) square [@back-button]
[@dimensions-ts]. A bare-mode game's own header content — a title, a chip row
— has to start no earlier than `SPACING.md + TOUCH_TARGET.recommended +
SPACING.sm` (16 + 64 + 8 = 88px) past the safe-area edge, or it visually
overlaps the chevron. `turbo-road`'s two screens arrive at that same 88px
budget by two different routes, and neither constant lives in
`constants.ts`. `GarageScreen` names it explicitly with its own module
constants, `BACK_CLEARANCE = TOUCH_TARGET.recommended + SPACING.sm` and
`BACK_PADDING = SPACING.md + BACK_CLEARANCE`, applied as `paddingStart` on
its landscape header [@turbo-road-garage]. `StartScreen` does not define
either constant; its `landscapeHeader` style applies the shorter
`TOUCH_TARGET.recommended + SPACING.sm` (72px) inline, and gets the
remaining 16px from `landscapeRoot`'s own `paddingHorizontal: SPACING.md`,
which already wraps the whole two-pane layout [@turbo-road-start]. Both
landscape headers overlapped the button on first pass before this
arithmetic was added. Any new bare-mode landscape header needs the same
88px budget past the safe-area edge, whether it names the constant like
`GarageScreen` or composes it from a root padding like `StartScreen` — a
guessed value is what broke both the first time.

## Two branching styles, plus a non-branching outlier

Two shapes of `landscape` branch appear in practice. `StartScreen` and
`GarageScreen` return an entirely separate component tree when `landscape` is
true — a two-pane `flexDirection: 'row'` layout (map/collection pane beside a
car/CTA pane) that shares no JSX with the portrait `ScrollView` tree below it
[@turbo-road-start] [@turbo-road-garage]. `WinOverlay`, `PauseOverlay`,
`DifficultySelect`, `HowMany`, and `PatternPuzzle` instead keep one tree and
layer `landscape && styles.xLandscape` onto individual style arrays
[@turbo-road-win] [@turbo-road-pause] [@difficulty-select] [@how-many]
[@pattern-puzzle]. Neither style is "more correct" — the two-pane rewrite
fits a screen whose landscape shape needs a genuinely different composition
(side-by-side panes instead of a vertical scroll), while the style-overlay
approach fits a screen whose landscape shape is the same composition at
different proportions.

`Playfield` is not a third variant of the same `landscape` idiom — it does
not branch on orientation at all. It never calls `useWindowDimensions()` and
never computes a `landscape` boolean; every occurrence of the word
"landscape" in the file is a comment, not a runtime check
[@turbo-road-playfield]. Instead, `Playfield` measures its own container via
`onLayout` into a `size` of `{ w, h }` and derives every dimension —
sky-band height, road width, lane width, and sprite scale — continuously
from that measured size, so the same code adapts to any aspect ratio rather
than forking at a `width > height` threshold [@turbo-road-playfield]. The
sprite scale specifically cannot live as a static `StyleSheet.create()`
entry: `Playfield` keeps sprite dimensions (`PLAYER_BOX`, `RIVAL_BOX`,
`ENTITY_BOX`, `BOOST_PAD`, ...) as plain module constants, multiplies each by
a runtime `sprite` factor derived from lane width, and applies the result as
inline `width`/`height`/`fontSize` at render time; the matching
`StyleSheet` entries for those elements deliberately carry no fixed
dimensions at all [@turbo-road-playfield]. In `turbo-road` specifically, the
lane width itself is capped by `ROAD_HEIGHT_CAP_RATIO` (a cap expressed
against playfield height, so it only binds when the playfield is wide
relative to its height — in practice, landscape — where a pure width-based
ratio would make the road absurdly wide) and the sprite scale is derived
from that same lane width via `SPRITE_BASE_LANE` and `SPRITE_MAX_SCALE`, so
road width and sprite size scale together [@turbo-road-constants]
[@turbo-road-playfield]. That coupling is what keeps the lane-unit collision
math in `turbo-road`'s engine feeling the same at any sprite scale — see
[Motion and the game loop](../architecture/motion-and-game-loop) for why that
engine's collision constants live untouched in JS-thread world state rather
than reanimated shared values. Anyone touching `turbo-road` lane geometry has
to preserve the road-width/sprite-scale coupling, not just one side of it.
`Playfield`'s dimension-derived approach only works because it already owns
its full-bleed rectangle without competing layout siblings; a screen with a
header, chips, and CTAs to arrange still needs an explicit `landscape`
branch to decide *composition*, not just scale.
