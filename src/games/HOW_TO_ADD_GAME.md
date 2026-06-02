# How to Add a New Game

Games are self-contained folders under `src/games/`. Every game imports exclusively from `@/sdk` — never from another game's folder or deep `src/` paths.

## Quick Start

### 1. Copy the template

```bash
cp -r src/games/_template src/games/my-game
```

Use a kebab-case name (`a-z`, `0-9`, hyphens only).

### 2. Update `config.ts`

```ts
import { registerGame } from '@/sdk';
import MyGame from './index';

registerGame({
  id: 'my-game',              // unique kebab-case id
  name: 'My Game',            // shown on home screen card
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

Import everything from `@/sdk`:

```ts
import { useSound, useGameShell, COLORS, FONT_SIZES, SPACING } from '@/sdk';
```

### 4. Register the game

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
├── config.ts        # Metadata + registerGame() call
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
- [ ] Side-effect import added in `src/games/index.ts`
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm test` — all tests pass
