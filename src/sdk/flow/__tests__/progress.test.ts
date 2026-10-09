import {
  resolveStart,
  advanceStep,
  DEFAULT_FLOW_PROGRESS,
  doneCounts,
  firstOpenStep,
  resumeStep,
  legacySequence,
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

describe('legacy step-only saves', () => {
  const ad = (gameId: string, count: number): FlowAdapter => ({
    gameId,
    count,
    unitAt: () => ({ key: '', render: () => null }),
  });
  const current = [
    ad('count-and-pop', 2), ad('shape-detective', 2), ad('match-up', 2),
    ad('letter-land', 28), ad('numbers-land', 2), ad('animal-safari', 2),
    ad('simple-pairs', 2), ad('mouse-maze', 2), ad('color-mixer', 2), ad('candy-catch', 2),
  ];
  const old = ['count-and-pop', 'shape-detective', 'match-up', 'numbers-land', 'animal-safari'];
  const added = ['simple-pairs', 'mouse-maze', 'color-mixer', 'candy-catch'];

  it('credits the step against the old journey, leaving new games untouched', () => {
    const done = doneCounts(legacySequence(current), { step: 14, seed: 1, updatedAt: 1 });
    for (const id of old) expect(done[id]).toBe(2);
    expect(done['letter-land']).toBe(4);
    for (const id of added) expect(done[id] ?? 0).toBe(0);
    // Resume lands on the first new game's first unit, not a replay or skip.
    expect(buildSequence(current)[firstOpenStep(buildSequence(current), done)]).toEqual({
      gameId: 'simple-pairs', localIndex: 0,
    });
  });

  it('caps letter-land at its old 26 units so the 2 new Arabic letters stay open', () => {
    const done = doneCounts(legacySequence(current), { step: 999, seed: 1, updatedAt: 1 });
    expect(done['letter-land']).toBe(26);
    const seq = buildSequence(current.filter((a) => a.gameId === 'letter-land'));
    expect(firstOpenStep(seq, done)).toBe(26);
  });

  it('respects the parent\'s game subset', () => {
    const subset = current.filter((a) => ['match-up', 'letter-land', 'mouse-maze'].includes(a.gameId));
    // Old journey for this subset: match-up0 letter-land0 match-up1 …
    expect(doneCounts(legacySequence(subset), { step: 3, seed: 1, updatedAt: 1 })).toEqual({
      'match-up': 2, 'letter-land': 1,
    });
  });
});
