import { resolveStart, advanceStep, DEFAULT_FLOW_PROGRESS } from '../progress';

describe('resolveStart', () => {
  it('returns done when the journey is empty', () => {
    expect(resolveStart(0, DEFAULT_FLOW_PROGRESS)).toEqual({ done: true });
  });

  it('starts at step 0 when nothing is saved', () => {
    expect(resolveStart(5, DEFAULT_FLOW_PROGRESS)).toEqual({ done: false, step: 0 });
  });

  it('resumes a saved mid-journey step', () => {
    expect(resolveStart(5, { step: 3, seed: 1, updatedAt: 1 })).toEqual({ done: false, step: 3 });
  });

  it('treats a saved step past the end as done (rest state)', () => {
    expect(resolveStart(5, { step: 5, seed: 1, updatedAt: 1 })).toEqual({ done: true });
    expect(resolveStart(5, { step: 9, seed: 1, updatedAt: 1 })).toEqual({ done: true });
  });
});

describe('advanceStep', () => {
  it('advances within the journey', () => {
    expect(advanceStep(5, 0)).toEqual({ done: false, step: 1 });
    expect(advanceStep(5, 3)).toEqual({ done: false, step: 4 });
  });

  it('returns done after the last unit', () => {
    expect(advanceStep(5, 4)).toEqual({ done: true });
  });
});
