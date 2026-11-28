import { registerGame, visibleGames, isGameHidden, getAllGames, _resetRegistry } from '../registry';
import type { GameConfig } from '../types';
import type { CatalogueConfig } from '@/sdk/content/types';
import { SAFE_DEFAULT } from '@/sdk/content/validate';
import { registerFlowAdapter, selectedAdapters, eligibleGameIds, resetFlowAdaptersForTests } from '@/sdk/flow/adapter';
import { getContentConfig } from '@/sdk/content/load';

jest.mock('@/sdk/content/load', () => ({ getContentConfig: jest.fn() }));
const mockConfig = getContentConfig as jest.MockedFunction<typeof getContentConfig>;

function game(id: string, extra: Partial<GameConfig> = {}): GameConfig {
  return {
    id,
    name: id,
    description: id,
    icon: '⭐',
    ageRange: { min: 2, max: 10 },
    component: () => null,
    backgroundColor: '#FFFFFF',
    ...extra,
  };
}

const cat = (over: Partial<CatalogueConfig> = {}): CatalogueConfig => ({ order: [], hidden: [], enabled: [], ...over });
const ids = (games: GameConfig[]) => games.map((g) => g.id);

function useCatalogue(c: CatalogueConfig) {
  mockConfig.mockReturnValue({ ...SAFE_DEFAULT, catalogue: c });
}

beforeEach(() => {
  _resetRegistry();
  resetFlowAdaptersForTests();
  useCatalogue(cat());
  registerGame(game('a', { order: 10 }));
  registerGame(game('b', { order: 20 }));
  registerGame(game('c', { order: 30 }));
  registerGame(game('secret', { order: 5, dark: true }));
});

describe('visibleGames', () => {
  // protects=with the shipped (empty) catalogue Home shows exactly what it showed before this change; fails_when=the default config adds, drops or reorders a non-dark game; no_claim=none beyond protects
  it('matches getAllGames minus dark games under the default catalogue', () => {
    expect(ids(visibleGames())).toEqual(ids(getAllGames()).filter((id) => id !== 'secret'));
  });

  // protects=a hidden game never reaches the child; fails_when=a hidden id is returned; no_claim=does not render Home (see HomeCatalogue test)
  it('drops hidden games', () => {
    expect(ids(visibleGames(cat({ hidden: ['b'] })))).toEqual(['a', 'c']);
  });

  // protects=a dark game ships invisible and appears only when switched on; fails_when=it shows without being enabled or stays hidden once enabled; no_claim=none beyond protects
  it('shows dark games only when enabled', () => {
    expect(ids(visibleGames(cat()))).not.toContain('secret');
    expect(ids(visibleGames(cat({ enabled: ['secret'] })))).toEqual(['secret', 'a', 'b', 'c']);
  });

  // protects=hidden wins over enabled, so the off switch always works; fails_when=a game both enabled and hidden shows; no_claim=none beyond protects
  it('lets hidden override enabled', () => {
    expect(ids(visibleGames(cat({ enabled: ['secret'], hidden: ['secret'] })))).not.toContain('secret');
  });

  // protects=config order puts listed games first, the rest keep GameConfig.order; fails_when=listed games are not first in config order or the tail is reshuffled; no_claim=none beyond protects
  it('puts catalogue.order first, then the rest by GameConfig.order', () => {
    expect(ids(visibleGames(cat({ order: ['c', 'a'] })))).toEqual(['c', 'a', 'b']);
  });

  // protects=a typo or a removed game in the config is harmless; fails_when=unknown ids throw, show up, or shift the order; no_claim=none beyond protects
  it('ignores unknown ids', () => {
    expect(ids(visibleGames(cat({ order: ['nope', 'b'], hidden: ['ghost'], enabled: ['phantom'] })))).toEqual(['b', 'a', 'c']);
  });

  // protects=an ordered-but-hidden game stays hidden; fails_when=order re-adds it; no_claim=none beyond protects
  it('does not let order resurrect a hidden game', () => {
    expect(ids(visibleGames(cat({ order: ['b'], hidden: ['b'] })))).toEqual(['a', 'c']);
  });
});

describe('isGameHidden', () => {
  // protects=only registered games can be hidden, so non-game journey units are never filtered; fails_when=an unregistered id reports hidden or a hidden game reports visible; no_claim=none beyond protects
  it('is false for unregistered ids and true for hidden or dark games', () => {
    const c = cat({ hidden: ['a'] });
    expect(isGameHidden('a', c)).toBe(true);
    expect(isGameHidden('secret', c)).toBe(true);
    expect(isGameHidden('b', c)).toBe(false);
    expect(isGameHidden('moments', c)).toBe(false);
  });
});

describe('journey filtering', () => {
  const adapter = (gameId: string) => ({ gameId, count: 1, unitAt: () => ({ key: gameId, render: () => null }) });

  // protects=a hidden game never appears in the guided journey or its Settings picker; fails_when=selectedAdapters or eligibleGameIds still return it; no_claim=does not render FlowPlayerScreen
  it('drops hidden games from the journey and the picker', () => {
    ['a', 'b', 'secret', 'not-a-game'].forEach((id) => registerFlowAdapter(adapter(id)));
    useCatalogue(cat({ hidden: ['b'] }));
    expect(selectedAdapters(null).map((a) => a.gameId)).toEqual(['a', 'not-a-game']);
    expect(selectedAdapters(['a', 'b']).map((a) => a.gameId)).toEqual(['a']);
    expect(eligibleGameIds()).toEqual(['a', 'not-a-game']);
  });
});
