# Per-game i18n contract (foundation is DONE — follow this exactly)

The app i18n foundation already exists. Each game localizes itself by touching
ONLY its own `src/games/<id>/` folder. Do NOT edit `src/games/index.ts`, the SDK,
screens, or any other game — those are owned elsewhere and parallel edits collide.

## SDK surface (import from `@/sdk`)

- `useTranslation()` → `{ t }` — call `t('<gameId>:section.key')` (namespaced).
- `registerTranslations(namespace, { en, ar })` — registers bundles. Call it as a
  side effect (see wiring below). `namespace` MUST equal the game's `id` from config.ts.
- HomeScreen + GamePlayer already resolve game name/description via `gameName()`/
  `gameDescription()`, which read `t('<id>:meta.name')` / `t('<id>:meta.description')`
  with the config English value as fallback. So you MUST register `meta.name` and
  `meta.description` in your bundle.

## Files to create in each game folder

1. `locales/en.ts` — `export const en = { meta: { name, description }, ... } as const;`
   Mirror EVERY user-facing English string in the game (read the full files — JSX
   `<Text>`, `label=`, `placeholder=`, `accessibilityLabel=`, AND dynamic strings in
   `constants.ts` like color names, challenge defs, difficulty labels, level names).
2. `locales/ar.ts` — `import type { GameTranslations } from './en';
   export const ar: GameTranslations = { ... };` Same key shape, Arabic values.
   Use this `en.ts` type trick so TS enforces matching KEYS without locking VALUES:
   ```ts
   } as const;
   type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
   export type GameTranslations = T<typeof en>;
   ```
3. `i18n.ts` — `import { registerTranslations } from '@/sdk'; import { en } from
   './locales/en'; import { ar } from './locales/ar';
   registerTranslations('<gameId>', { en, ar });`

## Wiring (no shared-file edits)

Add ONE line to your game's existing `config.ts`: `import './i18n';` at the top.
That side-effect registers the bundles when the game registers itself. Done — no
`src/games/index.ts` change needed.

## Replace strings in components

Add `const { t } = useTranslation();` in each component that renders text, replace
literals with `t('<gameId>:key')`. Keep emoji and asset-intent strings as-is.

## Arabic quality

Meaningful & kid-friendly, NOT literal machine translation. Warm, playful, simple
words a child would understand. Western digits for numbers/scores. Don't translate
emoji.

## RTL audit (this game runs with full RTL mirroring when ar is active)

`I18nManager.forceRTL(true)` flips fl-direction layout automatically, but NOT:
- absolute `left`/`right` → change to `start`/`end` so they mirror.
- horizontal coordinate math / gesture dx (physics, grid columns, drag, swipe
  direction) — audit: if positions are computed from screen width with hardcoded
  left-origin assumptions, they may need mirroring OR explicit pinning.
- directional glyphs (`←`/`→`/`‹`/`›`/`↩️`) — flip or use `I18nManager.isRTL` to pick.
- sequences that must read left-to-right regardless (number rows) — pin with
  `direction: 'ltr'` style or `I18nManager` guard.
Report what you changed and any gameplay coordinate risks you could NOT fully verify.
