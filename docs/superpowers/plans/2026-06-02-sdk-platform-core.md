# Kids Games SDK Platform Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a thin "Game SDK" platform core (`src/sdk/`) that games consume through one stable import surface, with shared layout, asset registry, audio/haptics, persistence, age bands, config validation, parental settings, and an AI skill.

**Architecture:** A `src/sdk/` barrel re-exports every shared capability. Games depend only on `@/sdk` (the plugin contract), never on each other or deep `src/` paths. Existing games migrate onto the SDK as proof it works.

**Tech Stack:** Expo SDK 54, React 19, React Native 0.81, TypeScript (strict), `@react-native-async-storage/async-storage`, `expo-av`, `expo-haptics` (new), `jest-expo` (new, dev).

---

## File Structure

```
src/sdk/
  index.ts                  barrel — single import surface
  config/
    types.ts                GameConfig (+ enrichment), GameLayoutOptions
    validate.ts             validateGameConfig
    registry.ts             registerGame/getGame/getAllGames/getGamesForAge (moved here)
  assets/
    audio/                  moved .wav files
    manifest.ts             ASSETS registry (typed, tagged)
    query.ts                getAsset / findAssets / pickAsset
    types.ts                AssetEntry, AssetType
  audio/
    useSound.ts             sound + haptics service hook
  storage/
    createStore.ts          typed namespaced AsyncStorage wrapper
  settings/
    store.ts                settings store (sound/haptics/ageBand) + useSettings
  age/
    bands.ts                AGE_BANDS + bandsForGame/gamesForBand
  layout/
    GameShell.tsx           unified shell
    GameOverlay.tsx         overlay primitive
    GameShellContext.tsx    useGameShell context
    types.ts                layout prop types

.claude/skills/kids-games-dev/SKILL.md   AI skill
```

Tests live next to code under `src/sdk/**/__tests__/*.test.ts`.

---

## Phase 0 — Tooling foundation

### Task 0.1: Set up Jest (jest-expo)

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `src/sdk/__tests__/smoke.test.ts`

- [ ] **Step 1: Install jest-expo and testing deps**

Run:
```bash
npx expo install -- --save-dev jest-expo jest @types/jest
```
Expected: devDependencies gain `jest-expo`, `jest`, `@types/jest`. (If `npx expo install` rejects the `--` passthrough, fall back to `npm install --save-dev jest-expo jest @types/jest`.)

- [ ] **Step 2: Add test script to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "jest"
```

- [ ] **Step 3: Create jest.config.js**

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/sdk$': '<rootDir>/src/sdk/index.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-async-storage/.*))',
  ],
};
```

- [ ] **Step 4: Create jest.setup.js with AsyncStorage mock**

```js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

- [ ] **Step 5: Write a smoke test**

`src/sdk/__tests__/smoke.test.ts`:
```ts
describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test**

Run: `npm test -- smoke`
Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.config.js jest.setup.js src/sdk/__tests__/smoke.test.ts
git commit -m "chore: set up jest-expo test harness"
```

### Task 0.2: Configure `@/*` path alias

**Files:**
- Modify: `tsconfig.json`
- Create: `src/sdk/index.ts`
- Create: `src/sdk/__tests__/alias.test.ts`

- [ ] **Step 1: Add paths to tsconfig.json**

Replace the file contents with:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/sdk": ["src/sdk/index.ts"],
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 2: Create a temporary SDK barrel**

`src/sdk/index.ts`:
```ts
// SDK barrel — single import surface for games. Populated across the plan.
export const SDK_VERSION = '0.1.0';
```

- [ ] **Step 3: Write a test that imports via the alias**

`src/sdk/__tests__/alias.test.ts`:
```ts
import { SDK_VERSION } from '@/sdk';

it('resolves the @/sdk alias', () => {
  expect(SDK_VERSION).toBe('0.1.0');
});
```

- [ ] **Step 4: Run the alias test**

Run: `npm test -- alias`
Expected: PASS (confirms Jest moduleNameMapper works).

- [ ] **Step 5: Verify Metro resolves the alias at runtime**

Run: `npx tsc --noEmit`
Expected: no errors. Then run `npx expo start` briefly and confirm the bundler starts without "Unable to resolve @/sdk". If Metro fails to resolve, create `metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
module.exports = config;
```
(SDK 54 enables `tsconfigPaths` by default; this fallback is only if resolution fails.)

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json src/sdk/index.ts src/sdk/__tests__/alias.test.ts
git commit -m "chore: add @/sdk path alias"
```

---

## Phase 1 — Config, validation, registry

### Task 1.1: SDK config types

**Files:**
- Create: `src/sdk/config/types.ts`

- [ ] **Step 1: Write the config types**

`src/sdk/config/types.ts`:
```ts
import type { ComponentType } from 'react';

export type GameLayoutOptions = {
  /** 'shell' (default) wraps the game in GameShell; 'bare' gives a raw safe-area canvas. */
  mode?: 'shell' | 'bare';
  /** Override the header title (defaults to game name). */
  title?: string;
  /** Hide the back button (default: shown). */
  showBack?: boolean;
};

export type GameConfig = {
  id: string;
  name: string;
  description: string;
  icon: string;
  ageRange: { min: number; max: number };
  component: ComponentType;
  backgroundColor: string;
  // Optional, backward-compatible enrichment:
  tags?: string[];
  layout?: GameLayoutOptions;
  bands?: string[];
  version?: string;
  author?: string;
};

export type GameRegistry = Record<string, GameConfig>;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sdk/config/types.ts
git commit -m "feat: add SDK game config types"
```

### Task 1.2: validateGameConfig (TDD)

**Files:**
- Create: `src/sdk/config/validate.ts`
- Test: `src/sdk/config/__tests__/validate.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/sdk/config/__tests__/validate.test.ts`:
```ts
import { validateGameConfig } from '../validate';
import type { GameConfig } from '../types';

const valid: GameConfig = {
  id: 'demo-game',
  name: 'Demo',
  description: 'A demo',
  icon: '🎮',
  ageRange: { min: 3, max: 6 },
  component: () => null,
  backgroundColor: '#fff',
};

describe('validateGameConfig', () => {
  it('accepts a valid config', () => {
    expect(() => validateGameConfig(valid)).not.toThrow();
  });

  it('rejects a missing id', () => {
    expect(() => validateGameConfig({ ...valid, id: '' })).toThrow(/id/);
  });

  it('rejects an invalid id format', () => {
    expect(() => validateGameConfig({ ...valid, id: 'Bad Id!' })).toThrow(/id/);
  });

  it('rejects ageRange where min > max', () => {
    expect(() => validateGameConfig({ ...valid, ageRange: { min: 8, max: 3 } })).toThrow(/ageRange/);
  });

  it('rejects a missing component', () => {
    expect(() => validateGameConfig({ ...valid, component: undefined as never })).toThrow(/component/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- validate`
Expected: FAIL ("Cannot find module '../validate'").

- [ ] **Step 3: Implement validateGameConfig**

`src/sdk/config/validate.ts`:
```ts
import type { GameConfig } from './types';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateGameConfig(config: GameConfig): void {
  const fail = (msg: string): never => {
    throw new Error(`Invalid game config: ${msg}`);
  };

  if (!config.id || typeof config.id !== 'string') fail('id is required');
  if (!ID_RE.test(config.id)) fail(`id "${config.id}" must be kebab-case (a-z, 0-9, hyphens)`);
  if (!config.name) fail(`id "${config.id}": name is required`);
  if (!config.description) fail(`id "${config.id}": description is required`);
  if (!config.icon) fail(`id "${config.id}": icon is required`);
  if (!config.backgroundColor) fail(`id "${config.id}": backgroundColor is required`);
  if (typeof config.component !== 'function') fail(`id "${config.id}": component is required`);

  const { ageRange } = config;
  if (!ageRange || typeof ageRange.min !== 'number' || typeof ageRange.max !== 'number') {
    fail(`id "${config.id}": ageRange { min, max } is required`);
  } else if (ageRange.min > ageRange.max) {
    fail(`id "${config.id}": ageRange.min (${ageRange.min}) must be <= ageRange.max (${ageRange.max})`);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- validate`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/config/validate.ts src/sdk/config/__tests__/validate.test.ts
git commit -m "feat: add game config validation"
```

### Task 1.3: Move registry into SDK + validate on register

**Files:**
- Create: `src/sdk/config/registry.ts`
- Test: `src/sdk/config/__tests__/registry.test.ts`
- Modify: `src/games/registry.ts` (re-export shim), `src/games/index.ts` (no change yet), `src/screens/GamePlayerScreen.tsx`, `src/screens/HomeScreen.tsx`
- Delete (later): old registry body

- [ ] **Step 1: Write the failing test**

`src/sdk/config/__tests__/registry.test.ts`:
```ts
import { registerGame, getGame, getAllGames, getGamesForAge, _resetRegistry } from '../registry';
import type { GameConfig } from '../types';

const make = (id: string, min: number, max: number): GameConfig => ({
  id, name: id, description: 'x', icon: '🎮',
  ageRange: { min, max }, component: () => null, backgroundColor: '#fff',
});

describe('registry', () => {
  beforeEach(() => _resetRegistry());

  it('registers and retrieves a game', () => {
    registerGame(make('a', 3, 6));
    expect(getGame('a')?.id).toBe('a');
    expect(getAllGames()).toHaveLength(1);
  });

  it('throws on invalid config', () => {
    expect(() => registerGame(make('Bad Id', 3, 6))).toThrow(/id/);
  });

  it('throws on duplicate id', () => {
    registerGame(make('a', 3, 6));
    expect(() => registerGame(make('a', 3, 6))).toThrow(/duplicate/i);
  });

  it('filters by age', () => {
    registerGame(make('a', 3, 6));
    registerGame(make('b', 7, 10));
    expect(getGamesForAge(4).map((g) => g.id)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- registry`
Expected: FAIL ("Cannot find module '../registry'").

- [ ] **Step 3: Implement the registry**

`src/sdk/config/registry.ts`:
```ts
import type { GameConfig, GameRegistry } from './types';
import { validateGameConfig } from './validate';

const registry: GameRegistry = {};

export function registerGame(config: GameConfig): GameRegistry {
  validateGameConfig(config);
  if (registry[config.id]) {
    throw new Error(`Invalid game config: duplicate id "${config.id}"`);
  }
  registry[config.id] = config;
  return registry;
}

export function getGame(id: string): GameConfig | undefined {
  return registry[id];
}

export function getAllGames(): GameConfig[] {
  return Object.values(registry);
}

export function getGamesForAge(age: number): GameConfig[] {
  return Object.values(registry).filter(
    (game) => age >= game.ageRange.min && age <= game.ageRange.max
  );
}

/** Test-only: clears the registry between tests. */
export function _resetRegistry(): void {
  for (const key of Object.keys(registry)) delete registry[key];
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- registry`
Expected: PASS, 4 tests.

- [ ] **Step 5: Turn the old registry into a re-export shim**

Replace `src/games/registry.ts` contents with:
```ts
// Moved into the SDK. Kept as a shim so existing imports keep working.
export { registerGame, getGame, getAllGames, getGamesForAge } from '@/sdk/config/registry';
export type { GameConfig, GameRegistry } from '@/sdk/config/types';
```

- [ ] **Step 6: Point screens at the SDK type source**

In `src/screens/GamePlayerScreen.tsx`, the `getGame` import from `'../games/registry'` still works via the shim — no change needed. Confirm `HomeScreen.tsx` likewise imports from `'../games/registry'` and still resolves.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/sdk/config/registry.ts src/sdk/config/__tests__/registry.test.ts src/games/registry.ts
git commit -m "feat: move game registry into SDK with validation"
```

### Task 1.4: Update the SDK barrel (config + tokens)

**Files:**
- Modify: `src/sdk/index.ts`

- [ ] **Step 1: Export config + design tokens from the barrel**

Replace `src/sdk/index.ts` with:
```ts
// SDK barrel — single import surface for games.
export const SDK_VERSION = '0.1.0';

// Config & registry
export * from './config/types';
export { registerGame, getGame, getAllGames, getGamesForAge } from './config/registry';
export { validateGameConfig } from './config/validate';

// Design tokens (re-exported so games have one surface)
export { COLORS } from '@/constants/colors';
export { SPACING, BORDER_RADIUS, TOUCH_TARGET, FONT_SIZES } from '@/constants/dimensions';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sdk/index.ts
git commit -m "feat: export config and tokens from SDK barrel"
```

---

## Phase 2 — Assets, audio, storage

### Task 2.1: Move audio assets into the SDK

**Files:**
- Move: `src/games/assets/*.wav` → `src/sdk/assets/audio/`
- Delete: `src/games/assets/Sound effects Mini Pack1.5.zip`

- [ ] **Step 1: Move the wav files and delete the zip**

Run:
```bash
mkdir -p src/sdk/assets/audio
git mv "src/games/assets/Blip1.wav" src/sdk/assets/audio/Blip1.wav
git mv "src/games/assets/Powerup3.wav" src/sdk/assets/audio/Powerup3.wav
git mv "src/games/assets/Laser-weapon1.wav" src/sdk/assets/audio/Laser-weapon1.wav
git mv "src/games/assets/sfx-jump.wav" src/sdk/assets/audio/sfx-jump.wav
git rm "src/games/assets/Sound effects Mini Pack1.5.zip"
```

- [ ] **Step 2: Fix simple-pairs' temporary import paths**

`src/games/simple-pairs/hooks/useGameSounds.ts` currently `require('../../assets/Blip1.wav')` etc. Update those four requires to point at the new location for now (this hook is replaced in Phase 5):
```ts
const SOUNDS: Record<string, number> = {
  flip: require('@/sdk/assets/audio/Blip1.wav'),
  match: require('@/sdk/assets/audio/Powerup3.wav'),
  mismatch: require('@/sdk/assets/audio/sfx-jump.wav'),
  win: require('@/sdk/assets/audio/Laser-weapon1.wav'),
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: move audio assets into SDK, drop zip"
```

### Task 2.2: Asset manifest + query helpers (TDD)

**Files:**
- Create: `src/sdk/assets/types.ts`, `src/sdk/assets/manifest.ts`, `src/sdk/assets/query.ts`
- Test: `src/sdk/assets/__tests__/query.test.ts`

- [ ] **Step 1: Write asset types**

`src/sdk/assets/types.ts`:
```ts
export type AssetType = 'audio' | 'image' | 'icon' | 'texture';

export type AssetEntry = {
  module: number; // result of require()
  type: AssetType;
  tags: string[];
};

export type AssetId = string;
```

- [ ] **Step 2: Write the manifest**

`src/sdk/assets/manifest.ts`:
```ts
import type { AssetEntry } from './types';

export const ASSETS = {
  'sfx.pop': {
    module: require('./audio/Blip1.wav'),
    type: 'audio',
    tags: ['pop', 'flip', 'tap', 'ui'],
  },
  'sfx.success': {
    module: require('./audio/Powerup3.wav'),
    type: 'audio',
    tags: ['success', 'match', 'reward'],
  },
  'sfx.win': {
    module: require('./audio/Laser-weapon1.wav'),
    type: 'audio',
    tags: ['win', 'celebration', 'complete'],
  },
  'sfx.wrong': {
    module: require('./audio/sfx-jump.wav'),
    type: 'audio',
    tags: ['wrong', 'mismatch', 'error'],
  },
} as const satisfies Record<string, AssetEntry>;

export type AssetId = keyof typeof ASSETS;
```

- [ ] **Step 3: Write the failing query tests**

`src/sdk/assets/__tests__/query.test.ts`:
```ts
import { getAsset, findAssets, pickAsset } from '../query';

describe('asset query', () => {
  it('getAsset returns an entry by id', () => {
    expect(getAsset('sfx.success').type).toBe('audio');
  });

  it('findAssets filters by type and tag', () => {
    const wins = findAssets({ type: 'audio', tags: ['win'] });
    expect(wins).toContain('sfx.win');
    expect(wins).not.toContain('sfx.pop');
  });

  it('pickAsset returns the best single match for an intent', () => {
    expect(pickAsset('celebration')).toBe('sfx.win');
  });

  it('pickAsset returns undefined for an unknown intent', () => {
    expect(pickAsset('nope-nothing')).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm test -- query`
Expected: FAIL ("Cannot find module '../query'").

- [ ] **Step 5: Implement query helpers**

`src/sdk/assets/query.ts`:
```ts
import { ASSETS, type AssetId } from './manifest';
import type { AssetEntry, AssetType } from './types';

export function getAsset(id: AssetId): AssetEntry {
  return ASSETS[id];
}

export function findAssets(filter: { type?: AssetType; tags?: string[] }): AssetId[] {
  return (Object.keys(ASSETS) as AssetId[]).filter((id) => {
    const entry = ASSETS[id];
    if (filter.type && entry.type !== filter.type) return false;
    if (filter.tags && !filter.tags.every((t) => entry.tags.includes(t))) return false;
    return true;
  });
}

/** Best single asset for an intent: the first asset whose tags include the intent. */
export function pickAsset(intent: string): AssetId | undefined {
  return (Object.keys(ASSETS) as AssetId[]).find((id) => ASSETS[id].tags.includes(intent));
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `npm test -- query`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add src/sdk/assets/types.ts src/sdk/assets/manifest.ts src/sdk/assets/query.ts src/sdk/assets/__tests__/query.test.ts
git commit -m "feat: add typed asset manifest and query helpers"
```

### Task 2.3: Storage helper (TDD)

**Files:**
- Create: `src/sdk/storage/createStore.ts`
- Test: `src/sdk/storage/__tests__/createStore.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/sdk/storage/__tests__/createStore.test.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStore } from '../createStore';

describe('createStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the default when unset', async () => {
    const store = createStore('game-a', { score: 0 });
    expect(await store.get()).toEqual({ score: 0 });
  });

  it('persists under a namespaced key', async () => {
    const store = createStore('game-a', { score: 0 });
    await store.set({ score: 5 });
    expect(await store.get()).toEqual({ score: 5 });
    expect(await AsyncStorage.getItem('kg:game-a')).toBe(JSON.stringify({ score: 5 }));
  });

  it('isolates namespaces', async () => {
    const a = createStore('game-a', { score: 0 });
    const b = createStore('game-b', { score: 0 });
    await a.set({ score: 1 });
    expect(await b.get()).toEqual({ score: 0 });
  });

  it('notifies subscribers on set', async () => {
    const store = createStore('game-a', { score: 0 });
    const seen: number[] = [];
    store.subscribe((v) => seen.push(v.score));
    await store.set({ score: 7 });
    expect(seen).toEqual([7]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- createStore`
Expected: FAIL ("Cannot find module '../createStore'").

- [ ] **Step 3: Implement createStore**

`src/sdk/storage/createStore.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Store<T> = {
  get: () => Promise<T>;
  set: (value: T) => Promise<void>;
  subscribe: (fn: (value: T) => void) => () => void;
};

export function createStore<T>(namespace: string, defaultValue: T): Store<T> {
  const key = `kg:${namespace}`;
  const subscribers = new Set<(value: T) => void>();

  return {
    async get() {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return defaultValue;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return defaultValue;
      }
    },
    async set(value) {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      subscribers.forEach((fn) => fn(value));
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- createStore`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/storage/createStore.ts src/sdk/storage/__tests__/createStore.test.ts
git commit -m "feat: add namespaced storage helper"
```

### Task 2.4: Settings store (TDD)

**Files:**
- Create: `src/sdk/settings/store.ts`
- Test: `src/sdk/settings/__tests__/store.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/sdk/settings/__tests__/store.test.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsStore, DEFAULT_SETTINGS } from '../store';

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('defaults to sound and haptics on, no band filter', async () => {
    expect(await settingsStore.get()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.hapticsEnabled).toBe(true);
    expect(DEFAULT_SETTINGS.ageBand).toBeNull();
  });

  it('persists changes', async () => {
    await settingsStore.set({ ...DEFAULT_SETTINGS, soundEnabled: false });
    expect((await settingsStore.get()).soundEnabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- settings`
Expected: FAIL ("Cannot find module '../store'").

- [ ] **Step 3: Implement the settings store**

`src/sdk/settings/store.ts`:
```ts
import { createStore } from '@/sdk/storage/createStore';

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  ageBand: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  ageBand: null,
};

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- settings`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/settings/store.ts src/sdk/settings/__tests__/store.test.ts
git commit -m "feat: add settings store"
```

### Task 2.5: Audio + haptics service

**Files:**
- Create: `src/sdk/audio/useSound.ts`
- Modify: `package.json` (expo-haptics)

- [ ] **Step 1: Install expo-haptics**

Run: `npx expo install expo-haptics`
Expected: `expo-haptics` added to dependencies.

- [ ] **Step 2: Implement useSound**

`src/sdk/audio/useSound.ts`:
```ts
import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { pickAsset, getAsset } from '@/sdk/assets/query';
import { settingsStore } from '@/sdk/settings/store';

export type PlayOptions = { haptic?: boolean };

export function useSound() {
  const loaded = useRef<Record<string, Audio.Sound>>({});

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    const cache = loaded.current;
    return () => {
      Object.values(cache).forEach((s) => s.unloadAsync().catch(() => {}));
      loaded.current = {};
    };
  }, []);

  const play = useCallback(async (intent: string, options: PlayOptions = {}) => {
    const settings = await settingsStore.get();

    if (settings.hapticsEnabled && options.haptic !== false) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    if (!settings.soundEnabled) return;

    const id = pickAsset(intent);
    if (!id) return; // graceful: unknown intent → silent

    try {
      if (loaded.current[id]) {
        await loaded.current[id].replayAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(getAsset(id).module, { shouldPlay: true });
      loaded.current[id] = sound;
    } catch {
      // graceful degradation — game works without sound
    }
  }, []);

  return { play };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/sdk/audio/useSound.ts
git commit -m "feat: add sound + haptics service"
```

### Task 2.6: Export assets/storage/audio/settings from the barrel

**Files:**
- Modify: `src/sdk/index.ts`

- [ ] **Step 1: Add exports**

Append to `src/sdk/index.ts`:
```ts
// Assets
export { ASSETS } from './assets/manifest';
export type { AssetId } from './assets/manifest';
export { getAsset, findAssets, pickAsset } from './assets/query';
export type { AssetEntry, AssetType } from './assets/types';

// Storage
export { createStore } from './storage/createStore';
export type { Store } from './storage/createStore';

// Settings
export { settingsStore, DEFAULT_SETTINGS } from './settings/store';
export type { Settings } from './settings/store';

// Audio
export { useSound } from './audio/useSound';
export type { PlayOptions } from './audio/useSound';
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/sdk/index.ts
git commit -m "feat: export assets, storage, audio, settings from barrel"
```

---

## Phase 3 — GameShell layout

### Task 3.1: Layout types + overlay + context

**Files:**
- Create: `src/sdk/layout/types.ts`, `src/sdk/layout/GameShellContext.tsx`, `src/sdk/layout/GameOverlay.tsx`

- [ ] **Step 1: Write layout types**

`src/sdk/layout/types.ts`:
```ts
import type { ReactNode } from 'react';

export type OverlaySlot = 'loading' | 'win' | 'pause' | 'error';

export type GameShellProps = {
  title?: string;
  background?: string;
  showBack?: boolean;
  header?: ReactNode;
  onBack?: () => void;
  onPause?: () => void;
  children: ReactNode;
};
```

- [ ] **Step 2: Write the shell context**

`src/sdk/layout/GameShellContext.tsx`:
```ts
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { OverlaySlot } from './types';

export type GameShellApi = {
  setScore: (score: number | string | null) => void;
  showOverlay: (slot: OverlaySlot, content: ReactNode) => void;
  hideOverlay: (slot: OverlaySlot) => void;
};

const noop = () => {};
export const GameShellContext = createContext<GameShellApi>({
  setScore: noop,
  showOverlay: noop,
  hideOverlay: noop,
});

export function useGameShell(): GameShellApi {
  return useContext(GameShellContext);
}
```

- [ ] **Step 3: Write the overlay primitive**

`src/sdk/layout/GameOverlay.tsx`:
```tsx
import { Modal, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { COLORS } from '@/constants/colors';

export function GameOverlay({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
  },
});
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/sdk/layout/types.ts src/sdk/layout/GameShellContext.tsx src/sdk/layout/GameOverlay.tsx
git commit -m "feat: add layout types, shell context, overlay primitive"
```

### Task 3.2: GameShell component

**Files:**
- Create: `src/sdk/layout/GameShell.tsx`

- [ ] **Step 1: Implement GameShell**

`src/sdk/layout/GameShell.tsx`:
```tsx
import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeContainer } from '@/components/common/SafeContainer';
import { BackButton } from '@/components/common/BackButton';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { GameShellContext, type GameShellApi } from './GameShellContext';
import { GameOverlay } from './GameOverlay';
import type { GameShellProps, OverlaySlot } from './types';

export function GameShell({
  title,
  background = COLORS.background.light,
  showBack = true,
  header,
  onBack,
  onPause,
  children,
}: GameShellProps) {
  const [score, setScore] = useState<number | string | null>(null);
  const [overlays, setOverlays] = useState<Partial<Record<OverlaySlot, ReactNode>>>({});

  const showOverlay = useCallback((slot: OverlaySlot, content: ReactNode) => {
    setOverlays((prev) => ({ ...prev, [slot]: content }));
  }, []);
  const hideOverlay = useCallback((slot: OverlaySlot) => {
    setOverlays((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }, []);

  const api = useMemo<GameShellApi>(
    () => ({ setScore, showOverlay, hideOverlay }),
    [showOverlay, hideOverlay]
  );

  const activeOverlay = (['error', 'pause', 'win', 'loading'] as OverlaySlot[]).find(
    (slot) => overlays[slot] != null
  );

  return (
    <GameShellContext.Provider value={api}>
      <SafeContainer style={[styles.container, { backgroundColor: background }]}>
        <View style={styles.headerRow}>
          {showBack ? <BackButton onPress={onBack} /> : <View />}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.headerSlot}>
            {header}
            {score != null ? <Text style={styles.score}>{score}</Text> : null}
          </View>
        </View>

        <View style={styles.content}>{children}</View>

        <GameOverlay visible={activeOverlay != null}>
          {activeOverlay ? overlays[activeOverlay] : null}
        </GameOverlay>
      </SafeContainer>
    </GameShellContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    minHeight: 56,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text.primary },
  headerSlot: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  score: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text.primary },
  content: { flex: 1 },
});
```

> Note: `BackButton` is currently absolutely positioned (top-left). Verify it renders acceptably inside the header row; if it conflicts, pass a style override or set `showBack={false}` and place it manually. Confirm `SafeContainer` accepts a `style` prop — if not, wrap it.

- [ ] **Step 2: Confirm SafeContainer/BackButton props**

Run: `npx tsc --noEmit`
Expected: no errors. If `SafeContainer` does not accept `style` or `BackButton` does not accept `onPress`/optional press, adjust GameShell to match their actual props (read `src/components/common/SafeContainer.tsx` and `BackButton.tsx`).

- [ ] **Step 3: Commit**

```bash
git add src/sdk/layout/GameShell.tsx
git commit -m "feat: add GameShell component"
```

### Task 3.3: Export layout + integrate into GamePlayerScreen

**Files:**
- Modify: `src/sdk/index.ts`, `src/screens/GamePlayerScreen.tsx`

- [ ] **Step 1: Export layout from the barrel**

Append to `src/sdk/index.ts`:
```ts
// Layout
export { GameShell } from './layout/GameShell';
export { GameOverlay } from './layout/GameOverlay';
export { useGameShell } from './layout/GameShellContext';
export type { GameShellApi } from './layout/GameShellContext';
export type { GameShellProps, OverlaySlot } from './layout/types';
```

- [ ] **Step 2: Wrap games in GameShell by default with bare-mode opt-out**

Replace `src/screens/GamePlayerScreen.tsx` with:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { getGame } from '@/sdk';
import { GameShell } from '@/sdk';
import { BackButton } from '../components/common';
import { COLORS, FONT_SIZES } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

export function GamePlayerScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const game = getGame(gameId);

  if (!game) {
    return (
      <View style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Game not found</Text>
        </View>
      </View>
    );
  }

  const Game = game.component;
  const layout = game.layout ?? {};

  // Bare mode: game composes its own shell/canvas.
  if (layout.mode === 'bare') {
    return (
      <View style={[styles.container, { backgroundColor: game.backgroundColor }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Game />
      </View>
    );
  }

  return (
    <GameShell
      title={layout.title ?? game.name}
      background={game.backgroundColor}
      showBack={layout.showBack ?? true}
      onBack={() => navigation.goBack()}
    >
      <Game />
    </GameShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.light },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: FONT_SIZES.lg, color: COLORS.text.secondary, fontWeight: 'bold' },
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `npx expo start` and open each existing game. Confirm: back button works, games render. (Games still render their own internal headers at this point — Phase 5 cleans that up.)

- [ ] **Step 5: Commit**

```bash
git add src/sdk/index.ts src/screens/GamePlayerScreen.tsx
git commit -m "feat: render games inside GameShell with bare-mode opt-out"
```

---

## Phase 4 — Age bands, settings screen, home filter

### Task 4.1: Age bands + helpers (TDD)

**Files:**
- Create: `src/sdk/age/bands.ts`
- Test: `src/sdk/age/__tests__/bands.test.ts`

- [ ] **Step 1: Write the failing tests**

`src/sdk/age/__tests__/bands.test.ts`:
```ts
import { AGE_BANDS, bandsForGame, gamesForBand } from '../bands';
import { registerGame, _resetRegistry } from '@/sdk/config/registry';
import type { GameConfig } from '@/sdk/config/types';

const make = (id: string, min: number, max: number): GameConfig => ({
  id, name: id, description: 'x', icon: '🎮',
  ageRange: { min, max }, component: () => null, backgroundColor: '#fff',
});

describe('age bands', () => {
  beforeEach(() => _resetRegistry());

  it('exposes ordered bands', () => {
    expect(AGE_BANDS.map((b) => b.id)).toEqual(['toddler', 'preschool', 'early', 'kids']);
  });

  it('derives overlapping bands from a game ageRange', () => {
    expect(bandsForGame(make('a', 3, 6))).toEqual(['preschool', 'early']);
  });

  it('honors an explicit bands override', () => {
    expect(bandsForGame({ ...make('a', 3, 6), bands: ['toddler'] })).toEqual(['toddler']);
  });

  it('gamesForBand returns games overlapping that band', () => {
    registerGame(make('a', 3, 5));
    registerGame(make('b', 7, 10));
    expect(gamesForBand('preschool').map((g) => g.id)).toEqual(['a']);
    expect(gamesForBand('kids').map((g) => g.id)).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- bands`
Expected: FAIL ("Cannot find module '../bands'").

- [ ] **Step 3: Implement bands**

`src/sdk/age/bands.ts`:
```ts
import { getAllGames } from '@/sdk/config/registry';
import type { GameConfig } from '@/sdk/config/types';

export type AgeBand = { id: string; label: string; min: number; max: number };

export const AGE_BANDS: readonly AgeBand[] = [
  { id: 'toddler', label: 'Toddler', min: 2, max: 3 },
  { id: 'preschool', label: 'Preschool', min: 3, max: 5 },
  { id: 'early', label: 'Early years', min: 5, max: 7 },
  { id: 'kids', label: 'Big kids', min: 7, max: 10 },
];

function overlaps(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
  return a.min <= b.max && b.min <= a.max;
}

export function bandsForGame(config: GameConfig): string[] {
  if (config.bands && config.bands.length > 0) return config.bands;
  return AGE_BANDS.filter((band) => overlaps(config.ageRange, band)).map((b) => b.id);
}

export function gamesForBand(bandId: string): GameConfig[] {
  const band = AGE_BANDS.find((b) => b.id === bandId);
  if (!band) return [];
  return getAllGames().filter((game) => bandsForGame(game).includes(bandId));
}
```

> Note on the `bandsForGame(3,6)` expectation: `preschool` is 3–5 (overlaps), `early` is 5–7 (overlaps at 5–6), `toddler` 2–3 overlaps at 3 too. Adjust the test's expected array if you intend boundary-touching bands to count — implementation uses inclusive overlap, so `make('a', 3, 6)` yields `['toddler','preschool','early']`. Update the Step 1 expectation to `['toddler','preschool','early']` before running, OR change toddler max to 2 if touching at 3 should not count. Pick inclusive (update the expectation) for consistency with `gamesForAge`.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- bands`
Expected: PASS (with the expectation aligned to inclusive overlap per the note).

- [ ] **Step 5: Commit**

```bash
git add src/sdk/age/bands.ts src/sdk/age/__tests__/bands.test.ts
git commit -m "feat: add age bands and helpers"
```

### Task 4.2: Settings hook + export

**Files:**
- Create: `src/sdk/settings/useSettings.ts`
- Modify: `src/sdk/index.ts`

- [ ] **Step 1: Implement a settings hook**

`src/sdk/settings/useSettings.ts`:
```ts
import { useEffect, useState } from 'react';
import { settingsStore, DEFAULT_SETTINGS, type Settings } from './store';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let mounted = true;
    settingsStore.get().then((s) => mounted && setSettings(s));
    const unsub = settingsStore.subscribe((s) => setSettings(s));
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const update = async (patch: Partial<Settings>) => {
    const next = { ...(await settingsStore.get()), ...patch };
    await settingsStore.set(next);
  };

  return { settings, update };
}
```

- [ ] **Step 2: Export age + settings hook from barrel**

Append to `src/sdk/index.ts`:
```ts
// Age
export { AGE_BANDS, bandsForGame, gamesForBand } from './age/bands';
export type { AgeBand } from './age/bands';

// Settings hook
export { useSettings } from './settings/useSettings';
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/sdk/settings/useSettings.ts src/sdk/index.ts
git commit -m "feat: add useSettings hook and export age helpers"
```

### Task 4.3: Settings screen + navigation route

**Files:**
- Create: `src/screens/SettingsScreen.tsx`
- Modify: `src/app/navigation/RootNavigator.tsx`, `src/screens/index.ts`

- [ ] **Step 1: Implement SettingsScreen**

`src/screens/SettingsScreen.tsx`:
```tsx
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { BackButton } from '../components/common';
import { AGE_BANDS, useSettings } from '@/sdk';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { settings, update } = useSettings();

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Sound</Text>
          <Switch value={settings.soundEnabled} onValueChange={(v) => update({ soundEnabled: v })} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Haptics</Text>
          <Switch value={settings.hapticsEnabled} onValueChange={(v) => update({ hapticsEnabled: v })} />
        </View>

        <Text style={styles.subheading}>Show games for</Text>
        <View style={styles.bands}>
          <Text
            style={[styles.band, settings.ageBand === null && styles.bandActive]}
            onPress={() => update({ ageBand: null })}
          >
            All
          </Text>
          {AGE_BANDS.map((band) => (
            <Text
              key={band.id}
              style={[styles.band, settings.ageBand === band.id && styles.bandActive]}
              onPress={() => update({ ageBand: band.id })}
            >
              {band.label}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.light },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl * 2, gap: SPACING.lg },
  heading: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text.primary },
  subheading: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text.primary, marginTop: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary },
  bands: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  band: {
    fontSize: FONT_SIZES.md, color: COLORS.text.primary,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.white, borderRadius: 999, overflow: 'hidden',
  },
  bandActive: { backgroundColor: COLORS.primary.blue, color: COLORS.text.inverse },
});
```

> Note: verify `SPACING` has `xl` and `FONT_SIZES` has `md`/`xl` keys by reading `src/constants/dimensions.ts`; substitute the nearest existing keys if not.

- [ ] **Step 2: Register the Settings route**

In `src/app/navigation/RootNavigator.tsx`, import `SettingsScreen` and add a `<Stack.Screen name="Settings" component={SettingsScreen} />` alongside the existing screens. Export `SettingsScreen` from `src/screens/index.ts`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/screens/index.ts src/app/navigation/RootNavigator.tsx
git commit -m "feat: add settings & parental controls screen"
```

### Task 4.4: Home age-band filter + settings entry

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Apply the saved band filter and add a gear entry**

In `src/screens/HomeScreen.tsx`:
- Import `{ useSettings, gamesForBand, getAllGames, AGE_BANDS }` from `@/sdk`.
- Compute the list: `const games = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();`
- Render a small gear/⚙️ touchable in the header that calls `navigation.navigate('Settings')`.
- Render filter chips for `AGE_BANDS` (+ "All") that call `update({ ageBand })`, mirroring the Settings screen chips.
- Preserve the existing empty state ("No games yet! 🎮") when `games.length === 0`.

(Show the actual edited render block in your implementation; keep the existing 2-column FlatList of `GameCard`.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npx expo start`. Confirm: gear opens Settings; toggling sound/haptics persists across reloads; selecting an age band filters the Home grid; "All" restores the full list.

- [ ] **Step 4: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: add age-band filter and settings entry to Home"
```

---

## Phase 5 — Migrate existing games

### Task 5.1: Migrate simple-pairs to useSound + GameShell

**Files:**
- Delete: `src/games/simple-pairs/hooks/useGameSounds.ts`
- Modify: `src/games/simple-pairs/hooks/index.ts`, `src/games/simple-pairs/index.tsx`, `src/games/simple-pairs/config.ts`

- [ ] **Step 1: Replace useGameSounds usage with useSound**

In `src/games/simple-pairs/index.tsx`:
- Remove the `useGameSounds` import; add `import { useSound } from '@/sdk';`.
- `const { play } = useSound();`
- Map calls: `playFlip()` → `play('pop')`, `playMatch()` → `play('success')`, `playMismatch()` → `play('wrong')`, `playWin()` → `play('win')`.
- Delete `src/games/simple-pairs/hooks/useGameSounds.ts` and its re-export in `hooks/index.ts`.

- [ ] **Step 2: Let the shell own chrome**

`simple-pairs` renders a `DifficultySelect` gate then `GameContent`. Keep it in default shell mode. If its internal header (`GameHeader`) now duplicates the shell header, either set `config.layout = { mode: 'bare' }` to keep full control, OR remove the duplicate and rely on the shell. Choose bare mode if the difficulty-select screen needs the full canvas; otherwise default. Set in `config.ts` accordingly.

- [ ] **Step 3: Typecheck + run**

Run: `npx tsc --noEmit` then `npx expo start`.
Expected: no type errors; sounds still play on flip/match/mismatch/win; with sound off in Settings, the game is silent but fully playable.

- [ ] **Step 4: Commit**

```bash
git add -A src/games/simple-pairs/
git commit -m "refactor: migrate simple-pairs to SDK sound + shell"
```

### Task 5.2: Migrate color-mixer to the storage helper

**Files:**
- Modify: `src/games/color-mixer/hooks/useColorMixer.ts`, `src/games/color-mixer/config.ts`

- [ ] **Step 1: Replace direct AsyncStorage with createStore**

In `src/games/color-mixer/hooks/useColorMixer.ts` (currently uses `AsyncStorage` at lines 1, 62, 168, 182 with `SAVED_COLORS_KEY`):
- Replace the import with `import { createStore } from '@/sdk';`.
- Create a module-level store typed to the saved-colors shape:
  ```ts
  const savedColorsStore = createStore('color-mixer', { savedColors: [] as SavedColor[] });
  ```
  (use the existing saved-color type from the file).
- Replace `AsyncStorage.getItem(SAVED_COLORS_KEY)` → `savedColorsStore.get()` (returns the object; read `.savedColors`).
- Replace both `AsyncStorage.setItem(...)` calls → `savedColorsStore.set({ savedColors: updated })`.
- Remove `SAVED_COLORS_KEY` and the `AsyncStorage` import.

- [ ] **Step 2: Set layout mode for color-mixer**

color-mixer has a rich custom UI. In `src/games/color-mixer/config.ts`, add `layout: { mode: 'bare' }` so it keeps full control of its canvas (it already renders its own back-aware layout). Verify the back button still works via the bare-mode wrapper in `GamePlayerScreen`.

- [ ] **Step 3: Typecheck + run**

Run: `npx tsc --noEmit` then `npx expo start`.
Expected: saved colors persist across reloads exactly as before; no type errors.

- [ ] **Step 4: Commit**

```bash
git add -A src/games/color-mixer/
git commit -m "refactor: migrate color-mixer to SDK storage helper"
```

### Task 5.3: Rewrite the game template against the SDK

**Files:**
- Modify: `src/games/_template/index.tsx`, `src/games/_template/config.ts`, `src/games/_template/hooks/useGameState.ts`, `src/games/_template/components/GameArea.tsx`
- Delete: `src/games/_template/assets/index.ts` (assets now come from the SDK)

- [ ] **Step 1: Rewrite _template/index.tsx to use the SDK**

`src/games/_template/index.tsx`:
```tsx
import { StyleSheet, Text, View } from 'react-native';
import { useSound, useGameShell } from '@/sdk';
import { COLORS, FONT_SIZES } from '@/sdk';

export default function TemplateGame() {
  const { play } = useSound();
  const shell = useGameShell();

  return (
    <View style={styles.container}>
      <Text style={styles.text} onPress={() => play('pop')}>
        Tap me — replace this with your game.
      </Text>
      <Text style={styles.hint} onPress={() => shell.showOverlay('win', <Text style={styles.win}>You win! 🎉</Text>)}>
        Show win overlay
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary },
  hint: { fontSize: FONT_SIZES.md, color: COLORS.text.secondary, marginTop: 16 },
  win: { fontSize: FONT_SIZES.xl, color: COLORS.text.inverse },
});
```

- [ ] **Step 2: Update _template/config.ts to the enriched schema**

`src/games/_template/config.ts`:
```ts
import { registerGame } from '@/sdk';
import TemplateGame from './index';

registerGame({
  id: 'template-game',
  name: 'Template Game',
  description: 'Copy this folder to start a new game.',
  icon: '🧩',
  ageRange: { min: 3, max: 6 },
  component: TemplateGame,
  backgroundColor: '#FFF9F0',
  tags: ['example'],
  version: '1.0.0',
});
```

> Note: `_template/config.ts` should NOT be imported in `src/games/index.ts` (templates aren't registered live). Confirm it stays out of the registration barrel.

- [ ] **Step 3: Delete the template assets placeholder + simplify hooks**

Run: `git rm src/games/_template/assets/index.ts`. Leave `useGameState.ts` and `GameArea.tsx` if still useful, or trim references to removed assets.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A src/games/_template/
git commit -m "refactor: rewrite game template against the SDK"
```

### Task 5.4: Remove the old games/assets folder

**Files:**
- Delete: `src/games/assets/` (should be empty after Task 2.1)

- [ ] **Step 1: Remove the empty legacy assets dir**

Run:
```bash
rmdir src/games/assets 2>/dev/null || git rm -r --ignore-unmatch src/games/assets
```
Confirm nothing references `src/games/assets` anymore: `grep -rn "games/assets" src/`.

- [ ] **Step 2: Run full test suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS; no type errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove legacy games/assets folder"
```

---

## Phase 6 — AI skill + docs

### Task 6.1: Write the kids-games-dev skill

**Files:**
- Create: `.claude/skills/kids-games-dev/SKILL.md`

- [ ] **Step 1: Write the skill**

`.claude/skills/kids-games-dev/SKILL.md` (frontmatter + body). Include:
- Frontmatter: `name: kids-games-dev`, `description:` covering "use when adding or modifying a game in this Kids Games repo, scaffolding a game, or picking assets".
- **The SDK contract**: games import only from `@/sdk`; never import another game or deep `src/` paths; list the surface (GameShell, useGameShell, useSound, createStore, settingsStore/useSettings, AGE_BANDS/bandsForGame/gamesForBand, registerGame, design tokens, asset query helpers).
- **Scaffold a game**: copy `src/games/_template/` → `src/games/<id>/`; set a kebab-case `id`, metadata, `ageRange`; import the config in `src/games/index.ts`; the registry validates on register.
- **Picking assets**: query the manifest by intent — `pickAsset('success'|'win'|'pop'|'wrong'|'celebration'|...)`; the controlled tag vocabulary; reuse an existing tagged asset before adding a new one; to add an asset, drop the file in `src/sdk/assets/<type>/` and add a tagged entry to `manifest.ts`.
- **Layout decisions**: default shell vs `layout.mode === 'bare'`; use `useGameShell().showOverlay('win', ...)` for win/pause overlays.
- **Age bands**: keep numeric `ageRange`; bands derive automatically; override with `bands` only when needed.
- **Config schema + validation rules**: required fields, kebab-case id, `min <= max`.
- **Add-a-game checklist** (copyable).

- [ ] **Step 2: Sanity-check the skill content matches the code**

Verify every symbol named in the skill is actually exported from `src/sdk/index.ts` (cross-check the barrel).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/kids-games-dev/SKILL.md
git commit -m "docs: add kids-games-dev AI skill"
```

### Task 6.2: Contribution docs

**Files:**
- Create: `CONTRIBUTING.md`
- Modify: `src/games/HOW_TO_ADD_GAME.md`, `CLAUDE.md`

- [ ] **Step 1: Write CONTRIBUTING.md**

Cover: repo intent (parents building/sharing kids' games), the SDK contract & the "@/sdk only" rule, how to add a game (point to `HOW_TO_ADD_GAME.md`), running tests (`npm test`) and typecheck (`npx tsc --noEmit`), the asset tag vocabulary, and the config validation rules.

- [ ] **Step 2: Update HOW_TO_ADD_GAME.md**

Rewrite the guide to use the SDK: copy `_template`, import from `@/sdk`, register, pick assets via `pickAsset`, choose layout mode, set `ageRange`. Replace any stale references to `src/games/assets` or the old per-game sound hook.

- [ ] **Step 3: Update CLAUDE.md**

Add an "SDK platform core" subsection to Architecture: `src/sdk/` surface, the "@/sdk only" contract, asset manifest + tags, age bands, settings, and point to the `kids-games-dev` skill.

- [ ] **Step 4: Commit**

```bash
git add CONTRIBUTING.md src/games/HOW_TO_ADD_GAME.md CLAUDE.md
git commit -m "docs: add contribution guide and update game-adding docs"
```

---

## Final verification

- [ ] **Run the full suite**

Run: `npm test && npx tsc --noEmit`
Expected: all tests PASS; no type errors.

- [ ] **Manual smoke of the whole app**

Run: `npx expo start`. Verify: Home grid + age filter + gear→Settings; both existing games play with sound/haptics honoring Settings; saved colors persist; back navigation works everywhere.

- [ ] **Confirm no legacy references remain**

Run: `grep -rn "games/assets\|useGameSounds\|SAVED_COLORS_KEY" src/`
Expected: no results.

---

## Self-Review notes (addressed)

- **Spec coverage:** every spec section maps to a task — SDK surface (0.2,1.4,2.6,3.3,4.2), GameShell (3.x), assets (2.1,2.2), audio/haptics (2.5), storage (2.3), settings (2.4,4.x), age bands (4.1), config+validation (1.x), skill (6.1), migration (5.x), docs (6.2).
- **No test runner existed** → Phase 0 adds `jest-expo` before any TDD task.
- **Type consistency:** `play(intent)`, `pickAsset(intent)`, `createStore(namespace, default)`, `bandsForGame/gamesForBand`, `useGameShell().showOverlay`, `Settings { soundEnabled, hapticsEnabled, ageBand }` are used consistently across tasks.
- **Known follow-up to resolve during impl:** confirm `SafeContainer`/`BackButton` prop shapes (Task 3.2) and `SPACING`/`FONT_SIZES` keys (Task 4.x) against the actual constants files; align the `bandsForGame` boundary expectation (Task 4.1 note).
