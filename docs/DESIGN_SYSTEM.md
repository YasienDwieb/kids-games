# Design system

One "Pop Quest" comic-pop design system: loud flat colour, a single navy ink for every outline and hard offset shadow, grape brand, and per-game **accent** families. Use tokens + primitives — no raw hex, system fonts, or hand-rolled controls.

- **Tokens** (`@/sdk`): `COLORS`, `POP`, `ACCENTS` (`green`/`orange`/`coral`/`purple`/`blue`/`pink`), `FONTS` (`display`=Lilita One, `body*`=Nunito), `OUTLINE`, `SHADOWS`, `SPACING`, `BORDER_RADIUS`, `FONT_SIZES`, `TOUCH_TARGET`
- **Primitives** (`components/common`, re-exported from `@/sdk`): `PressableButton` (chunky CTA), `BigButton`, `IconButton`, `AppBar`, `Chip`, `HudPill`, `EmojiFrame`, `Star`, `GameCard`, `BackButton`, `SafeContainer`, `Icon`

See [`CLAUDE.md`](../CLAUDE.md) (Design-system adherence) and the `kids-games-dev` skill for the full contract.
