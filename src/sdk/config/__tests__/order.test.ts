import { registerGame, getAllGames, _resetRegistry } from '../registry';
import type { GameConfig } from '../types';

function game(id: string, order?: number): GameConfig {
  return {
    id,
    name: id,
    description: id,
    icon: '⭐',
    ageRange: { min: 2, max: 10 },
    component: () => null,
    backgroundColor: '#FFFFFF',
    ...(order === undefined ? {} : { order }),
  };
}

describe('getAllGames ordering', () => {
  beforeEach(() => _resetRegistry());

  it('sorts by ascending order, not registration order', () => {
    registerGame(game('c', 30));
    registerGame(game('a', 10));
    registerGame(game('b', 20));
    expect(getAllGames().map((g) => g.id)).toEqual(['a', 'b', 'c']);
  });

  it('puts games without an order last', () => {
    registerGame(game('none'));
    registerGame(game('first', 10));
    expect(getAllGames().map((g) => g.id)).toEqual(['first', 'none']);
  });

  it('keeps registration order among equal weights', () => {
    registerGame(game('x', 10));
    registerGame(game('y', 10));
    registerGame(game('z', 10));
    expect(getAllGames().map((g) => g.id)).toEqual(['x', 'y', 'z']);
  });

  it('is stable across repeated calls', () => {
    registerGame(game('b', 20));
    registerGame(game('a', 10));
    expect(getAllGames().map((g) => g.id)).toEqual(getAllGames().map((g) => g.id));
  });
});
