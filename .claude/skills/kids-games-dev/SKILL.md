---
name: kids-games-dev
description: Use when adding or modifying a game in this Kids Games repo — scaffolding a new game, wiring sound/storage/layout/i18n via the SDK, picking audio/visual assets, or adding/editing any user-facing text. Covers the @/sdk contract, the asset tag vocabulary, age bands, the game config schema, and the English+Arabic/RTL translation contract.
---

# kids-games-dev

This skill covers how to build, scaffold, and extend games in the Kids Games Expo React Native app using the SDK platform core.

> **The app is multilingual (English + Arabic, full RTL). No user-facing string may be hardcoded** — every label/title/placeholder/`accessibilityLabel`/`<Text>` goes through `t()`, and every game ships `en` + `ar` locale bundles. This applies to NEW games and to EDITS that add or change any visible text. See **§7 Internationalization** — it is not optional.

## 1. The SDK contract

**Games import ONLY from `@/sdk`.** Never reach into another game's folder or into deep `src/` paths (e.g. `@/sdk/audio/useSound` or `../../components/common`). The stable public surface is `src/sdk/index.ts`.

### Full exported surface (grouped)

**Config & registry**
- `registerGame(config)` — validate + add a GameConfig to the central registry
- `getGame(id)` — look up a registered game by id
- `getAllGames()` — all registered games
- `getGamesForAge(age)` — games whose ageRange includes the given age
- `validateGameConfig(config)` — explicit validation (also runs inside registerGame)
- `GameConfig` (type) — the game metadata + component shape (see §6)
- `GameRegistry` (type) — `Record<string, GameConfig>`

**Layout**
- `GameShell` — default shell component (title bar + back button + overlay slots)
- `GameOverlay` — the animated overlay container used internally by GameShell
- `useGameShell()` — hook returning `GameShellApi`: `{ setScore, showOverlay, hideOverlay }`
- `GameShellApi` (type) — the API shape returned by useGameShell
- `GameShellProps` (type) — props accepted by GameShell
- `OverlaySlot` (type) — `'loading' | 'win' | 'pause' | 'error'`

**Audio**
- `useSound()` — hook returning `{ play(intent, options?) }`. Plays the best-match asset for a string intent. Respects `soundEnabled` setting. Triggers haptics if `hapticsEnabled` is true and `options.haptic !== false`.
- `PlayOptions` (type) — `{ haptic?: boolean }`

**Storage**
- `createStore<T>(namespace, defaultValue)` — create a typed AsyncStorage-backed store with `get()`, `set(value)`, `subscribe(fn)` API
- `Store<T>` (type) — the store interface

**Settings**
- `useSettings()` — React hook: `{ settings: Settings, update(patch) }`. Syncs live with the store.
- `settingsStore` — the raw store instance for Settings (use outside React)
- `DEFAULT_SETTINGS` — the default Settings object
- `Settings` (type) — `{ soundEnabled: boolean, hapticsEnabled: boolean, ageBand: string | null, language: string | null }`

**i18n** (see §7 for the full contract)
- `useTranslation()` — react-i18next hook returning `{ t }`. Call `t('<namespace>:section.key')`. Core (screen) strings use the default `core` namespace, so screens call `t('home.title')` without a prefix; games use their own namespace, e.g. `t('color-mixer:title')`.
- `registerTranslations(namespace, { en, ar })` — register a game's locale bundles (mirrors `registerGame`). Call from a per-game `i18n.ts` side-effect.
- `useLanguage()` — `{ language, meta, changeLanguage(code) }`. The Settings screen uses this; games rarely need it.
- `gameName(config)` / `gameDescription(config)` — resolve a game's localized name/description (`<id>:meta.name`/`meta.description`, falling back to the config English). Home tile + header use these — you don't call them, but you MUST register the `meta.*` keys.
- `LANGUAGES`, `DEFAULT_LANGUAGE`, `languageMeta`, `isRTL`, `LanguageCode` (type) — language metadata + RTL helper.
- `i18n` — the shared i18next instance (rarely needed directly).
- `Trans` — react-i18next component for rich/embedded markup (rarely needed).

**Age**
- `AGE_BANDS` — `readonly AgeBand[]` — the four defined bands (see §5)
- `bandsForGame(config)` — derive which band ids a game belongs to from its ageRange (or explicit `bands` override)
- `gamesForBand(bandId)` — all registered games that fall in a given band
- `AgeBand` (type) — `{ id: string, label: string, min: number, max: number }`

**Assets**
- `ASSETS` — the typed asset manifest (keyed by `AssetId`)
- `AssetId` (type) — union of all manifest keys (`'sfx.pop' | 'sfx.success' | 'sfx.win' | 'sfx.wrong' | 'sfx.powerup' | 'sfx.jump' | 'sfx.transition' | 'sfx.explosion' | 'sfx.hit' | 'sfx.laser' | 'sfx.random'`)
- `getAsset(id)` — look up a manifest entry by id
- `findAssets({ type?, tags? })` — filter manifest by type and/or tag array
- `pickAsset(intent)` — return the first AssetId whose tags include the given intent string
- `pickModule(intent)` — resolve an intent to a **random variant module** from the matching asset (used by useSound internally); `undefined` for an unknown intent
- `AssetEntry` (type) — `{ modules: number[], type: AssetType, tags: readonly string[] }` — `modules` is a list of interchangeable variants played at random
- `AssetType` (type) — `'audio'` (currently; images will be added here)

**Design tokens** (warm cream design system, ported from `design/tokens.css`)
- `COLORS` — palette: `canvas`/`surface`, `ink`/`inkSoft`/`inkFaint`, `brand`/`brandDeep`/`brandTint`, `gold`, plus backward-compatible `primary`/`background`/`text` groups
- `ACCENTS` — per-game accent families (`green`/`orange`/`coral`/`purple`/`blue`/`pink`), each `{ base, deep, tint }`; `AccentName` (type)
- `SPACING` — spacing scale (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`)
- `BORDER_RADIUS` — radii incl. `tile`/`card`/`btn`/`pill`
- `TOUCH_TARGET` — touch target sizes (`recommended` = 64)
- `FONT_SIZES` — font size scale (`sm`, `md`, `lg`, `xl`, `xxl`)
- `SHADOWS` — soft warm RN shadow fragments (`sm`/`md`/`lg`) — spread into a style, don't hand-roll shadows
- `FONTS` — font families: `display`/`displayBold`/`displayMedium` (headings/buttons), `body`/`bodySemi`/`bodyExtra` (body text); loaded in `App.tsx`. **Language-aware:** resolves to Fredoka/Nunito in LTR and IBM Plex Sans Arabic in RTL automatically — just use `FONTS.display` etc. as always; never hardcode a font-family string.

**UI primitives** — build UI from these; never hardcode hex/system-fonts/ad-hoc buttons
- `PressableButton` — the chunky tactile CTA (solid bottom edge that compresses). Props: `label`/`children`, `accent?`, `color?`, `variant?: 'solid'|'ghost'`, `align?`. The default button.
- `BigButton` — thin `title`/`onPress` wrapper over `PressableButton` (accepts `accent` or `color`)
- `IconButton` — circular surface control (`glyph`, `glyphSize?`); `AppBar` — header (back · centered title · `right` slot)
- `Chip` — pill filter (`label`, `active`); `HudPill` + `hudTextStyle` — in-game counters
- `EmojiFrame` — tinted rounded emoji frame; `Star` — gold star (`filled`, `size`)
- `GameCard` — home tile (`accent`, `ageLabel`, `tag?`); `BackButton`, `SafeContainer`

**Design-system rule:** set `accent: AccentName` in the game config; theme buttons/cards/cards from it. Use `FONTS.display` on headings/buttons, `FONTS.body*` on copy. Reach for `SHADOWS.*` and `ACCENTS`/`COLORS` — not inline shadows or raw hex.

---

## 2. Scaffold a new game

1. **Copy the template folder:**
   ```bash
   cp -r src/games/_template src/games/<your-id>
   ```
   Use a kebab-case id (lowercase letters, digits, hyphens only — e.g. `word-match`).

2. **Edit `src/games/<your-id>/config.ts`** (note the `import './i18n'` on the first line — see step 3):
   ```ts
   import './i18n'; // side-effect: registers this game's en/ar translation bundles
   import { registerGame } from '@/sdk';
   import MyGame from './index';

   registerGame({
     id: 'word-match',
     name: 'Word Match',           // English fallback; localized via <id>:meta.name
     description: 'Match letters to form words.', // English fallback
     icon: '🔤',
     ageRange: { min: 4, max: 7 },
     component: MyGame,
     backgroundColor: '#E8F4FD',
     // optional enrichment:
     accent: 'blue', // design-system accent (AccentName) for the home tile
     tags: ['letters', 'spelling'],
     version: '1.0.0',
     author: 'Your Name',
     layout: { mode: 'shell' }, // or 'bare' — see §4
   });
   ```
   `registerGame` calls `validateGameConfig` internally and throws on invalid config.

3. **Add the game's translations** — create three files (full contract in §7):
   - `src/games/<your-id>/locales/en.ts` — `export const en = { meta: { name, description }, ... } as const;` + the `GameTranslations` type.
   - `src/games/<your-id>/locales/ar.ts` — `export const ar: GameTranslations = { ... };` (Arabic).
   - `src/games/<your-id>/i18n.ts` — `registerTranslations('<your-id>', { en, ar });`

4. **Build your game component in `src/games/<your-id>/index.tsx`**, importing only from `@/sdk` and React Native. Pull in `useTranslation` and route every visible string through `t()`:
   ```ts
   import { useSound, useGameShell, useTranslation, COLORS, FONT_SIZES } from '@/sdk';
   // const { t } = useTranslation();  →  <Text>{t('word-match:title')}</Text>
   ```

5. **Register the game** by adding a side-effect import to `src/games/index.ts`:
   ```ts
   import './<your-id>/config';
   ```
   The game now appears on the home screen. (No separate i18n import here — `config.ts` already pulls in `./i18n`.)

6. **Typecheck:** `npx tsc --noEmit`

7. **Test:** `npm test` (includes the i18n key-resolution guard — see §7).

> Note: `_template` itself is NOT imported in `src/games/index.ts` — it is a scaffold reference only. The `template-game` id is reserved for it.

---

## 3. Picking assets

All shared assets live in `src/sdk/assets/`. Never create per-game asset folders for shared sounds.

### Playing a sound by intent (recommended)

```ts
const { play } = useSound();
play('pop');       // card flip, tap, UI feedback
play('success');   // match found, correct answer
play('win');       // game won, level complete
play('wrong');     // mismatch, wrong answer
play('powerup');   // power-up / boost collected
play('jump');      // jump / hop / bounce
play('transition');// scene change / next round whoosh
play('explosion'); // pop a balloon, blast a target, destroy
play('hit');       // bump / collision / take damage
play('laser');     // shoot / zap / fire a projectile
play('random');    // misc / surprise blip
```

`useSound` calls `pickModule(intent)` internally: it resolves the intent to an asset, then plays a **random variant** from that asset's `modules` list, so repeated taps/matches don't sound identical. You never reference asset ids or files directly for audio.

### The controlled tag vocabulary (from manifest.ts)

All audio is from the 8-bit "Sound Effects Mini Pack 1.5" — kid-friendly chiptune SFX. Each intent below carries **5 interchangeable variants** that are picked at random on play.

| Asset id        | Tags                                            | Meaning |
|-----------------|-------------------------------------------------|---------|
| `sfx.pop`       | `pop`, `flip`, `tap`, `ui`, `select`            | Card flip, tapping, generic UI |
| `sfx.success`   | `success`, `match`, `reward`, `correct`, `collect` | Match found, correct answer, coin/item collected |
| `sfx.win`       | `win`, `celebration`, `complete`, `levelup`     | Game won, round complete (1-up jingle) |
| `sfx.wrong`     | `wrong`, `mismatch`, `error`, `incorrect`, `lose` | Mismatch, wrong choice |
| `sfx.powerup`   | `powerup`, `boost`, `upgrade`                   | Power-up / boost collected |
| `sfx.jump`      | `jump`, `hop`, `bounce`                         | Jumping / hopping action |
| `sfx.transition`| `transition`, `teleport`, `whoosh`, `appear`, `next` | Scene change, next round, teleport |
| `sfx.explosion` | `explosion`, `blast`, `boom`, `destroy`, `pop-big` | Pop a balloon, blast/destroy a target |
| `sfx.hit`       | `hit`, `bump`, `thud`, `hurt`, `damage`         | Collision, bump, taking damage |
| `sfx.laser`     | `laser`, `shoot`, `zap`, `fire`, `beam`         | Shooting / firing a projectile |
| `sfx.random`    | `random`, `misc`, `surprise`, `blip-alt`        | Miscellaneous / surprise blip |

**Intent lookup:** pass any tag as the intent string to `play()` or `pickAsset()`. For example, `play('match')` resolves to `sfx.success` because `match` is in its tags. An unknown intent plays nothing (silent, no error).

**Picking the right sound:** prefer the four core intents (`pop`/`success`/`win`/`wrong`) for standard match/quiz feedback. Reach for `powerup`, `jump`, `transition`, `explosion`, `hit`, `laser`, or `random` only when the game genuinely has that mechanic. Always reuse an existing tagged asset before adding a new file.

### Finding assets programmatically

```ts
import { findAssets, getAsset } from '@/sdk';

const audioIds = findAssets({ type: 'audio' });
const matchSounds = findAssets({ tags: ['match'] });
const entry = getAsset('sfx.pop');
```

### Adding a new asset

1. Drop the file(s) into `src/sdk/assets/<type>/` (e.g. `src/sdk/assets/audio/MySfx.wav`).
2. Add a tagged entry to `src/sdk/assets/manifest.ts`. `modules` is a list of interchangeable variants — list every variant file you want randomized (one entry is fine too):
   ```ts
   'sfx.bounce': {
     modules: [
       require('./audio/MySfx.wav'),
       require('./audio/MySfx1.wav'),
     ],
     type: 'audio',
     tags: ['bounce', 'jump'],
   },
   ```
3. **Always prefer reusing an existing tagged asset** before adding a new file.

---

## 4. Layout decisions

### Default shell mode (no `layout` in config, or `layout: { mode: 'shell' }`)

`GamePlayerScreen` wraps the game in `GameShell`, which provides:
- A title bar (top row with game name, optional score, optional pause button)
- An absolutely-positioned `BackButton` (top-left)
- Overlay slots for win/pause/loading/error screens

Inside the game component, use `useGameShell()` to control the shell:

```ts
const { setScore, showOverlay, hideOverlay } = useGameShell();

setScore(42);                          // show score in header
showOverlay('win', <WinScreen />);     // show a full-screen overlay
showOverlay('pause', <PauseMenu />);
showOverlay('loading', <Spinner />);
showOverlay('error', <ErrorView />);
hideOverlay('win');                    // dismiss the overlay
```

`OverlaySlot` priority order (highest to lowest): `error` → `pause` → `win` → `loading`.

`GameShellProps` also accepts optional `header` (extra header slot content), `onPause` (shows pause button), and `onBack` (custom back handler).

### Bare mode (`layout: { mode: 'bare' }`)

For games that need full-canvas control (custom backgrounds, animations that span the whole screen):

```ts
registerGame({
  ...
  layout: { mode: 'bare' },
});
```

`GamePlayerScreen` renders only an absolute `BackButton` over the game's root `View`. The game is responsible for its own safe-area handling, title, and overlay UI.

**Existing examples using bare mode:** `simple-pairs` and `color-mixer`.

---

## 4b. Levels & progress (opt-in)

For games with levels that should resume where the child left off, use the progress SDK. It is fully opt-in — sandbox games (e.g. color-mixer) don't need it.

**Define a level source** (authored or generated — both satisfy `LevelSource<T>`):

```ts
import { levelsFromList, levelsFromGenerator } from '@/sdk';

// authored, fixed levels
const source = levelsFromList([{ words: ['cat'] }, { words: ['dog', 'sun'] }]);

// runtime-generated, endless, following a difficulty curve
const source = useMemo(() => levelsFromGenerator((level) => buildLevel(level)), []);
```

> Always `useMemo` the source so its identity is stable (the hook memoizes level data on it).

**Drive the game with `useLevels`:**

```ts
import { useLevels, ResumePrompt } from '@/sdk';

const { status, data, level, score, isLast, start, startOver, advance } =
  useLevels({ gameId: 'my-game', source });

if (status === 'resumable')
  return <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />;

// data === source.get(level); when the level is cleared:
advance(starsEarned); // → next level, score persisted under kg:progress:my-game
```

- `status`: `'loading' | 'resumable' | 'playing'`. Render `<ResumePrompt>` on `'resumable'`.
- Persistence is a coarse checkpoint (`{ level, score }`) — the level restarts from its beginning, not a mid-level snapshot.
- `isLast` is `true` on the final level of a finite source (always `false` for endless generators).
- Reference integration: `src/games/mouse-maze`.

---

## 5. Age bands

Always set `ageRange: { min, max }` in the config — this is required. Age bands are derived automatically from it.

```
AGE_BANDS:
  toddler  — Toddler     ages 2–3
  preschool — Preschool  ages 3–5
  early    — Early years ages 5–7
  kids     — Big kids    ages 7–10
```

A game whose `ageRange` overlaps a band appears in that band's filter. To override derived bands, set `bands: ['preschool', 'early']` explicitly — this takes priority over the automatic overlap logic.

---

## 6. Config schema and validation rules

### Required fields (validateGameConfig will throw if missing)

| Field | Type | Rule |
|-------|------|------|
| `id` | `string` | Kebab-case: `/^[a-z0-9]+(-[a-z0-9]+)*$/` |
| `name` | `string` | Non-empty |
| `description` | `string` | Non-empty |
| `icon` | `string` | Non-empty (typically an emoji) |
| `backgroundColor` | `string` | Non-empty (CSS/RN color string) |
| `component` | `ComponentType` | Must be a function |
| `ageRange` | `{ min: number, max: number }` | `min <= max` |

### Optional enrichment fields

| Field | Type | Purpose |
|-------|------|---------|
| `accent` | `AccentName` | Design-system accent for the home tile + themable controls (falls back to a derived accent) |
| `tags` | `string[]` | Searchable tags |
| `layout` | `GameLayoutOptions` | `mode: 'shell'|'bare'`, `title`, `showBack` |
| `bands` | `string[]` | Override auto-derived age bands |
| `version` | `string` | Semver string |
| `author` | `string` | Game author name |

---

## 7. Internationalization (English + Arabic, full RTL) — REQUIRED

The app ships in English and Arabic, with full RTL layout mirroring for Arabic. **Every user-facing string must go through `t()`, and every game owns its own `en` + `ar` bundles.** This applies to new games AND to any edit that adds or changes visible text. (Keep emoji and asset-intent strings literal — those are not translated.)

### Per-game ownership (no shared catalog)

Each game registers its strings under **its own namespace = the game `id`**, from a side-effect module. This is why parallel work never collides — you only touch your own game folder. Never add per-game strings to the core locale files (`src/sdk/i18n/locales/`).

**`locales/en.ts`** — the source of truth for keys. Export a `const … as const` plus the structural type:
```ts
export const en = {
  meta: { name: 'Word Match', description: 'Match letters to form words.' },
  title: 'Word Match',
  // group keys however you like; every leaf is a string
  win: { title: 'You did it!', playAgain: 'Play again' },
  // interpolation: use {{var}} so word order can differ across languages
  score: 'Score: {{n}}',
} as const;

// Structural type: forces ar.ts to have the SAME keys without locking VALUES.
type T<X> = { [K in keyof X]: X[K] extends string ? string : T<X[K]> };
export type GameTranslations = T<typeof en>;
```

**`locales/ar.ts`** — typed against `GameTranslations` so TS fails the build if a key is missing:
```ts
import type { GameTranslations } from './en';
export const ar: GameTranslations = {
  meta: { name: 'مطابقة الكلمات', description: 'طابق الحروف لتكوّن كلمات' },
  title: 'مطابقة الكلمات',
  win: { title: 'أحسنت!', playAgain: 'العب مرة ثانية' },
  score: 'النقاط: {{n}}',
};
```

**`i18n.ts`** — registers both bundles; imported from `config.ts` (step 2 above):
```ts
import { registerTranslations } from '@/sdk';
import { en } from './locales/en';
import { ar } from './locales/ar';
registerTranslations('word-match', { en, ar });
```

### Using `t()` in components

```ts
const { t } = useTranslation();
<Text>{t('word-match:title')}</Text>
<PressableButton label={t('word-match:win.playAgain')} … />
<IconButton accessibilityLabel={t('word-match:hint')} … />
// interpolation:
<Text>{t('word-match:score', { n: score })}</Text>
// dynamic key families (e.g. per-item names) are fine — just make sure every
// possible key exists in the locale: t(`word-match:colors.${colorId}`)
```

Register `meta.name` and `meta.description` — the home tile (`gameName`) and game header (`gameDescription`) resolve through them. `name`/`description` in `config.ts` stay as the English fallback.

### Writing good Arabic

- **Meaningful, not literal/machine translation.** Warm, playful, simple words a child understands. Match the English's tone, not its word order.
- **Use the natural Arabic name for the game type**, not a calque. (E.g. a memory/card-matching game is "الذاكرة" + "مطابقة", never زوج/أزواج which means "spouse" — research the conventional term if unsure.)
- **Western digits** for numbers/scores (they come from `{{var}}` interpolation, so this is automatic).
- Use simple MSA — the right pan-Arab register for a kids' educational app; don't colloquialize.
- For gender-neutral messages to a child (e.g. "You did it!"), prefer forms that read naturally for any child.

### RTL rules (Arabic mirrors the whole layout)

`forceRTL` flips flex-direction layout automatically, but does **NOT** mirror these — handle them yourself:
- **Absolute positioning:** use `start`/`end`, never `left`/`right`. (`left: 16` stays on the physical left under RTL; `start: 16` mirrors.)
- **Directional glyphs** (`←`/`→`/`‹`/`›`/`↩️`): flip them with `I18nManager.isRTL`, e.g. `const BACK = I18nManager.isRTL ? '›' : '‹';`.
- **Emoji that face a direction** (🏹, etc.) and **drawn shapes** (border-triangle arrowheads, etc.): RN doesn't mirror these. Apply `transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }, …]` (scaleX outermost) so they face the mirrored flight/aim direction. (See `balloon-archer`'s `Archer.tsx`/`Arrow.tsx`.)
- **Coordinate / physics / grid math:** if a bare game computes positions from screen width assuming a left origin, pin the whole playfield to one frame with `direction: 'ltr'` on the board container so gameplay coords stay aligned (see `mouse-maze`), OR confirm the math is symmetric. Don't half-mirror.
- **Number/sequence rows** that must read LTR regardless: pin with `direction: 'ltr'`.

### Fonts

`FONTS.*` is already language-aware (Latin in LTR, IBM Plex Sans Arabic in RTL). Just use `FONTS.display` etc. — never hardcode a family. Don't gate UI on `i18n.language` at module load (it isn't set yet); use `I18nManager.isRTL`, which is correct synchronously.

### SDK-internal components (rare)

If you edit a shared component under `src/components/common/` or `src/sdk/` that needs `t()`, import `useTranslation` **directly from `react-i18next`**, NOT from `@/sdk` — those files are re-exported by the barrel and importing it back creates a cycle (left `IconButton` undefined and crashed at runtime). Game code always imports from `@/sdk`.

### Verify

`src/sdk/i18n/__tests__/keys.test.ts` asserts every requested key resolves (≠ the raw key) in both languages — `returnNull:false` means a typo'd/missing key renders silently as the key string. **Add your game's keys to its `KEYS` list** (especially dynamic-key families) so a missing translation fails CI instead of shipping. Run `npm test`.

---

## 8. Add-a-game checklist

Copy and paste this into your PR description or working notes:

```
[ ] Copy src/games/_template to src/games/<id>/
[ ] Set unique kebab-case id (no reuse of existing ids)
[ ] Fill in name, description, icon, backgroundColor, ageRange
[ ] Import only from @/sdk (never from another game or deep src/ paths)
[ ] Pick sounds by intent: play('pop'), play('success'), play('win'), play('wrong')
[ ] Choose layout mode: omit for shell (default), set layout: { mode: 'bare' } for full-canvas
[ ] If using shell mode, use useGameShell() for setScore / showOverlay / hideOverlay
[ ] i18n: create locales/en.ts (+ GameTranslations type), locales/ar.ts, i18n.ts (§7)
[ ] i18n: register meta.name + meta.description; route EVERY string through t()
[ ] i18n: write meaningful kid-friendly Arabic (not literal MT); Western digits
[ ] i18n: add `import './i18n';` as the first line of config.ts
[ ] RTL: absolute left/right -> start/end; flip directional glyphs/emoji via I18nManager.isRTL
[ ] RTL: pin/verify any coordinate or grid math in bare games
[ ] i18n: add the game's keys to src/sdk/i18n/__tests__/keys.test.ts
[ ] Add side-effect import in src/games/index.ts: import './<id>/config';
[ ] npx tsc --noEmit — no type errors
[ ] npm test — all tests pass
```
