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
