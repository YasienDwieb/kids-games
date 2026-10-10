import { isTablet } from '../responsive';

describe('isTablet', () => {
  it('keys off the short side', () => {
    expect(isTablet(844, 390)).toBe(false);
    expect(isTablet(1024, 768)).toBe(true);
    expect(isTablet(768, 1024)).toBe(true);
  });
});
