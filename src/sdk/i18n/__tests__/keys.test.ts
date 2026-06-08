/**
 * Runtime key-resolution guard.
 *
 * tsc checks types and jest doesn't render screens, so a component asking for a
 * translation key that was never registered is otherwise invisible — with
 * returnNull:false, i18next renders the raw key string into the UI silently.
 * This test imports the real i18n instance + every game's registered bundles
 * and asserts the keys the components actually request resolve to a real value
 * (≠ the key itself) in BOTH languages. It specifically covers the plural-ish
 * (movesOne/movesOther, poppedCount) and dynamic (colors.${id}, hints) keys
 * that are easiest to typo.
 */
import { i18n } from '@/sdk/i18n';
import '@/games'; // side-effect: registers all games + their translation bundles

// Keys the components request, mirrored from the t() call sites. Update this
// list when a game adds user-facing strings.
const KEYS: string[] = [
  // core
  'core:home.greeting',
  'core:home.title',
  'core:settings.title',
  'core:settings.language',
  'core:player.notFound',
  'core:ageBands.toddler',
  'core:ageBands.kids',
  'core:resume.welcomeBack',
  'core:resume.continueLevel',
  'core:resume.startOver',
  // simple-pairs
  'simple-pairs:meta.name',
  'simple-pairs:meta.description',
  'simple-pairs:difficulty.select.subtitle',
  'simple-pairs:difficulty.easy',
  'simple-pairs:difficulty.meta',
  'simple-pairs:header.pairs',
  'simple-pairs:header.movesOne',
  'simple-pairs:header.movesOther',
  'simple-pairs:win.title',
  'simple-pairs:win.movesOther',
  // color-mixer (incl. dynamic key families)
  'color-mixer:meta.name',
  'color-mixer:title',
  'color-mixer:mixingZone.dropHere',
  'color-mixer:colors.red',
  'color-mixer:colors.lightBlue',
  'color-mixer:challengeHints.c1',
  'color-mixer:challengeHints.c6',
  'color-mixer:discoveryHints.orange',
  'color-mixer:challenge.meter.perfect',
  'color-mixer:collection.found',
  'color-mixer:picker.complete',
  // mouse-maze
  'mouse-maze:meta.name',
  'mouse-maze:hud.level',
  'mouse-maze:win.title',
  'mouse-maze:win.nextMaze',
  // balloon-archer
  'balloon-archer:meta.name',
  'balloon-archer:hud.level',
  'balloon-archer:overlay.outOfArrows',
  'balloon-archer:overlay.poppedCount',
  'balloon-archer:overlay.nextLevel',
];

describe.each(['en', 'ar'])('translation keys resolve in %s', (lng) => {
  beforeAll(async () => {
    await i18n.changeLanguage(lng);
  });

  test.each(KEYS)('%s', (key) => {
    const value = i18n.t(key);
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
    // i18next returns the full key string when nothing is registered — the
    // silent-failure mode this test exists to catch. (A real value may legitimately
    // equal the last key segment, e.g. en `complete: 'complete'`, so we only
    // reject the full namespaced key.)
    expect(value).not.toBe(key);
  });
});
