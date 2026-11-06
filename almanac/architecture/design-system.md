---
title: "Design System Architecture"
summary: "\"Pop Quest\" is the comic-pop visual language every screen and game draws from: loud flat per-game accent colors, one dark navy ink used for every outline, shadow, and label, and hard offset (no-blur) comic shadows, all defined as tokens in src/constants/ plus a small set of shared component primitives in src/components/common/. The system replaced an earlier warm-cream/soft-shadow palette wholesale, down to the fonts and the exact shape of PressableButton's press animation."
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
  - id: icon
    type: file
    path: src/components/common/Icon.tsx
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
  - id: game-meta
    type: file
    path: src/sdk/i18n/gameMeta.ts
  - id: home-screen
    type: file
    path: src/screens/HomeScreen.tsx
  - id: docs-design-system
    type: file
    path: docs/DESIGN_SYSTEM.md
---

Every screen and [game module](../concepts/game-module) in this app draws
from one design system, branded in its own source comments as "Pop Quest": a
fixed set of color, spacing, radius, touch-target, type-size, outline, and
shadow tokens in `src/constants/`, plus a handful of shared component
primitives in `src/components/common/` built on top of them [@colors-ts]
[@docs-design-system]. The visual language is deliberately loud and flat —
one dark navy ink used for every outline, shadow, and label; hard,
no-blur "comic" drop shadows; and per-game accent colors that are each a full
saturated hue rather than a tint — and it replaced an earlier, visually
different palette (a warm-cream canvas with a warm-brown ink and soft blurred
shadows) wholesale, not incrementally: the hex values, the shadow mechanism,
the default fonts, and the exact shape of the main button's press animation
all changed together [@colors-ts] [@dimensions-ts] [@typography-ts]
[@pressable-button]. Nothing in this layer is optional decoration: a game or
screen that needs a button, a header, or a colored surface is expected to
compose these tokens and primitives rather than picking its own hex value,
loading a system font, or hand-building a `Pressable` with custom press
styling.

## Color tokens: one canvas, six loud accents, and named chrome colors

`ACCENTS` defines six per-game accent families — green, orange, coral,
purple, blue, and pink — each with a `base` (the full-bleed fill), a darker
`deep` shade used for pressed/edge states, and a soft `tint` used for cell
and background fills [@colors-ts]. `COLORS` layers a shared surface system on
top: a warm-yellow-tinted cream `canvas` (`#FFF7E0`) and `canvas2`, white
`surface`/`surface2`, and a dark navy `ink`/`inkSoft`/`inkFaint` scale that
stands in for black/gray text, outlines, and shadows everywhere — the file's
own header comment calls this "one dark ink for every outline, hard offset
shadow and label" [@colors-ts]. A separate `brand` family (`#7B4DFF`, a dark
grape) is reserved for the app's own hub chrome rather than any one game
[@colors-ts]. `COLORS` also keeps `primary.*`, `background.*`, and `text.*`
alias groups that map onto the same underlying values, marked in the source
as "backwards-compatible groups (games import these via `@/sdk`) …retuned to
the pop system; keys preserved so games keep working" — the mechanism that
let the whole rebrand land without every game's call site changing
[@colors-ts].

`POP` is a second, flatter token object for chrome that does not belong to
any one game's accent — `zap` (sunny yellow, used for Home chrome, level-up
headers, and combo badges), `grape` (brand), `bubblegum`, `splash`, `lime`,
and a dark `night`/`nightSoft` pair used for the daily-limit break screen's
night sky [@colors-ts]. A third, narrower palette, `BUDDY_COLORS`, defines
Zain the lion cub's fur/mane/muzzle/scarf colors for his 3D model and picker
card; Lulu the owl reuses `ACCENTS.purple` instead of a dedicated palette
[@colors-ts]. See [Buddy, mascot, and wardrobe](buddy-and-wardrobe) for where
these colors actually get used.

## Text stays legible: `bestTextOn`, not a fixed label color

Six loud, saturated accents mean a single hardcoded label color cannot stay
legible on all of them — a white label is unreadable on the brighter
accents, and a dark label is unreadable on the rare dark fill. `contrastRatio(a,
b)` and `bestTextOn(background)`, defined in `src/constants/colors.ts`, solve
this at the source instead of per call site: `bestTextOn` picks whichever of
`COLORS.ink` or `COLORS.surface` actually wins WCAG contrast against a given
hex fill, and falls back to `ink` for non-hex fills such as `rgba()`
[@colors-ts]. `PressableButton` and `GameCard` both call it to color their own
label text, so a game passing an arbitrary custom `color`/`accent` still gets
a legible label without its author having to reason about contrast
[@pressable-button] [@game-card]. `src/constants/__tests__/contrast.test.ts`
is the enforced floor behind this: every `ACCENTS` entry must clear WCAG AA
(4.5:1) with whatever `bestTextOn` picks for it, `bestTextOn` must pick ink
(not white) on every current light accent, `inkSoft`/`ink` must clear AA on
both `surface` and `canvas`, and — now that the dark grape `brand` clears AA
with a white label directly — a dedicated test pins that `bestTextOn(COLORS.brand)`
returns white [@contrast-test]. The full history of why this mechanism exists
and what specific contrast numbers motivated it is on the
[WCAG AA contrast floor](../decisions/wcag-aa-contrast-floor) decision page;
not every component that draws text uses it, though — `Chip` (below) now
uses two fixed, pre-checked color combinations instead of computing one per
fill.

## Sizing, outline, and shadow tokens

`src/constants/dimensions.ts` holds the rest of the scale. `SPACING` runs
`xs: 4` through `xxl: 48`; `BORDER_RADIUS` keeps legacy `sm`/`md`/`lg`/`full`
keys for older call sites alongside the current Pop Quest radii — `tile: 28`
for game cards, `card: 22`, `btn: 26` for buttons, `soft: 14`, and `pill:
9999` [@dimensions-ts]. `TOUCH_TARGET` is the accessibility-driven sizing
scale: `min: 48` (the accessibility floor), `recommended: 64`, and `large:
80`, tied directly to the fact that this app's players are young children,
who need larger tap targets than an adult-facing app would [@dimensions-ts].
`FONT_SIZES` runs `sm: 18` through `title: 48` [@dimensions-ts].

`OUTLINE` (`thin: 2`, `base: 3`, `thick: 4`, plus `color` — the same navy as
`COLORS.ink`) is the ink border every Pop Quest surface wears; the file's own
comment states this plainly: "every Pop Quest surface wears one"
[@dimensions-ts]. `SHADOWS` provides three prebuilt hard, offset,
*un*-blurred shadow fragments (`sm`/`md`/`lg`), each a plain `boxShadow` CSS
string in the same ink color rather than React Native's `shadow*`/`elevation`
style props — the comment notes `boxShadow` "renders the same on iOS and
Android under the New Architecture, unlike `shadow*`/`elevation`"
[@dimensions-ts]. This is a comic-book shadow, not a soft drop shadow: no
blur radius, a fixed pixel offset, and the same ink color as every outline.

## Fonts follow language, and also follow script independently of it

`FONTS` in `src/constants/typography.ts` is not a plain object of font-family
strings — it is an object of getters, so `FONTS.display` resolves a
different value depending on the running language every time it is read
[@typography-ts]. Latin text uses **Lilita One** for display roles and
**Nunito** (in three weights: `body`/`bodySemi`/`bodyExtra`) for body text;
Arabic text uses **Baloo Bhaijaan 2** for display and **IBM Plex Sans
Arabic** for body [@typography-ts]. The selection is keyed off
`I18nManager.isRTL` rather than `i18n.language`, for the same boot-ordering
reason covered in [i18n and RTL](i18n-and-rtl): the native RTL flag is
correct before any `StyleSheet.create()` call runs, while `i18n.language` is
not [@typography-ts]. A second helper, `fontsFor(language)`, returns the full
font set for one script regardless of the *UI's* current direction — the
case a game needs when it draws text in a script the active UI language is
not currently using, such as an Arabic letter shown inside an English-language
screen [@typography-ts]. This page only needs the reader to know fonts are
part of the same token system and resolve per-language (or per-script)
automatically at every call site — the reasoning behind keying display on the
RTL flag specifically, and its reload consequence, lives on the
[RTL font selection](../decisions/rtl-font-selection) decision page.

## Component primitives built on the tokens

`PressableButton` is the base button every other button in the app wraps or
resembles, and its press mechanic is a single animated "face" pressing down
onto a fixed ink "shadow" sitting behind and offset from it, not a
two-layer socket/face pair — pressing translates the face toward the shadow
by a fixed `DROP` amount (4px, flipped for RTL), so the face visually lands
flush with the shadow and springs back on release [@pressable-button]. The
fill is either an explicit `color`, an `accent` name resolved through
`ACCENTS`, or — when neither is supplied — `ACCENTS.green.base`, the
component's current default [@pressable-button]. `colorDeep` is a deprecated
prop kept only so older call sites still compile; the source comment is
explicit that "the edge is always ink now," since the separate pressed-edge
shade the old socket/face mechanic needed no longer exists [@pressable-button].
The label color still follows the fill through `bestTextOn(base)`, except on
the `ghost` variant, which always renders a white face with fixed ink text
instead of a solid accent fill [@pressable-button].

Because the shadow is a separate, absolutely positioned layer behind the
face, a caller that wants a specific fill color must still pass it through
the `color` prop, not through a plain `style={{ backgroundColor }}` — the two
look identical in a prop list, but a `style` background lands on the outer
`Pressable`, which only shows at the thin margin the shadow is offset into,
not across the visible face. `shape-detective`'s pattern and odd-one-out
puzzles shipped exactly this mistake against the component's *earlier*
socket/face structure: each answer tile was supposed to reveal its accent
color by tinting the whole button face, but the color was passed as
`style.backgroundColor`, so the reveal only ever tinted the thin edge the
caller's style could actually reach and never visibly changed the tile at
all [@pattern-puzzle] [@odd-one-out-puzzle]. The fix — passing the same color
through `color` instead, plus a fixed-size `View` wrapper so every tile
paints the exact same footprint regardless of the shape's own size — is still
the right fix under the current structure, and the general lesson is
unchanged: any `PressableButton` caller that needs its answer to visibly
change color on reveal should use `color`, never a `style` background.
`BigButton` is a thin wrapper over `PressableButton` that only exists to
preserve an older `title`/`onPress`/`color` call signature used across the
games, so existing call sites did not need to be rewritten when
`PressableButton` was introduced [@big-button].

`Chip` is the pill filter/tab control, and unlike `PressableButton` it no
longer calls `bestTextOn` at all: it uses two fixed, pre-checked color
combinations instead of computing one per fill — inactive is a white fill
with an ink border and ink text (plus `SHADOWS.sm`), active is a solid ink
fill with `POP.zap` (yellow) text and no shadow, so the selected state reads
as physically "pressed down" rather than lifted [@chip].

`AppBar` is the canonical header used across the app's own screens: a back
chevron on one side, a start-aligned title, and a right-side slot for a
screen-specific action [@app-bar]. The chevron no longer renders its own text
glyph — `AppBar` and `BackButton` both render it through the shared `Icon`
component, which resolves a small `name → mirrored name` lookup
(`'chevron-back' ↔ 'chevron-forward'`) against `I18nManager.isRTL` inside its
own render body [@app-bar] [@icon]. The underlying gotcha this solves — read
the RTL flag at render time, never capture it at module scope — is the same
one covered as a real incident on [i18n and RTL](i18n-and-rtl), which also
has the history of how this logic got here before it moved into `Icon`.

`GameCard` is the Home-grid tile: a loud, full-bleed accent background with
an ink `OUTLINE` border and a hard `SHADOWS.sm` shadow, a white inner
"window" holding either the game's emoji (via the `EmojiImage` primitive, not
the separate `EmojiFrame` component other screens use) or its cover art, the
game name in the display font underneath, and an optional rotated `POP.zap`
"NEW" pill tag [@game-card]. When a `GameConfig` sets `cover` (an illustrated
square image), `GameCard` shows that instead of the emoji [@game-card], and
`HomeScreen` resolves it through `gameCover(game)` rather than reading
`game.cover` directly [@home-screen] [@game-meta], so a game whose
`coverByLanguage` entry supplies a different image for the active language —
Letter Land and Trace It ship an Arabic-letter `cover.ar.jpg` alongside their
default Latin-letter `cover.jpg` — shows the right art without `GameCard`
itself knowing about languages at all; see the exact field contract on
[Game config schema](../reference/game-config-schema). It also supports a
`fill` mode, used by the landscape rail layout, that drops the card's fixed
aspect ratio so the window flexes to absorb whatever height is left over,
keeping every card in a row the same size regardless of content [@game-card].
That rail is `HomeScreen`'s own landscape branch, the earliest instance of a
wider pattern of individual screens computing their own `landscape` boolean
and rendering a purpose-built tree or style set for it — see
[Landscape screen branching](../concepts/landscape-screen-branching) for the
idiom and its recurring gotchas. Every shared pressable in this layer —
`PressableButton`, `GameCard`, `Chip`, and `HoldToConfirm` — also sets
`accessibilityRole="button"` (and `accessibilityState` where relevant, such
as a disabled or selected state), so a screen reader announces each as an
actual button instead of an unlabeled touchable [@game-card]
[@pressable-button] [@chip] [@hold-to-confirm].

## The rule this system encodes

Taken together, these files are the only place raw color values, font family
strings, spacing numbers, outline widths, and shadow definitions are meant to
live. A screen or game reaching for a literal hex color, a system font name,
or a hand-built pressable-with-shadow instead of `COLORS`/`ACCENTS`/`POP`,
`FONTS`, `OUTLINE`/`SHADOWS`, and
`PressableButton`/`AppBar`/`GameCard`/`Chip` is working around the design
system rather than inside it — the backwards-compatible alias groups in
`COLORS` exist precisely so that even old code has no excuse to fall back to
an ad hoc color instead of a token [@colors-ts].
