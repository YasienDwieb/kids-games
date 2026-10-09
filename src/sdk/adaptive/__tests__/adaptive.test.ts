import { MAX_TIER, MIN_TIER, nextAdaptive, startingTier, tierFactor } from '../adaptive';

describe('adaptive tier', () => {
  it('starts from the age band', () => {
    expect(startingTier('toddler')).toBe(-1);
    expect(startingTier('preschool')).toBe(0);
    expect(startingTier('kids')).toBe(1);
    expect(startingTier(null)).toBe(0);
  });

  it('eases after two losses and raises after three wins', () => {
    let s = { tier: 0, wins: 0, losses: 0 };
    s = nextAdaptive(s, false);
    expect(s.tier).toBe(0);
    s = nextAdaptive(s, false);
    expect(s).toEqual({ tier: -1, wins: 0, losses: 0 });
    s = nextAdaptive(nextAdaptive(nextAdaptive(s, true), true), true);
    expect(s).toEqual({ tier: 0, wins: 0, losses: 0 });
  });

  it('a win breaks a losing streak', () => {
    let s = { tier: 0, wins: 0, losses: 1 };
    s = nextAdaptive(s, true);
    s = nextAdaptive(s, false);
    expect(s.tier).toBe(0);
  });

  it('stays within bounds', () => {
    let s = { tier: MAX_TIER, wins: 0, losses: 0 };
    for (let i = 0; i < 6; i++) s = nextAdaptive(s, true);
    expect(s.tier).toBe(MAX_TIER);
    s = { tier: MIN_TIER, wins: 0, losses: 0 };
    for (let i = 0; i < 6; i++) s = nextAdaptive(s, false);
    expect(s.tier).toBe(MIN_TIER);
    expect(tierFactor(-2, 0.1)).toBeCloseTo(0.8);
  });
});
