import { getAsset, findAssets, pickAsset, pickModule } from '../query';
import { ASSETS } from '../manifest';

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

  // Locks the intent->asset invariant: pickAsset/findAssets resolve an intent by
  // tag, so a tag shared by two entries would make resolution ambiguous (e.g.
  // Animal Safari's play('lion') must hit exactly the 'animal.lion' entry). Every
  // tag across ALL entries must therefore appear in exactly one entry.
  it('no two ASSETS entries share a tag (tags are globally unique)', () => {
    const counts = new Map<string, number>();
    for (const entry of Object.values(ASSETS)) {
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    const collisions = [...counts.entries()].filter(([, n]) => n > 1);
    expect(collisions).toEqual([]);
  });
});
