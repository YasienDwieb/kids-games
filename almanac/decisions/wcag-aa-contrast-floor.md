---
title: "Decision: Enforce a WCAG AA Contrast Floor on Every Fill"
summary: "Every accent in ACCENTS is tuned to roughly the same lightness, which made white button labels fall to ~2.2-2.8:1 contrast; colors.ts now computes the winning label color per fill with bestTextOn, PressableButton and Chip default to the purple accent instead of the too-light COLORS.brand, and a Jest suite pins the floor so it cannot silently regress."
topics: [decisions, design-system]
sources:
  - id: colors-ts
    type: file
    path: src/constants/colors.ts
  - id: contrast-test
    type: file
    path: src/constants/__tests__/contrast.test.ts
  - id: pressable-button
    type: file
    path: src/components/common/PressableButton.tsx
  - id: chip
    type: file
    path: src/components/common/Chip.tsx
---

This decision fixes a systemic contrast failure in the [design
system](../architecture/design-system)'s color tokens: every accent family
was tuned for visual harmony without checking whether text drawn on top of it
was actually readable. The fix is not a one-off color swap but a small pair of
contrast-math functions that every button-like component now calls, plus a
Jest suite that enforces the result. See the design system's
[contrast floor section](../architecture/design-system) for how
`PressableButton` and `Chip` consume the result day to day; this page covers
why the change was necessary and what it commits the project to going
forward.

## Context

`ACCENTS` harmonizes its six per-game colors to roughly the same lightness
(`L~0.74`, chroma `~0.13`) so no single accent reads louder or heavier than
another [@colors-ts]. That harmonization has a side effect nobody had
measured: white text on any of these light accents only reaches about
2.2–2.8:1 contrast, well short of the WCAG AA floor of 4.5:1 for normal text.
A device audit made the failure concrete rather than theoretical — the app's
primary call-to-action button measured 2.78:1, and the `inkSoft` token used
for secondary text throughout the app measured 3.85:1 on its usual
backgrounds [@contrast-test]. `COLORS.brand` (`#8B7CF0`), the violet used as
`PressableButton`'s and `Chip`'s previous default fill, was a particularly bad
case: neither `COLORS.ink` (3.81:1) nor `COLORS.surface` white (3.37:1)
clears AA against it, so no single hardcoded label color could ever have
fixed it — the fill itself had to change.

## Decision

Two functions were added to `src/constants/colors.ts`: `contrastRatio(a, b)`,
a standard WCAG relative-luminance contrast calculation, and
`bestTextOn(background)`, which returns whichever of `COLORS.ink` or
`COLORS.surface` wins contrast against a given hex background, falling back
to `ink` for non-hex fills such as `rgba()` values [@colors-ts]. `inkSoft` was
also darkened from `#8C8073` to `#6E6357`, reaching 5.86:1 on `COLORS.surface`
and 5.32:1 on the cream `canvas` [@colors-ts].

`PressableButton` and `Chip` both call `bestTextOn(base)` to color their own
label text instead of hardcoding white, so a game passing an arbitrary custom
`color` prop to `PressableButton` still gets a legible label without its
author having to reason about contrast [@pressable-button] [@chip]. Because no
single label color clears AA against `COLORS.brand`, both components also
changed their *default* fill — used when neither `accent` nor `color` is
supplied — from `COLORS.brand` to `ACCENTS.purple.base`, the accent in the
same violet family that does clear AA with ink (4.62:1) [@pressable-button]
[@chip]. `COLORS.brand` itself is unchanged and still used for the app's own
hub chrome elsewhere; only the two components' *default* fill moved.

`src/constants/__tests__/contrast.test.ts` turns this into an enforced floor
rather than a one-time fix: it asserts every entry in `ACCENTS` clears AA with
whatever `bestTextOn` picks for it, that `bestTextOn` always picks `ink` (not
`surface`) on every current light accent, that `inkSoft` and `ink` both clear
AA on `surface` and `canvas`, and it documents the `COLORS.brand` dead zone
directly by asserting neither `ink` nor `surface` clears AA against it
[@contrast-test].

## Status

Current.

## Consequences

Any component that draws text on an arbitrary or game-supplied fill should
call `bestTextOn` rather than hardcoding a label color — `PressableButton`
and `Chip` are the reference implementations. Adding a new accent to
`ACCENTS` is now implicitly constrained: it must stay light enough that
`bestTextOn` picks `ink` for it and that ink clears 4.5:1 against it, or
`contrast.test.ts` fails. `COLORS.brand` remains usable for non-text-bearing
surfaces (backgrounds, chrome) but is no longer a safe default fill for
anything that draws a label directly on top of it. The `ghost` button variant
and any other explicitly ink-on-white treatment are unaffected — `bestTextOn`
only changes behavior for fills that were ambiguous or actively failing
before.
