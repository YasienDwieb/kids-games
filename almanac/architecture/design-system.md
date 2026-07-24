---
title: "Design System Architecture"
summary: "A warm-cream token system (COLORS, ACCENTS, SPACING, FONTS, SHADOWS, TOUCH_TARGET) plus a small set of shared component primitives — PressableButton, BigButton, AppBar, GameCard — that every screen and game builds UI from instead of raw hex colors, system fonts, or hand-rolled buttons and headers."
topics: [architecture, design-system, ui]
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
mixing the given hex toward black [@pressable-button]. A `ghost` variant
swaps the same face/socket mechanic onto a white surface with ink text
instead of a solid accent fill, so the same press animation exists for
secondary actions [@pressable-button]. `BigButton` is a thin wrapper over
`PressableButton` that only exists to preserve an older `title`/`onPress`/
`color` call signature used across the games, so existing call sites did not
need to be rewritten when `PressableButton` was introduced [@big-button].

`AppBar` is the canonical header used across the app's own screens: a
back chevron on one side that flips direction for RTL (`I18nManager.isRTL ?
'›' : '‹'`), a centered title, and a right-side slot for a screen-specific
action [@app-bar]. `GameCard` is the Home-grid tile: it renders the game's
emoji icon inside an `EmojiFrame` tinted with the game's accent, the game
name, an optional "NEW" tag pinned to the top corner, and an optional
progress indicator shown as a rounded percentage once `progress > 0`
[@game-card]. It also supports a `fill` mode, used by the landscape rail
layout, that drops the card's fixed aspect ratio so the emoji frame flexes to
absorb whatever height is left over, keeping every card in a row the same
size regardless of content [@game-card].

## The rule this system encodes

Taken together, these files are the only place raw color values, font family
strings, spacing numbers, and shadow definitions are meant to live. A screen
or game reaching for a literal hex color, a system font name, or a
hand-built pressable-with-shadow instead of `COLORS`/`ACCENTS`, `FONTS`,
`SHADOWS`, and `PressableButton`/`AppBar`/`GameCard` is working around the
design system rather than inside it — the backwards-compatible alias groups
in `COLORS` exist precisely so that even old code has no excuse to fall back
to an ad hoc color instead of a token [@colors-ts].
