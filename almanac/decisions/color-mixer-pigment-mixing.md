---
title: "Decision: Mix Paint, Not Light, in Color Mixer"
summary: "Color Mixer's continuous 50% sRGB average per drop (how light mixes) and its flat Euclidean-RGB match threshold were replaced by an authored Bezier-triangle pigment wheel over an ordered drop log, matched with CIEDE2000; the change also forced a saved-color schema migration and an explicit, graded challenge-completion flow."
topics: [decisions, games]
sources:
  - id: wheel-mix
    type: file
    path: src/games/color-mixer/utils/wheelMix.ts
  - id: delta-e
    type: file
    path: src/games/color-mixer/utils/deltaE.ts
  - id: match-utils
    type: file
    path: src/games/color-mixer/utils/match.ts
  - id: constants
    type: file
    path: src/games/color-mixer/constants.ts
  - id: use-color-mixer
    type: file
    path: src/games/color-mixer/hooks/useColorMixer.ts
  - id: index
    type: file
    path: src/games/color-mixer/index.tsx
  - id: challenge-success
    type: file
    path: src/games/color-mixer/components/ChallengeSuccess.tsx
  - id: types
    type: file
    path: src/games/color-mixer/types.ts
  - id: color-mixer-readme
    type: file
    path: src/games/color-mixer/README.md
  - id: wheel-mix-test
    type: file
    path: src/games/color-mixer/utils/__tests__/wheelMix.test.ts
  - id: delta-e-test
    type: file
    path: src/games/color-mixer/utils/__tests__/deltaE.test.ts
  - id: match-test
    type: file
    path: src/games/color-mixer/utils/__tests__/match.test.ts
  - id: migrate-saved-test
    type: file
    path: src/games/color-mixer/hooks/__tests__/migrateSaved.test.ts
---

[Color Mixer](../reference/games-catalog) is a drag-and-drop [game
module](../concepts/game-module) where a child drops paint primaries into a
pot to discover named "famous" colors and complete color-matching challenges.
Its original mixing and matching math modeled light, not paint, and that
mismatch was visible enough in the actual rendered colors that it was
replaced wholesale with an authored color-wheel engine and a perceptual
distance metric. The change reaches further than the math: it forced a
persisted-data migration for already-saved colors and changed when and how a
challenge can be marked complete.

## Context

The original engine blended each drop into the running mix with a 50% sRGB
average (`addColorToMix(current, new, 0.5)`), and treated a color as
"matched" when it fell within a flat Euclidean-RGB distance of 60
(`MATCH_THRESHOLD`) of a target hex [@color-mixer-readme]. Averaging channels
is how two beams of *light* combine, not how two blobs of *paint* mix, and the
palette showed it: blue mixed with yellow produced a roughly
20%-saturation sage gray instead of green, and all three primaries together
produced a blue-gray that the game had nonetheless labelled "Brown"
[@color-mixer-readme] [@wheel-mix]. The secondary colors' authored hexes had
been back-fitted to whatever the broken blend actually produced, so the
challenge for "Brown" could pass while showing a color no child would call
brown.

The matching rule compounded the problem. Euclidean RGB distance does not
track human color perception uniformly — it is generous in the blues and
stingy in the greens — and under the old palette the secondary for green
(`#8EB08D`) and the secondary for brown (`#AB8870`) sat only 57.3 RGB units
apart, inside the 60-unit match threshold. A mix that read as green to a
child could therefore silently satisfy the *brown* challenge [@constants]
[@color-mixer-readme].

## Decision

Mixing state became an ordered, capped **drop log** instead of a running hex.
`wheelMix.ts` stores drops as a `PigmentId[]` capped at `MIX_CAP` (16); past
the cap, `addDrop` is a no-op rather than silently diluting the pot further
[@wheel-mix]. The displayed color, `mixHex(log)`, is a pure function of the
log's *tally* (how many of each pigment), not of drop order — red, yellow,
then blue produces exactly the same brown as blue, yellow, then red
[@wheel-mix] [@wheel-mix-test].

Hue is computed from a quadratic Bezier triangle over the barycentric shares
of red, yellow, and blue. The triangle's three corners are the primary
swatches; its three edge control points are solved so that each authored
secondary (orange, green, purple) lands exactly on the midpoint of its edge —
the point where two primaries are mixed in equal parts — which is what makes
yellow+blue render as a real, saturated green rather than whatever a linear
blend happens to produce [@wheel-mix]. White and black are deliberately kept
off the wheel: they form a separate tint/shade axis that lerps the computed
hue toward the white or black swatch by its share of the pot, which matches
how white and black behave in real paint [@wheel-mix]. The three authored
secondaries were also re-hexed (orange `#F57C00`, green `#43A047`, purple
`#8E24AA`, brown `#916146`) so the closest pair in the palette is now about
100.3 RGB units / 17.2 ΔE00 apart — comfortably outside any of the new
thresholds below, closing the specific ambiguity that let green satisfy
brown [@constants].

Matching moved from Euclidean RGB to **CIEDE2000**, implemented in
`deltaE.ts` (`labFromHex` plus the full ΔE00 formula) and pinned explicitly
rather than left to whatever distance function happened to be convenient —
ΔE76 and ΔE00 differ by roughly 2x across this palette, so the choice of
metric alone decides whether a near-miss counts [@delta-e] [@delta-e-test].
`match.ts` exposes three ΔE00-based thresholds read from `constants.ts`:
`DISCOVERY_DELTA_E` (5) for free-play famous-color discovery,
`STAR_DELTA_E` (`{ three: 3, two: 6, one: 12 }`) for graded challenge
scoring, and `METER_RANGE_DELTA_E` (40) for the "getting warmer" progress
meter shown during a challenge [@match-utils] [@constants]. Challenge
completion requires `STARS_TO_COMPLETE` (2) stars, not any passing score —
one star is deliberately feedback rather than success, since ΔE00 12 is
still a plainly different color [@match-utils].

Because saved colors made before this change are a bare hex with no pigment
recipe, `useColorMixer.ts` bumped its persisted shape to `SCHEMA_VERSION = 2`
and runs `migrateSaved()` once on load: every pre-engine `SavedColor` gets a
best-fit drop set computed by `fitLog()` (a bounded multiset search over up
to 5 drops, run once at migration and never in a render path), stored as
`fit` and kept separate from the swatch's own `hex`/`name`, which never
change [@use-color-mixer] [@wheel-mix] [@types] [@migrate-saved-test]. A
saved record with a malformed hex is dropped during migration instead of
being parsed into black and silently poisoning every future mix it entered
[@use-color-mixer] [@migrate-saved-test].

Challenge completion also changed from an implicit, timer-driven event to an
explicit "Done" tap. `index.tsx` only shows a Done button once
`isChallengeMet` is true, and `ChallengeSuccess` — the celebration — is
always dismissible by tap, button, or a 2.6s timer held in a ref so that a
fresh `onDismiss` identity on re-render can neither restart nor cancel it
[@index] [@challenge-success]. An earlier version fired completion
automatically the moment a mix passed, which ejected a child at their first
passing star before they could refine the color further, and that version's
own dismiss timer lived in an effect that listed the flag it set as a
dependency — its cleanup cancelled its own timer, so the celebration could
get stuck on screen with no way out [@index] [@challenge-success]. Famous
color discovery is now also gated to free play only (`detectDiscoveries`
option on `useColorMixer`): during a challenge, a full-screen discovery modal
for some unrelated famous color would interrupt the one the child is
actively mixing toward [@use-color-mixer] [@index].

## Status

Current.

## Consequences

Adding a new discoverable color now has two simultaneous constraints instead
of one: its hex must be reachable from a short pot of primaries under the
pigment engine, *and* it must sit far enough (in ΔE00) from every other
famous color that no short pot satisfies two challenges at once. The
reachability-and-separation guard in `match.test.ts` checks both and should
be run (`npx jest`) before shipping a new entry in `COLORS`
[@match-test] [@color-mixer-readme].

The metric and its thresholds are paired, not independent: `DISCOVERY_DELTA_E`,
`STAR_DELTA_E`, and `METER_RANGE_DELTA_E` are only meaningful under CIEDE2000.
Porting one of these numbers to a different distance function — including the
cheap squared-Lab-error search `fitLog` uses internally, which is an
approximation good enough only for picking an argmin over a few hundred
candidates — would silently change what counts as a match [@delta-e]
[@wheel-mix].

Saved colors are now permanently split into two independent facts: the swatch
the child sees (`hex`, `name`), which never changes, and the recipe that
re-enters a mix (`mixLog` if the color was made under the current engine,
else `fit` computed once at migration). Any future change to the pigment math
must preserve old swatches exactly while only ever updating how a *recipe* is
interpreted. A full pot is a hard stop, not a soft dilution: `addDrop` past
`MIX_CAP` returns the log unchanged, so any UI that lets a child drop
something into the pot must handle the rejection explicitly — Color Mixer
answers a refused drop with a sound cue and a shake of the mixing zone rather
than letting the drop vanish silently [@wheel-mix] [@index].
