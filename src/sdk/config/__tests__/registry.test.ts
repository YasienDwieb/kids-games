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
