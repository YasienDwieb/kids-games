---
title: "Design System Architecture"
summary: "A warm-cream token system (COLORS, ACCENTS, SPACING, FONTS, SHADOWS, TOUCH_TARGET) plus a small set of shared component primitives — PressableButton, BigButton, AppBar, GameCard — that every screen and game builds UI from instead of raw hex colors, system fonts, or hand-rolled buttons and headers."
topics: [architecture, design-system]
sources:
  - id: colors-ts
    type: file
    path: src/constants/colors.ts
  - id: dimensions-ts
    type: file
    path: src/constants/dimensions.ts
  - id: typography-ts
    type: file
    path: src/constants/typography.ts
  - id: pressable-button
    type: file
    path: src/components/common/PressableButton.tsx
  - id: big-button
    type: file
    path: src/components/common/BigButton.tsx
  - id: app-bar
    type: file
    path: src/components/common/AppBar.tsx
  - id: game-card
    type: file
    path: src/components/common/GameCard.tsx
  - id: contrast-test
    type: file
    path: src/constants/__tests__/contrast.test.ts
  - id: chip
    type: file
    path: src/components/common/Chip.tsx
  - id: hold-to-confirm
    type: file
    path: src/components/common/HoldToConfirm.tsx
  - id: odd-one-out-puzzle
    type: file
    path: src/games/shape-detective/components/OddOneOutPuzzle.tsx
  - id: pattern-puzzle
    type: file
    path: src/games/shape-detective/components/PatternPuzzle.tsx
---

Every screen and [game module](../concepts/game-module) in this app draws
from one design system: a fixed set of color, spacing, radius, touch-target,
type-size, and shadow tokens in `src/constants/`, plus a handful of shared
component primitives in `src/components/common/` built on top of them. The
tokens encode one visual identity — a warm cream canvas, warm-brown ink
instead of black, and six harmonized per-game accent colors — and the
primitives encode one interaction identity, most visibly `PressableButton`'s
"socket and face" press animation. Nothing in this layer is optional
decoration: a game or screen that needs a button, a header, or a colored
surface is expected to compose these tokens and primitives rather than
picking its own hex value, loading a system font, or hand-building a
`Pressable` with custom press styling.

## Color tokens: one canvas, six accents

`ACCENTS` defines six per-game accent families — green, orange, coral,
purple, blue, and pink — each with a `base`, a darker `deep` shade used for
pressed/edge states, and a soft `tint` used for fills, and the file's comment
notes they are harmonized to roughly the same lightness and chroma so no
single accent reads brighter or heavier than another [@colors-ts]. `COLORS`
layers a shared surface system on top: a warm cream `canvas` (`#FBF3E6`) and
`canvas2`, white `surface`/`surface2`, a warm-brown `ink`/`inkSoft`/`inkFaint`
scale that stands in for black/gray text everywhere, and a violet `brand`
family reserved for the app's own hub chrome rather than any one game
[@colors-ts]. `COLORS` also keeps `primary.*`, `background.*`, and `text.*`
alias groups that map onto the same underlying values — the file's comment
marks these "backwards-compatible groups (games import these via `@/sdk`)," 
kept so older game code written before the accent system existed keeps
resolving to the right colors without a rewrite [@colors-ts].

## Text stays legible: the WCAG AA contrast floor

Harmonizing every accent to roughly the same lightness (`L~0.74`) is what keeps
six different game colors from reading as louder or heavier than one another
[@colors-ts], but it has a side effect: a plain white label on any of them
only reaches about 2.2–2.8:1 contrast, well under the WCAG AA 4.5:1 floor for
normal text. A device audit made this concrete — the app's primary CTA
measured 2.78:1, and the `inkSoft` secondary-text token measured 3.85:1
[@contrast-test]. `contrastRatio(a, b)` and `bestTextOn(background)`, added to
`src/constants/colors.ts`, fix this at the source instead of per call site:
`bestTextOn` picks whichever of `COLORS.ink` or `COLORS.surface` actually wins
contrast against a given hex fill, and falls back to `ink` for non-hex fills
such as `rgba()` [@colors-ts]. `PressableButton` and `Chip` both call it to
color their own label text, so a game passing an arbitrary custom `color`
prop still gets a legible label without its author having to reason about
contrast [@pressable-button] [@chip]. `COLORS.brand` (`#8B7CF0`) itself sits
in what the code calls a "contrast dead zone" — neither ink (3.81:1) nor
white (3.37:1) clears AA against it — which is why `PressableButton` and
`Chip` changed their default fill, used when no `accent`/`color` is supplied,
from `COLORS.brand` to `ACCENTS.purple.base`, the closest accent in the same
violet family that does clear AA with ink (4.62:1) [@pressable-button]
[@chip]. `COLORS.inkSoft` was darkened from `#8C8073` to `#6E6357` for the
same reason — 5.86:1 on `COLORS.surface`, 5.32:1 on the cream `canvas`
[@colors-ts]. `src/constants/__tests__/contrast.test.ts` turns all of this
into an enforced guard: every accent must clear AA with `bestTextOn`'s chosen
label color, `bestTextOn` must pick ink (not white) on every light accent, and
`inkSoft`/`ink` must clear AA on both `surface` and `canvas` [@contrast-test].
The full reasoning, including why the default fill moved to the purple accent
instead of `brand`, is recorded on the
[WCAG AA contrast floor](../decisions/wcag-aa-contrast-floor) decision page.

## Sizing tokens: spacing, radius, and child-sized touch targets

`src/constants/dimensions.ts` holds the rest of the scale. `SPACING` runs
`xs: 4` through `xxl: 48`; `BORDER_RADIUS` keeps legacy `sm`/`md`/`lg`/`full`
keys for older call sites alongside newer design-system radii — `tile: 30`
for game cards, `card: 22`, `btn: 20` for buttons, `soft: 14`, and `pill:
9999` [@dimensions-ts]. `TOUCH_TARGET` is the accessibility-driven sizing
scale: `min: 48` (the accessibility floor), `recommended: 64`, and `large:
80` — the file's own comment ties these directly to the fact that this app's
players are young children, who need larger tap targets than an adult-facing
app would [@dimensions-ts]. `FONT_SIZES` runs `sm: 18` through `title: 48`,
and `SHADOWS` provides three prebuilt RN shadow-style fragments (`sm`, `md`,
`lg`), each using the same warm `shadowColor: '#4A341C'` instead of a generic
black shadow, so drop shadows read as warm and soft rather than harsh
[@dimensions-ts].

## Fonts follow language, not a static string

`FONTS` in `src/constants/typography.ts` is not a plain object of font-family
strings — it is an object of getters, so `FONTS.display` resolves a
different value depending on the running language every time it is read
[@typography-ts]. Latin text uses Fredoka for display roles and Nunito for
body text; Arabic text uses one family, IBM Plex Sans Arabic, for both roles
[@typography-ts]. The selection is keyed off `I18nManager.isRTL` rather than
`i18n.language`, for the same boot-ordering reason covered in
[i18n and RTL](../architecture/i18n-and-rtl): the native RTL flag is correct
before any `StyleSheet.create()` call runs, while `i18n.language` is not
[@typography-ts]. This page only needs the reader to know fonts are part of
the same token system and resolve per-language automatically at every call
site — the reasoning behind keying on the RTL flag specifically, and its
reload consequence, lives on the
[RTL font selection](../decisions/rtl-font-selection) decision page.

## Component primitives built on the tokens

`PressableButton` is the base button every other button in the app wraps or
resembles. It renders two overlapping layers — a `socket` (the deeper
background) and a `face` (the visible button surface) — and on press,
translates the face down by a fixed `EDGE` amount so the face visually
compresses into the socket's darker bottom edge, then springs back on
release [@pressable-button]. The socket/edge color is either an explicit
`color`/`colorDeep` pair, an `accent` name resolved through `ACCENTS`, or,
if only a flat `color` is given, an automatically darkened shade computed by
mixing the given hex toward black [@pressable-button]. When neither `color`
nor `accent` is supplied, the fill defaults to `ACCENTS.purple.base`, not
`COLORS.brand`, and the label text color is computed per fill by
`bestTextOn(base)` rather than hardcoded white — see the contrast floor
section above for why [@pressable-button]. A `ghost` variant
swaps the same face/socket mechanic onto a white surface with ink text
instead of a solid accent fill, so the same press animation exists for
secondary actions [@pressable-button].

Because the socket/face split means `PressableButton` paints its own
background, a caller that wants a specific fill color must pass it through the
`color` prop, not through a plain `style={{ backgroundColor }}` — the two look
identical in a prop list, but a `style` background only ever lands on the
outer socket, a roughly 5px edge that the face sits above and normally hides
almost entirely. `shape-detective`'s pattern and odd-one-out puzzles shipped
this exact mistake: each answer tile is supposed to reveal its accent color
(green for correct, coral for wrong) by tinting the whole button face, but the
color was passed as `style.backgroundColor`, so the reveal only ever tinted
that thin socket edge and never visibly changed the tile at all [@pattern-puzzle]
[@odd-one-out-puzzle]. The fix was passing the same color through `color`
instead, plus giving the shape inside the button a fixed-size `View` wrapper
(`optionSlot`/`itemSlot`) so every tile paints the exact same footprint
regardless of the shape's own size — sizing the outer button itself let the
face shrink around a small shape and leak the socket edge around it as a
visible nested box [@pattern-puzzle] [@odd-one-out-puzzle]. Any new
`PressableButton` caller that needs its answer to visibly change color on
reveal should use `color`, never a `style` background. `BigButton` is a thin
wrapper over
`PressableButton` that only exists to preserve an older `title`/`onPress`/
`color` call signature used across the games, so existing call sites did not
need to be rewritten when `PressableButton` was introduced [@big-button].

`AppBar` is the canonical header used across the app's own screens: a
back chevron on one side that flips direction for RTL, a centered title, and
a right-side slot for a screen-specific action [@app-bar]. The chevron itself
is resolved by a `backGlyph()` function called at render time
(`I18nManager.isRTL ? '›' : '‹'`), not a module-level constant — a
distinction that matters, and is covered as a real gotcha, on
[i18n and RTL](../architecture/i18n-and-rtl) [@app-bar]. `GameCard` is the
Home-grid tile: it renders the game's emoji icon inside an `EmojiFrame`
tinted with the game's accent, the game name, an optional "NEW" tag pinned to
the top corner, and an optional progress indicator shown as a rounded
percentage once `progress > 0` [@game-card]. It also supports a `fill` mode,
used by the landscape rail layout, that drops the card's fixed aspect ratio
so the emoji frame flexes to absorb whatever height is left over, keeping
every card in a row the same size regardless of content [@game-card]. That
rail is `HomeScreen`'s own landscape branch, the earliest instance of a
wider pattern of individual screens computing their own `landscape` boolean
and rendering a purpose-built tree or style set for it — see
[Landscape screen branching](../concepts/landscape-screen-branching) for the
idiom and its recurring gotchas. Every
shared pressable in this layer — `PressableButton`, `GameCard`, `Chip`, and
`HoldToConfirm` — also sets `accessibilityRole="button"` (and
`accessibilityState` where relevant, such as a disabled or selected state),
so a screen reader announces each as an actual button instead of an
unlabeled touchable [@game-card] [@pressable-button] [@chip]
[@hold-to-confirm].

## The rule this system encodes

Taken together, these files are the only place raw color values, font family
strings, spacing numbers, and shadow definitions are meant to live. A screen
or game reaching for a literal hex color, a system font name, or a
hand-built pressable-with-shadow instead of `COLORS`/`ACCENTS`, `FONTS`,
`SHADOWS`, and `PressableButton`/`AppBar`/`GameCard` is working around the
design system rather than inside it — the backwards-compatible alias groups
in `COLORS` exist precisely so that even old code has no excuse to fall back
to an ad hoc color instead of a token [@colors-ts].
