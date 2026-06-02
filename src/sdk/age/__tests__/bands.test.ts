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

  it('derives overlapping bands from a game ageRange (inclusive overlap)', () => {
    expect(bandsForGame(make('a', 3, 6))).toEqual(['toddler', 'preschool', 'early']);
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

  it('returns empty for an unknown band id', () => {
    expect(gamesForBand('nope')).toEqual([]);
  });
});
