import * as SDK from '@/sdk';
import { SDK_VERSION } from '@/sdk';

it('resolves the @/sdk alias', () => {
  expect(SDK_VERSION).toBe('0.1.0');
});

// Barrel-integrity guard: a circular import (an SDK-internal file importing back
// through the @/sdk barrel) leaves some exports `undefined` at access time —
// the exact "Cannot read property 'IconButton' of undefined" runtime crash.
// SDK internals must import siblings by path, not via the barrel. This asserts
// every public member is actually defined after the barrel finishes loading.
it('exports every public member as defined (no barrel cycle)', () => {
  const expected = [
    // UI primitives (components/common — most cycle-prone)
    'PressableButton',
    'BigButton',
    'IconButton',
    'AppBar',
    'Chip',
    'HudPill',
    'EmojiFrame',
    'Star',
    'GameCard',
    'BackButton',
    'SafeContainer',
    // layout
    'GameShell',
    'GameOverlay',
    'useGameShell',
    // config / registry
    'registerGame',
    'getGame',
    'getAllGames',
    // tokens
    'COLORS',
    'ACCENTS',
    'SPACING',
    'FONTS',
    // i18n
    'useTranslation',
    'i18n',
    'registerTranslations',
    'useLanguage',
    'gameName',
    'gameDescription',
    'LANGUAGES',
  ];
  const missing = expected.filter((name) => (SDK as Record<string, unknown>)[name] === undefined);
  expect(missing).toEqual([]);
});
