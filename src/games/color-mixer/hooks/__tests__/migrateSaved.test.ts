import { migrateSaved } from '../useColorMixer';
import { mixHex } from '../../utils';
import type { SavedColor } from '../../types';

const legacy = (over: Partial<SavedColor> = {}): SavedColor =>
  ({
    id: 'saved_1',
    name: 'Sunset',
    hex: '#F57C00',
    rgb: { r: 245, g: 124, b: 0 },
    createdAt: 1,
    ...over,
  }) as SavedColor;

describe('migrateSaved', () => {
  it('gives a pre-engine save a pigment recipe it did not have', () => {
    const { colors, changed } = migrateSaved([legacy()]);
    expect(changed).toBe(true);
    expect(colors).toHaveLength(1);
    expect(colors[0].fit?.length).toBeGreaterThan(0);
  });

  it('keeps the saved swatch exactly as it was', () => {
    // Swatch and pigment are separate concepts: what the child sees in My Colors must not
    // shift under them just because the engine changed.
    const { colors } = migrateSaved([legacy({ hex: '#8EB08D', name: 'Old Sage' })]);
    expect(colors[0].hex).toBe('#8EB08D');
    expect(colors[0].name).toBe('Old Sage');
  });

  it('fits a recipe that actually resembles the saved color', () => {
    const { colors } = migrateSaved([legacy({ hex: '#F57C00' })]);
    // Orange is exactly red+yellow, so the fit should land on it.
    expect(mixHex(colors[0].fit!)).toBe('#f57c00');
  });

  it('leaves an already-migrated save untouched', () => {
    const migrated = legacy({ fit: ['red', 'yellow'] });
    const { colors, changed } = migrateSaved([migrated]);
    expect(changed).toBe(false);
    expect(colors[0]).toBe(migrated);
  });

  it('leaves a save that has a real recipe untouched', () => {
    const withLog = legacy({ mixLog: ['red', 'red', 'yellow'] });
    const { colors, changed } = migrateSaved([withLog]);
    expect(changed).toBe(false);
    expect(colors[0].mixLog).toEqual(['red', 'red', 'yellow']);
  });

  it('drops a record with a malformed hex instead of turning it into black', () => {
    // The failure this guards: a bad hex parsed as #000000, became a black swatch, and
    // then poisoned every mix it was dropped into — silently.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { colors, changed } = migrateSaved([
      legacy({ id: 'good' }),
      legacy({ id: 'bad', hex: 'not-a-color' }),
      legacy({ id: 'alsoBad', hex: undefined as unknown as string }),
    ]);
    expect(colors.map((c) => c.id)).toEqual(['good']);
    expect(changed).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('handles an empty store', () => {
    expect(migrateSaved([])).toEqual({ colors: [], changed: false });
  });
});
