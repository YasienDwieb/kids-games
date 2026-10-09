import { hintStepFor, starsForMisses } from '../hints';

describe('hint policy', () => {
  it('escalates retry → highlight → reveal', () => {
    expect(hintStepFor(1)).toBe('retry');
    expect(hintStepFor(2)).toBe('highlight');
    expect(hintStepFor(3)).toBe('reveal');
    expect(hintStepFor(9)).toBe('reveal');
  });

  it('rewards the first try', () => {
    expect(starsForMisses(0)).toBe(3);
    expect(starsForMisses(1)).toBe(2);
    expect(starsForMisses(2)).toBe(1);
    expect(starsForMisses(5)).toBe(1);
  });
});
