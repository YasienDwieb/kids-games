---
title: "Trace It: the Tracing Engine"
summary: "Trace It teaches finger-traced writing for Latin letters, Arabic letters, digits, and pre-writing warm-up strokes. Every shape is authored once as a glyph — a list of strokes in 0..100 box units — then resampled to even arc-length spacing and fed to a pure finger-tracking state machine shared by every script. The same box-unit coordinate space is what lets Arabic glyphs be authored physically right-to-left without fighting React Native's RTL mirroring, and what makes the picker, the flow adapter, and the shared Egyptian school-order letter list (also used by Letter Land) line up across scripts."
topics: [architecture, games, rtl]
sources:
  - id: types
    type: file
    path: src/games/trace-it/types.ts
  - id: constants
    type: file
    path: src/games/trace-it/constants.ts
  - id: build
    type: file
    path: src/games/trace-it/glyphs/build.ts
  - id: arabic-glyphs
    type: file
    path: src/games/trace-it/glyphs/arabic.ts
  - id: latin-glyphs
    type: file
    path: src/games/trace-it/glyphs/latin.ts
  - id: warmup-glyphs
    type: file
    path: src/games/trace-it/glyphs/warmup.ts
  - id: glyphs-index
    type: file
    path: src/games/trace-it/glyphs/index.ts
  - id: resample
    type: file
    path: src/games/trace-it/utils/resample.ts
  - id: segments
    type: file
    path: src/games/trace-it/utils/segments.ts
  - id: tracker
    type: file
    path: src/games/trace-it/utils/tracker.ts
  - id: tracker-test
    type: file
    path: src/games/trace-it/__tests__/tracker.test.ts
  - id: trace-board
    type: file
    path: src/games/trace-it/components/TraceBoard.tsx
  - id: track-layer
    type: file
    path: src/games/trace-it/components/TrackLayer.tsx
  - id: round
    type: file
    path: src/games/trace-it/components/Round.tsx
  - id: picker
    type: file
    path: src/games/trace-it/components/Picker.tsx
  - id: travellers
    type: file
    path: src/games/trace-it/components/Travellers.tsx
  - id: flow-adapter
    type: file
    path: src/games/trace-it/flow.tsx
  - id: progress
    type: file
    path: src/games/trace-it/progress.ts
  - id: catalog
    type: file
    path: src/games/trace-it/catalog.ts
  - id: catalog-test
    type: file
    path: src/games/trace-it/__tests__/catalog.test.ts
  - id: glyphs-test
    type: file
    path: src/games/trace-it/__tests__/glyphs.test.ts
  - id: shared-letters
    type: file
    path: src/games/_shared/letters/index.ts
  - id: config
    type: file
    path: src/games/trace-it/config.ts
---

Trace It (`src/games/trace-it/`, registered id `trace-it`) is the finger-tracing
[game module](../concepts/game-module): warm-up pre-writing strokes, Latin and
Arabic letters, and digits, each traced guided-then-solo on a touch board
[@config]. Its hardest problem is not drawing a letter — it is treating four
very different shape families (an Arabic letter's connected curves, a Latin
letter's straight segments and arcs, a digit, a wavy warm-up line) as the same
input to one tracking state machine, while also treating two scripts that are
read in opposite directions as the same input to one picker, one flow adapter,
and one progress store. The rest of this page is about the one representation
— the **glyph** — that makes that possible.

## The glyph model: one shape, box units, physical coordinates

A `Glyph` is `{ id, strokes }`, where each `Stroke` is either `{ kind: 'path',
points }` or `{ kind: 'dot', at }` [@types]. Every coordinate in every glyph
lives in **box units**, a fixed 0..100 square regardless of the Arabic or
Latin letter, digit, or warm-up it draws, regardless of RTL — the box is
resized to actual pixels only once, in `boardMetrics`/`toBox` when the board
renders and when touches are converted back into box space [@segments].
`glyphs/build.ts` is the small authoring DSL every glyph set is built from:
`line`, `arc`, `curve` (a cubic Bézier sampled into 25 points), and `join`
(concatenates stroke pieces, dropping duplicate seam points) [@build]. `dot()`
marks a stroke that is satisfied by a tap rather than a drag — the diacritic
dots on Arabic letters and the dot above a Latin lowercase `i` or `j` are the
only consumers.

Four files each export a `readonly Glyph[]` for one set — `digits.ts`,
`warmup.ts`, `latin.ts` (`LATIN_UPPER`/`LATIN_LOWER`), `arabic.ts`
(`ARABIC_GLYPHS`) — and `glyphs/index.ts` just re-exports them keyed by name as
`ALL_SETS`, the map the dev-only glyph-sheet test renders from
[@glyphs-index]. `glyphs.test.ts` is the one place that checks structural
invariants across all four sets at once: every glyph has at least one path
stroke, and every point of every stroke is enforced to be inside (or very
close to) the 0..100 box [@glyphs-test].

### Arabic letters are authored physically, not mirrored

`arabic.ts` opens with the convention the whole file follows: shapes are
"Isolated Naskh for children (Egyptian Ministry KG1 book)," baseline at `y:
65`, and "the body starts at its right/top point and runs right to left; dots
come last" [@arabic-glyphs]. Nothing about that convention is generic RTL
support — it is each letter's actual stroke order as taught in the Egyptian
KG1 curriculum, encoded directly as box-unit coordinates that already run
right to left on the page, the same way `latin.ts`'s letters already run left
to right. This is also why `TraceBoard`'s root `View` forces `direction:
'ltr'` with the comment "Box coordinates are physical: Arabic glyphs are
authored right-to-left already" [@trace-board] — if the board instead let
React Native's native RTL layout mirror the view (the way most of this app's
own screens do, per [i18n and RTL](./i18n-and-rtl)), an Arabic glyph authored
right-to-left would get flipped a second time and end up reading left to
right again. Letter and digit shapes are *data*, not layout, and are
deliberately exempted from the layout-mirroring rule that governs everything
else in the app.

Warm-up strokes are the one family authored in a single, fixed left-to-right
direction and mirrored on demand instead: `warmupFor(id, rtl)` calls
`mirrorX(glyph)` — which negates every `x` coordinate as `100 - x` — only when
the active script is Arabic [@warmup-glyphs] [@build]. Pre-writing scribbles
(a zigzag, a wave, a spiral) have no real RTL convention to encode, so
mirroring the one authored version is simpler than authoring two.

### Dot order encodes pedagogy, not just position

Multi-dot Arabic letters list their dots in the order a child is taught to
place them, which is right to left for horizontally arranged dots. A fix
(commit `056d1e0`) swapped the dot order of `taa`/`thaa`/`qaf`/`kaf` from
left-then-right to right-then-left to match that teaching order
[@arabic-glyphs]. But a child's actual finger does not always land on dots in
the "correct" order, so the tracker does not enforce it as a hard sequence:
`withDotAt(glyph, state, point)` checks whether a touch-down lands on a
*later* dot in the current glyph and, if so, swaps that dot into the current
slot before tracking continues [@tracker]. `tracker.test.ts`'s `withDotAt`
suite pins the resulting rules precisely: a later dot can be tapped out of
order and is swapped in; hitting the already-current dot or missing
everything leaves the glyph's stroke order untouched (`toBe`, not `toEqual`,
so no unnecessary swap even fires); and a dot is never pulled forward while
the current stroke is a path, since `withDotAt` only ever looks at
`g.strokes[s.stroke]` when that slot is itself a dot [@tracker-test]. The
practical effect: the glyph's authored dot order is what the letter *says* out
loud and draws in the "guided" ghost-dot ordering, but the tracker still
accepts whichever dot the child reaches first.

One more Arabic-specific simplification lives in the same file: `yaa` (ي) is
taught with no dots at all, "as children write it at the end of a word" —
i.e. the dotless final/isolated form a beginner actually encounters first,
rather than the two-dot medial form [@arabic-glyphs]. `t` (commit `6d466b5`)
got a matching content fix on the Latin side: its stick now curls into a small
hook before the cross bar is drawn, instead of two disconnected straight
strokes, to read as one continuous pen motion [@latin-glyphs].

## Resampling and the stroke tracker

A glyph's authored points are not evenly spaced — `curve()` samples a Bézier
at a fixed parameter step, which bunches points on tight turns and spreads
them on straight runs. `resample(points, spacing = 2)` walks a polyline's arc
length and re-emits points at even `spacing`-unit intervals, keeping the first
and last point exactly [@resample]. `prepareGlyph(glyph)` applies this to
every path stroke (dots are left alone) and is called once per `TraceBoard`
session via `useMemo`, not on every render [@resample] [@trace-board]. Even
spacing matters because the tracker's "how far along the stroke is the
finger" state (`progress`) is just an index into this resampled point array —
uneven spacing would make the same index mean a very different physical
distance on different parts of the same letter.

`utils/tracker.ts` is a pure state machine with no React and no I/O: `down`,
`move`, `up` each take a `Glyph`, the current `TraceState`, and a point, and
return a `Step` (`{ state, event }`) [@tracker]. This purity is what makes
`tracker.test.ts` exercise the whole touch contract — grabs, misses, lifting
and resuming, multi-stroke glyphs, dot order — without ever mounting a
component [@tracker-test]. The rules worth knowing:

- **Grabbing** only succeeds on `down` if the touch lands within `TOLERANCE`
  (11 box units) of the stroke's current point; a `down` anywhere else is
  silently ignored for a path stroke, but is a `miss` for a dot stroke
  [@tracker] [@constants].
- **Moving** advances `progress` by searching up to `LOOKAHEAD` (12) points
  ahead of the current index for the closest in-tolerance point, so a finger
  sliding smoothly along the curve keeps up without the state jumping ahead
  of where the finger actually is [@tracker] [@constants]. The search
  sub-steps every move event in `SUB_STEP`-unit (2 box units) increments
  between the last and new point, so a fast swipe across a tight curve still
  gets checked against every intermediate point instead of only the move
  event's final position [@tracker].
- **Finishing** a stroke happens either by reaching `COMPLETE_AT` (90%) of the
  stroke's length while dragging, or by a `down` that lands on a dot; both
  paths call the same `finishStroke`, which advances to the next stroke or
  marks the whole glyph `done` [@tracker] [@constants].
- **Lifting early** (`up` while `grabbed` but never having advanced this drag)
  is a `miss`; lifting after advancing at all is not — the tracker only
  penalizes a touch that grabbed the stroke and then let go without any
  progress, not a to-be-expected pause mid-stroke [@tracker] [@tracker-test].

`TraceBoard` wraps this machine in one `session` object held in a `ref`-like
`useMemo`, re-rendering only when a drawn-visible field (`progress`,
`stroke`, `grabbed`, `done`) actually changes, specifically so a fast drag
does not force a re-render on every raw gesture callback [@trace-board]. Dots
get reordered on the *session's* glyph (`session.glyph = withDotAt(...)`), not
the shared static glyph object, so reordering one child's in-progress attempt
never mutates the authored data other sessions read [@trace-board].

## Catalog: one list per track, both scripts always offered

`charsFor(track, script)` is the single place that turns a `Track`
(`'warmup' | 'letters' | 'numbers'`) and a `Script` (`'latin' | 'arabic'`)
into the ordered `TraceChar[]` the picker and the round both walk
[@catalog]. Letters come from `_shared/letters` — the same `LATIN_LETTERS`,
`ARABIC_LETTERS`, and `SCHOOL_ORDER` module Letter Land's listen-and-find
rounds use, introduced by the `90ee2a2` refactor specifically so the two games
can't drift on letter order, example words, or emoji [@shared-letters]. Latin
letters carry both an uppercase and a lowercase glyph per character (two
`RoundStep`s per pass); Arabic and digit characters carry one
[@catalog]. `SCHOOL_ORDER` is the Egyptian teaching order (`T, I, S, A, N, P,
H, D, R, E, C, K, M` for Latin; `alef, baa, meem, haa, jeem, dal, khaa, taa,
lam, seen, noon` for Arabic) — `schoolOrdered()` puts those ids first, then
appends the rest of the alphabet in plain inventory order, so both the picker
rail and the flow's "next letter" logic present the taught subset before the
untaught remainder [@shared-letters].

`currentScript()` reads `currentLanguage()`, not `I18nManager.isRTL`
[@catalog]. This repeats the same boot-ordering rule
[i18n and RTL](./i18n-and-rtl) establishes for fonts and the initial
language: the native RTL flag can lag an in-session language switch, so any
code that needs to know "which script is the app in right now" has to read
the i18n language, never the native flag, to stay in sync at the exact moment
the switch happens rather than one render later (fixed by commit `c4017ce`,
after three separate call sites — `index.tsx`, `flow.tsx`, and the catalog
itself — had each read `I18nManager.isRTL` directly) [@catalog-test]. Despite
that, both scripts' letter tabs are always offered side by side, with the app
language's script tab first: `tabsFor(script)` returns `['warmup', script,
otherScript, 'numbers']`, reflecting that "a KG child studies Arabic and
English side by side" regardless of which language the rest of the UI is
in [@catalog]. A letter's own `script` field (not the app's current script)
decides what language it is spoken in — `charLanguage()` falls back to
`currentLanguage()` only for warm-ups and digits, which have no script of
their own [@catalog].

## Round, progress, and the guided flow

`roundSteps(char, mode)` expands a character into guided steps (one per
glyph) and, unless `mode === 'guidedOnly'` or the track is `'warmup'`, a
matching solo pass after them [@catalog]. `Round` walks that step list on one
`TraceBoard`, speaking the character once per `char.id` (not on every
translation-context change) and tracking stars per step, reducing them with
`charStars` — the *minimum* across steps, so one sloppy stroke caps the whole
character's reward even if every other stroke was clean [@progress]
[@round]. Stars
persist through `progressStore`, a `createStore('trace-it', { done: {} })`
keyed by character id, and `recordStars` only ever raises a stored value,
never lowers it [@progress]. `blockComplete(track, script, done)` compares
`done` against `SCHOOL_ORDER[script]` for the `'letters'` track (so a learner
"completes" the letters block once the *taught* subset has stars, not the
full alphabet) but against the whole set for `'warmup'`/`'numbers'`
[@catalog]; `Round.finish` uses this before/after comparison to decide between
a small or big [celebration](./celebration-and-hints) burst.

The guided-flow adapter (`flow.tsx`) mounts three units on `FlowRound`: a
warm-up chosen by the flow's seed, then two letters picked by
`flowLetter(chars, done, nth)` [@flow-adapter] [@catalog]. `flowLetter` finds
the first id with no stars yet, falling back to `chars[nth]` once every
letter has some; because each unit records its own stars (`Round`'s `finish`
path for `inFlow`) *before* the next unit mounts and re-reads
`progressStore`, the two letter units are guaranteed to be two different,
consecutive untraced letters rather than the same "next untraced" letter
twice (commit `c0c2897` fixed exactly this duplicate-pick bug) [@catalog-test]
[@flow-adapter]. See [Flow](../concepts/flow) for how `registerFlowAdapter`
and `useFlowRound` fit into the cross-game guided-session engine this adapter
plugs into.

## Rendering: dimming later strokes without seams on Android

`TrackLayer` draws the outlined "road" every stroke runs along. In guided
mode it splits a glyph's path strokes into `lit` (the current stroke and
earlier ones) and `later` (strokes not yet reached), rendering `later` inside
its own `View` at `opacity: 0.4` so the child can see the whole letter's shape
without the untraced part looking equally "ready" [@track-layer]. Fading a
group of *overlapping* native views this way hit a real Android bug: each
bar and disc making up the faded road was fading independently, so the seams
between them stayed visible as the opacities layered instead of the group
reading as one uniformly faded shape. The fix sets
`needsOffscreenAlphaCompositing` and `renderToHardwareTextureAndroid` on the
`later` wrapper (and on the solo-mode wrapper, which has the same problem at
`opacity: 0.35`), which forces Android to flatten the group to one texture
before applying the opacity, instead of alpha-blending each child
independently [@track-layer]. This is a general React Native gotcha, not
specific to glyph rendering: **any time several overlapping native views are
faded together as a group on Android, they need
`needsOffscreenAlphaCompositing`/`renderToHardwareTextureAndroid` on the
wrapping view, or the group's seams show through.**

## The picker rail reuses Home's physical-RTL scroll trick

`Picker`'s horizontal tile rail brings the next-untraced tile into view on
mount (or, if everything is already starred, snaps to the far edge) using the
same idiom [App entry and navigation](./app-entry-and-navigation) documents
for the Home screen's games rail: a horizontal `ScrollView` always starts
scrolled to `x: 0` regardless of layout direction, so under native RTL
`x: 0` is still the rail's *visual* left/far end, and `Picker`'s `Rail`
component measures tile and content width in these same physical pixels
before calling `scrollTo` [@picker]. Trace It's version generalizes the
pattern one step further than Home's — it scrolls to a specific tile's
measured offset when one exists, and only falls back to `I18nManager.isRTL ?
max : 0` when there is no "next" tile to center on.

## Warm-up travellers: the pre-writing story

Warm-ups have no letter or digit meaning — they are motor-skill lines (a
zigzag, a wave, a spiral) — so instead of a spoken name, each one tells a tiny
story: a `from` emoji waits off one end of the road and a `to` emoji waits off
the other; once the stroke finishes, `from` animates along the resampled road
to `to` [@travellers]. `spotFor` searches outward from the road's end at
`REACH` box units, trying angles alternately clockwise and counter-clockwise
from the road's own exit direction, until it finds a spot that stays on the
board, clear of the whole road, and clear of the other emoji's spot — falling
back to the bare end point only if nothing clears [@travellers]. `faces`
on a `Warmup` (only `circle`'s 🐦 needs it) records which way the emoji's art
already looks, so `Travellers` can decide whether to flip it to face the goal
rather than assuming every emoji faces right by default [@warmup-glyphs]
[@travellers].
