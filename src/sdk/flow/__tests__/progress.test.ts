import {
  resolveStart,
  advanceStep,
  DEFAULT_FLOW_PROGRESS,
  doneCounts,
  firstOpenStep,
  resumeStep,
} from '../progress';
import { buildSequence } from '../sequence';
import type { FlowAdapter } from '../adapter';

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

describe('per-game resume (game list can change)', () => {
  const ad = (gameId: string, count: number): FlowAdapter => ({
    gameId,
    count,
    unitAt: () => ({ key: '', render: () => null }),
  });

  it('derives per-game progress from an old step-only save', () => {
    const seq = buildSequence([ad('a', 2), ad('b', 2)]); // a0 b0 a1 b1
    expect(doneCounts(seq, { step: 3, seed: 1, updatedAt: 1 })).toEqual({ a: 2, b: 1 });
    expect(resumeStep(seq, { step: 3, seed: 1, updatedAt: 1 })).toBe(3);
  });

  it('keeps finished rounds finished when a game is added', () => {
    const saved = { step: 2, seed: 1, updatedAt: 1, done: { a: 1, b: 1 } };
    // A new game c now sits between a and b: a0 c0 b0 a1 c1 b1.
    const seq = buildSequence([ad('a', 2), ad('c', 2), ad('b', 2)]);
    expect(resumeStep(seq, saved)).toBe(1); // c0 — the new game's first round
    // a0 and b0 still count as done; nothing is replayed.
    expect(firstOpenStep(seq, { ...saved.done, c: 1 })).toBe(3); // a1
  });

  it('skips a game the parent turned off without losing others', () => {
    const saved = { step: 3, seed: 1, updatedAt: 1, done: { a: 2, b: 1 } };
    const seq = buildSequence([ad('b', 2)]); // only b left: b0 b1
    expect(resumeStep(seq, saved)).toBe(1);
  });
});
