import { validateGameConfig } from '../validate';
import type { GameConfig } from '../types';

const valid: GameConfig = {
  id: 'demo-game',
  name: 'Demo',
  description: 'A demo',
  icon: '🎮',
  ageRange: { min: 3, max: 6 },
  component: () => null,
  backgroundColor: '#fff',
};

describe('validateGameConfig', () => {
  it('accepts a valid config', () => {
    expect(() => validateGameConfig(valid)).not.toThrow();
  });

  it('rejects a missing id', () => {
    expect(() => validateGameConfig({ ...valid, id: '' })).toThrow(/id/);
  });

  it('rejects an invalid id format', () => {
    expect(() => validateGameConfig({ ...valid, id: 'Bad Id!' })).toThrow(/id/);
  });

  it('rejects ageRange where min > max', () => {
    expect(() => validateGameConfig({ ...valid, ageRange: { min: 8, max: 3 } })).toThrow(/ageRange/);
  });

  it('rejects a missing component', () => {
    expect(() => validateGameConfig({ ...valid, component: undefined as never })).toThrow(/component/);
  });
});
