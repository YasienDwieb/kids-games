import { getAsset, findAssets, pickAsset, pickModule } from '../query';

describe('asset query', () => {
  it('getAsset returns an entry by id', () => {
    expect(getAsset('sfx.success').type).toBe('audio');
  });

  it('getAsset entries carry one or more variant modules', () => {
    expect(getAsset('sfx.success').modules.length).toBeGreaterThan(0);
  });

  it('findAssets filters by type and tag', () => {
    const wins = findAssets({ type: 'audio', tags: ['win'] });
    expect(wins).toContain('sfx.win');
    expect(wins).not.toContain('sfx.pop');
  });

  it('findAssets surfaces the new sound types', () => {
    expect(findAssets({ tags: ['explosion'] })).toContain('sfx.explosion');
    expect(findAssets({ tags: ['laser'] })).toContain('sfx.laser');
    expect(findAssets({ tags: ['hit'] })).toContain('sfx.hit');
  });

  it('pickAsset returns the best single match for an intent', () => {
    expect(pickAsset('celebration')).toBe('sfx.win');
  });

  it('pickAsset returns undefined for an unknown intent', () => {
    expect(pickAsset('nope-nothing')).toBeUndefined();
  });

  it('pickModule returns one of the intent variant modules', () => {
    const mods = getAsset('sfx.pop').modules;
    for (let i = 0; i < 20; i++) {
      expect(mods).toContain(pickModule('pop'));
    }
  });

  it('pickModule returns undefined for an unknown intent', () => {
    expect(pickModule('nope-nothing')).toBeUndefined();
  });
});
