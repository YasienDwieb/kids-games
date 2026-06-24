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
  // turbo-road (incl. dynamic key families: cars.<id>, themes.<id>, win.title.p<place>)
  'turbo-road:meta.name',
  'turbo-road:meta.description',
  'turbo-road:start.title',
  'turbo-road:start.level',
  'turbo-road:start.race',
  'turbo-road:start.garage',
  'turbo-road:start.mapLabel',
  'turbo-road:countdown.go',
  'turbo-road:hud.level',
  'turbo-road:place.p1',
  'turbo-road:place.p2',
  'turbo-road:place.p3',
  'turbo-road:win.title.p1',
  'turbo-road:win.title.p2',
  'turbo-road:win.title.p3',
  'turbo-road:win.coins',
  'turbo-road:win.next',
  'turbo-road:win.garage',
  'turbo-road:garage.title',
  'turbo-road:garage.trim',
  'turbo-road:garage.selected',
  'turbo-road:garage.select',
  'turbo-road:garage.unlock',
  'turbo-road:garage.done',
  'turbo-road:cars.turbo',
  'turbo-road:cars.zippy',
  'turbo-road:cars.buggy',
  'turbo-road:cars.taxi',
  'turbo-road:cars.patrol',
  'turbo-road:cars.truck',
  'turbo-road:cars.tractor',
  'turbo-road:cars.moto',
  'turbo-road:trims.coral',
  'turbo-road:trims.green',
  'turbo-road:trims.blue',
  'turbo-road:trims.orange',
  'turbo-road:themes.meadow',
  'turbo-road:themes.beach',
  'turbo-road:themes.desert',
  'turbo-road:themes.snow',
  'turbo-road:controls.label',
  'turbo-road:controls.drag',
  'turbo-road:controls.tilt',
  'turbo-road:pause.title',
  'turbo-road:pause.resume',
  'turbo-road:pause.exit',
  'turbo-road:missions.title',
  'turbo-road:missions.claim',
  'turbo-road:missions.types.coins',
  'turbo-road:missions.types.first',
  'turbo-road:missions.types.races',
  'turbo-road:missions.types.boost',
  'turbo-road:missions.types.clean',
  'turbo-road:cups.meadow',
  'turbo-road:cups.beach',
  'turbo-road:cups.desert',
  'turbo-road:cups.snow',
  'turbo-road:cups.earned',
  'turbo-road:garage.trophies',
  'turbo-road:garage.noTrophies',
  'turbo-road:garage.stats.speed',
  'turbo-road:garage.stats.grip',
  'turbo-road:a11y.steer',
  'turbo-road:a11y.coins',
  'turbo-road:a11y.stars',
  'turbo-road:a11y.pause',
  // shape-detective
  'shape-detective:meta.name',
  'shape-detective:loading',
  'shape-detective:pattern.instruction',
  'shape-detective:pattern.choose',
  'shape-detective:pattern.optionLabel',
  'shape-detective:levelSolved.title',
  'shape-detective:levelSolved.next',
  'shape-detective:levelSolved.finish',
  // shape-detective — translated shape kind/size attributes
  'shape-detective:shapes.kind.circle',
  'shape-detective:shapes.kind.square',
  'shape-detective:shapes.kind.triangle',
  'shape-detective:shapes.kind.star',
  'shape-detective:shapes.kind.heart',
  'shape-detective:shapes.kind.diamond',
  'shape-detective:shapes.size.small',
  'shape-detective:shapes.size.medium',
  'shape-detective:shapes.size.large',
  // shape-detective — translated color names (i18n-hardened: no raw hex in UI)
  'shape-detective:shapes.color.purple',
  'shape-detective:shapes.color.blue',
  'shape-detective:shapes.color.green',
  'shape-detective:shapes.color.coral',
  'shape-detective:shapes.color.orange',
  'shape-detective:shapes.color.pink',
  // shape-detective Sprint 3 — oddOneOut + sort
  'shape-detective:oddOneOut.instruction',
  'shape-detective:oddOneOut.itemLabel',
  'shape-detective:sort.instruction',
  'shape-detective:sort.dropHere',
  'shape-detective:sort.binLabel',
  'shape-detective:sort.itemLabel',
  // count-and-pop
  'count-and-pop:meta.name',
  'count-and-pop:meta.description',
  'count-and-pop:placeholder',
  'count-and-pop:loading',
  'count-and-pop:countThisMany.title',
  'count-and-pop:countThisMany.instruction',
  'count-and-pop:countThisMany.progress',
  'count-and-pop:howMany.title',
  'count-and-pop:howMany.instruction',
  'count-and-pop:makeN.title',
  'count-and-pop:makeN.instruction',
  'count-and-pop:addition.title',
  'count-and-pop:addition.instruction',
  'count-and-pop:levelSolved.title',
  'count-and-pop:levelSolved.next',
  'count-and-pop:levelSolved.finish',
  'count-and-pop:a11y.objectTile',
  'count-and-pop:a11y.objectPopped',
  'count-and-pop:a11y.choiceButton',
  // match-up
  'match-up:meta.name',
  'match-up:meta.description',
  'match-up:loading',
  'match-up:score',
  'match-up:solved.title',
  'match-up:solved.next',
  'match-up:prompts.animalFood',
  'match-up:prompts.workerTool',
  'match-up:prompts.animalHome',
  'match-up:prompts.colorFruit',
  'match-up:prompts.babyAnimal',
  'match-up:prompts.numberCount',
  // flow (guided journey)
  'core:flow.title',
  'core:flow.continue',
  'core:flow.allCaughtUp',
  'core:flow.exit',
  'core:flow.switchJourney',
  'core:flow.switchGames',
  'core:flow.start',
  'core:flow.includedGames',
  'core:flow.holdToReset',
  'core:flow.empty',
  'core:settings.guided.games',
];

describe.each(['en', 'ar'])('translation keys resolve in %s', (lng) => {
  beforeAll(async () => {
    await i18n.changeLanguage(lng);
  });

  test.each(KEYS)('%s', (key) => {
    // i18n.exists() is the authoritative guard — it returns false for missing keys
    // including core-namespace keys where i18next strips the namespace before
    // returning the fallback, making value !== key an insufficient check alone.
    expect(i18n.exists(key)).toBe(true);
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
