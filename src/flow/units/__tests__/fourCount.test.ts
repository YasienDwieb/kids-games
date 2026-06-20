import { fourCount, fourCountActors, FOUR_COUNT_TARGET } from '../fourCount';

const ctx = { width: 800, height: 400, rng: () => 0.5 };

describe('fourCount actors', () => {
  it('produces exactly the target number of star actors', () => {
    const actors = fourCountActors(ctx);
    expect(actors).toHaveLength(FOUR_COUNT_TARGET);
    expect(actors.map((a) => a.id)).toEqual(['star-0', 'star-1', 'star-2', 'star-3']);
  });
  it('lays them out on a single horizontal row', () => {
    const ys = new Set(fourCountActors(ctx).map((a) => a.y));
    expect(ys.size).toBe(1);
  });
  it('exit layout reuses the same ids (so the next unit can morph them)', () => {
    const enter = fourCount.enterActors(ctx).map((a) => a.id);
    const exit = fourCount.exitActors(ctx).map((a) => a.id);
    expect(exit).toEqual(enter);
  });
  it('is registered under the four topic', () => {
    expect(fourCount.id).toBe('four-count');
    expect(fourCount.topicId).toBe('four');
  });
});
