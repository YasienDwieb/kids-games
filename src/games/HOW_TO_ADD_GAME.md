# How to Add a New Game

Games are self-contained folders under `src/games/`. Every game imports exclusively from `@/sdk` — never from another game's folder or deep `src/` paths.

> **The app is bilingual (English + Arabic, full RTL).** No user-facing string may be hardcoded — every string goes through `t()`, and each game ships `en`/`ar` locale bundles. See the **Internationalization** section below; the `kids-games-dev` skill (§7) has the full contract.

## Quick Start

### 1. Copy the template

```bash
cp -r src/games/_template src/games/my-game
```

Use a kebab-case name (`a-z`, `0-9`, hyphens only).

### 2. Update `config.ts`

```ts
import './i18n';              // side-effect: registers en/ar translation bundles
import { registerGame } from '@/sdk';
import MyGame from './index';

registerGame({
  id: 'my-game',              // unique kebab-case id
  name: 'My Game',            // English fallback (localized via my-game:meta.name)
  description: 'A fun game for kids.',
  icon: '🎯',                 // emoji for the card
  ageRange: { min: 3, max: 6 },
  component: MyGame,
  backgroundColor: '#FF6B6B',
  // optional:
  tags: ['matching', 'colors'],
  version: '1.0.0',
  layout: { mode: 'shell' },  // or 'bare' — see Layout section below
});
```

`registerGame` validates the config on call and throws with a clear message on failure.

### 3. Build your game in `index.tsx`

Import everything from `@/sdk`, and route every visible string through `t()`:

```ts
import { useSound, useGameShell, useTranslation, COLORS, FONT_SIZES, SPACING } from '@/sdk';
// const { t } = useTranslation();  →  <Text>{t('my-game:title')}</Text>
```

### 4. Add translations

Create `locales/en.ts`, `locales/ar.ts`, and `i18n.ts` — see the **Internationalization** section below. (Skipping this leaves hardcoded English and breaks Arabic.)

### 5. Register the game

Add a side-effect import to `src/games/index.ts`:

```ts
import './my-game/config';
```

The game now appears on the home screen.

---

## Folder Structure

```
src/games/my-game/
├── index.tsx        # Root game component
├── config.ts        # Metadata + registerGame() call (imports ./i18n)
├── i18n.ts          # registerTranslations('my-game', { en, ar })
├── locales/
│   ├── en.ts        # English strings (source of truth + GameTranslations type)
│   └── ar.ts        # Arabic strings (same keys, typed by GameTranslations)
├── components/      # Game-specific UI components (optional)
├── hooks/           # Game-specific hooks (optional)
└── utils/           # Helpers (optional)
```

---

## Audio (sounds)

Use `useSound` from `@/sdk`. Play sounds by intent — never reference asset file paths directly:

```ts
const { play } = useSound();

play('pop');      // card flip, tap, UI feedback
play('success');  // match found, correct answer
play('win');      // game won, level complete
play('wrong');    // mismatch, wrong answer
```

The SDK maps intents to the appropriate shared audio asset automatically. Sound and haptics respect the user's settings.

**Full tag vocabulary:**

| Tags | Meaning |
|---|---|
| `pop`, `flip`, `tap`, `ui` | UI interaction |
| `success`, `match`, `reward` | Positive outcome |
| `win`, `celebration`, `complete` | Game/round won |
| `wrong`, `mismatch`, `error` | Negative outcome |

Shared audio assets live in `src/sdk/assets/audio/`. To add a new sound, add the file there and register it with tags in `src/sdk/assets/manifest.ts`.

---

## Internationalization (English + Arabic, full RTL) — required

Every game owns its strings under its own namespace (= the game `id`). Create three files:

**`locales/en.ts`** — keys + structural type:
```ts
export const en = {
  meta: { name: 'My Game', description: 'A fun game for kids.' },
  title: 'My Game',
  win: { title: 'You did it!', playAgain: 'Play again' },
} as const;
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
```

**`locales/ar.ts`** — same keys (TS enforces it), Arabic values:
```ts
import type { GameTranslations } from './en';
export const ar: GameTranslations = {
  meta: { name: 'لعبتي', description: 'لعبة ممتعة للأطفال' },
  title: 'لعبتي',
  win: { title: 'أحسنت!', playAgain: 'العب مرة ثانية' },
};
```

**`i18n.ts`** — register, and import it from `config.ts` (step 2):
```ts
import { registerTranslations } from '@/sdk';
import { en } from './locales/en';
import { ar } from './locales/ar';
registerTranslations('my-game', { en, ar });
```

Then in components: `const { t } = useTranslation();` and `t('my-game:title')`. Register `meta.name`/`meta.description` (home tile + header use them).

**Arabic must be meaningful & kid-friendly, not literal translation.** Use Western digits (via `{{var}}` interpolation), keep emoji untranslated.

**RTL:** Arabic mirrors the whole layout. Use `start`/`end` (not `left`/`right`) for absolute positions, flip directional glyphs/emoji with `I18nManager.isRTL`, and pin coordinate/grid math in bare games (`direction: 'ltr'`) so gameplay stays aligned. `FONTS.*` switches to the Arabic family automatically.

**Verify:** add your keys to `src/sdk/i18n/__tests__/keys.test.ts` — it asserts every key resolves in both languages (a missing key otherwise renders silently as the key string).

---

## Layout

### Shell mode (default)

Omit `layout` or set `layout: { mode: 'shell' }`. The game is wrapped in `GameShell`, which provides a title bar and back button. Use `useGameShell()` inside your component:

```ts
const { setScore, showOverlay, hideOverlay } = useGameShell();

setScore(10);                           // show score in header
showOverlay('win', <WinScreen />);      // full-screen win overlay
showOverlay('pause', <PauseMenu />);
hideOverlay('win');
```

Overlay slots: `'win'`, `'pause'`, `'loading'`, `'error'`.

### Bare mode

Set `layout: { mode: 'bare' }` for full-canvas games (custom backgrounds, full-screen animations). `GamePlayerScreen` renders only an absolute `BackButton` — the game manages its own layout and safe-area handling. See `simple-pairs` and `color-mixer` as examples.

---

## Age Bands

Set `ageRange: { min, max }` — required. Age band membership is derived automatically:

| Band id | Label | Ages |
|---|---|---|
| `toddler` | Toddler | 2–3 |
| `preschool` | Preschool | 3–5 |
| `early` | Early years | 5–7 |
| `kids` | Big kids | 7–10 |

To override the derived bands, set `bands: ['preschool', 'early']` in the config.

---

## Config Validation Rules

`registerGame` throws if any of these fail:

- `id` must match `/^[a-z0-9]+(-[a-z0-9]+)*$/`
- `name`, `description`, `icon`, `backgroundColor` must be non-empty strings
- `component` must be a function (React component)
- `ageRange.min <= ageRange.max`

---

## Design Guidelines

- **Touch targets**: minimum 64px (`TOUCH_TARGET.recommended`) — kids need large tap areas
- **Font sizes**: use `FONT_SIZES` constants — they're already sized for young children
- **Colors**: pick from `COLORS` palette tokens
- **Spacing**: use `SPACING` constants (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`)

---

## Checklist

- [ ] Folder created from `src/games/_template`
- [ ] Unique kebab-case `id` set in `config.ts`
- [ ] `name`, `description`, `icon`, `backgroundColor`, `ageRange` all filled in
- [ ] Game component imports only from `@/sdk`
- [ ] Sounds played by intent via `useSound` (`play('pop')`, etc.)
- [ ] Layout mode chosen (`shell` or `bare`)
- [ ] `locales/en.ts` + `locales/ar.ts` created (incl. `meta.name`/`meta.description`); every string via `t()`
- [ ] Arabic meaningful & kid-friendly (not literal MT); RTL handled (start/end, flipped glyphs/emoji)
- [ ] `import './i18n'` in `config.ts`; game keys added to `src/sdk/i18n/__tests__/keys.test.ts`
- [ ] Side-effect import added in `src/games/index.ts`
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm test` — all tests pass
