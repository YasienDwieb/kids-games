/**
 * Echo — engine unit tests.
 *
 * Covers: PRNG determinism, startGame, checkInput, advanceRound,
 * difficultyFor monotonicity, and full round-trip play loops.
 * No React, no React Native, no side effects.
 */

import {
  mulberry32,
  startGame,
  appendStep,
  checkInput,
  advanceRound,
  difficultyFor,
} from '../utils/engine';
import {
  INITIAL_PAD_COUNT,
  MAX_PAD_COUNT,
  PLAYBACK_LIT_MS,
  PLAYBACK_GAP_MS,
  PLAYBACK_LIT_MS_MIN,
  PLAYBACK_GAP_MS_MIN,
} from '../constants';
import type { GameState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Play through an entire sequence, tapping every pad correctly. */
function playCorrectSequence(state: GameState): GameState {
  let s = state;
  for (let i = 0; i < state.sequence.length; i++) {
    const result = checkInput(s, state.sequence[i]);
    s = result.state;
  }
  return s;
}

// ---------------------------------------------------------------------------
// mulberry32
// ---------------------------------------------------------------------------

describe('mulberry32', () => {
  it('is deterministic for the same seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const values1 = Array.from({ length: 10 }, () => r1());
    const values2 = Array.from({ length: 10 }, () => r2());
    expect(values1).toEqual(values2);
  });

  it('produces values in [0, 1)', () => {
    const r = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const r1 = mulberry32(1);
    const r2 = mulberry32(2);
    expect(r1()).not.toBe(r2());
  });
});

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------

describe('startGame', () => {
  it('starts at round 1', () => {
    const state = startGame(1);
    expect(state.round).toBe(1);
  });

  it('starts with sequence length 2', () => {
    const state = startGame(1);
    expect(state.sequence).toHaveLength(2);
  });

  it('starts in playback phase', () => {
    const state = startGame(1);
    expect(state.phase).toBe('playback');
  });

  it('starts with inputIndex 0', () => {
    const state = startGame(1);
    expect(state.inputIndex).toBe(0);
  });

  it('starts with score 0', () => {
    const state = startGame(1);
    expect(state.score).toBe(0);
  });

  it('starts with INITIAL_PAD_COUNT pads', () => {
    const state = startGame(1);
    expect(state.padCount).toBe(INITIAL_PAD_COUNT);
  });

  it('all sequence entries are valid pad IDs', () => {
    const state = startGame(7);
    for (const pad of state.sequence) {
      expect(pad).toBeGreaterThanOrEqual(0);
      expect(pad).toBeLessThan(state.padCount);
    }
  });

  it('is deterministic for the same seed', () => {
    const s1 = startGame(12345);
    const s2 = startGame(12345);
    expect(s1).toEqual(s2);
  });

  it('produces different sequences for different seeds', () => {
    const s1 = startGame(1);
    const s2 = startGame(9999);
    // At least one element should differ (extremely unlikely to match both)
    const same = JSON.stringify(s1.sequence) === JSON.stringify(s2.sequence);
    // Not guaranteed for all seeds but is true for 1 vs 9999
    expect(same).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// appendStep
// ---------------------------------------------------------------------------

describe('appendStep', () => {
  it('grows the sequence by exactly one', () => {
    const state = startGame(5);
    const next = appendStep(state, 42);
    expect(next.sequence).toHaveLength(state.sequence.length + 1);
  });

  it('preserves existing sequence prefix', () => {
    const state = startGame(5);
    const next = appendStep(state, 42);
    expect(next.sequence.slice(0, state.sequence.length)).toEqual(state.sequence);
  });

  it('new pad is within padCount bounds', () => {
    const state = startGame(3);
    const next = appendStep(state, 77);
    const newPad = next.sequence[next.sequence.length - 1];
    expect(newPad).toBeGreaterThanOrEqual(0);
    expect(newPad).toBeLessThan(state.padCount);
  });

  it('is deterministic for the same seed', () => {
    const state = startGame(1);
    const n1 = appendStep(state, 100);
    const n2 = appendStep(state, 100);
    expect(n1).toEqual(n2);
  });
});

// ---------------------------------------------------------------------------
// checkInput — correct (not last)
// ---------------------------------------------------------------------------

describe('checkInput — correct tap (not last)', () => {
  it('returns result "correct"', () => {
    const state = { ...startGame(1), phase: 'input' as const };
    const firstPad = state.sequence[0];
    const result = checkInput(state, firstPad);
    expect(result.result).toBe('correct');
  });

  it('advances inputIndex by 1', () => {
    const state = { ...startGame(1), phase: 'input' as const };
    const firstPad = state.sequence[0];
    const result = checkInput(state, firstPad);
    expect(result.state.inputIndex).toBe(1);
  });

  it('keeps phase as input', () => {
    const state = { ...startGame(1), phase: 'input' as const };
    const firstPad = state.sequence[0];
    const result = checkInput(state, firstPad);
    // sequence length is 2 — after first tap inputIndex becomes 1, still not done
    expect(result.state.phase).toBe('input');
  });

  it('does not mutate original state', () => {
    const state = { ...startGame(1), phase: 'input' as const };
    const originalIndex = state.inputIndex;
    checkInput(state, state.sequence[0]);
    expect(state.inputIndex).toBe(originalIndex);
  });
});

// ---------------------------------------------------------------------------
// checkInput — wrong tap
// ---------------------------------------------------------------------------

describe('checkInput — wrong tap', () => {
  it('returns result "wrong"', () => {
    const state = { ...startGame(1), phase: 'input' as const };
    // Find a pad that is NOT the expected one
    const expected = state.sequence[0];
    const wrong = (expected + 1) % state.padCount;
    const result = checkInput(state, wrong);
    expect(result.result).toBe('wrong');
  });

  it('sets phase to gameover', () => {
    const state = { ...startGame(1), phase: 'input' as const };
    const expected = state.sequence[0];
    const wrong = (expected + 1) % state.padCount;
    const result = checkInput(state, wrong);
    expect(result.state.phase).toBe('gameover');
  });

  it('does not change the score', () => {
    const state = { ...startGame(1), phase: 'input' as const, score: 5 };
    const expected = state.sequence[0];
    const wrong = (expected + 1) % state.padCount;
    const result = checkInput(state, wrong);
    expect(result.state.score).toBe(5);
  });

  it('wrong on second tap still triggers gameover', () => {
    let state: GameState = { ...startGame(10), phase: 'input' as const };
    // Tap first pad correctly
    const r1 = checkInput(state, state.sequence[0]);
    expect(r1.result).toBe('correct');
    state = r1.state;
    // Tap wrong on second
    const expected = state.sequence[state.inputIndex];
    const wrong = (expected + 1) % state.padCount;
    const r2 = checkInput(state, wrong);
    expect(r2.result).toBe('wrong');
    expect(r2.state.phase).toBe('gameover');
  });
});

// ---------------------------------------------------------------------------
// checkInput — round-complete (last correct tap)
// ---------------------------------------------------------------------------

describe('checkInput — round-complete (last correct tap)', () => {
  it('returns result "round-complete" after last correct tap', () => {
    const base = startGame(1);
    const state = { ...base, phase: 'input' as const };
    const final = playCorrectSequence(state);
    expect(final.phase).toBe('win');
  });

  it('sets phase to win', () => {
    const state = { ...startGame(2), phase: 'input' as const };
    const final = playCorrectSequence(state);
    expect(final.phase).toBe('win');
  });

  it('updates score to sequence length', () => {
    const state = { ...startGame(3), phase: 'input' as const };
    const final = playCorrectSequence(state);
    expect(final.score).toBe(state.sequence.length);
  });

  it('last checkInput result is round-complete', () => {
    const base = startGame(4);
    let s: GameState = { ...base, phase: 'input' as const };
    let lastResult: ReturnType<typeof checkInput> | null = null;
    for (let i = 0; i < base.sequence.length; i++) {
      lastResult = checkInput(s, base.sequence[i]);
      s = lastResult.state;
    }
    expect(lastResult?.result).toBe('round-complete');
  });
});

// ---------------------------------------------------------------------------
// advanceRound
// ---------------------------------------------------------------------------

describe('advanceRound', () => {
  function completedRound1(): GameState {
    const base = startGame(7);
    return playCorrectSequence({ ...base, phase: 'input' as const });
  }

  it('increments round by 1', () => {
    const won = completedRound1();
    const next = advanceRound(won, 200);
    expect(next.round).toBe(2);
  });

  it('grows sequence by exactly one', () => {
    const won = completedRound1();
    const next = advanceRound(won, 200);
    expect(next.sequence).toHaveLength(won.sequence.length + 1);
  });

  it('preserves the existing sequence prefix', () => {
    const won = completedRound1();
    const next = advanceRound(won, 200);
    expect(next.sequence.slice(0, won.sequence.length)).toEqual(won.sequence);
  });

  it('resets inputIndex to 0', () => {
    const won = completedRound1();
    const next = advanceRound(won, 200);
    expect(next.inputIndex).toBe(0);
  });

  it('sets phase to playback', () => {
    const won = completedRound1();
    const next = advanceRound(won, 200);
    expect(next.phase).toBe('playback');
  });

  it('is deterministic for the same seed', () => {
    const won = completedRound1();
    const n1 = advanceRound(won, 42);
    const n2 = advanceRound(won, 42);
    expect(n1).toEqual(n2);
  });

  it('new pad is within padCount bounds', () => {
    const won = completedRound1();
    const next = advanceRound(won, 300);
    const newPad = next.sequence[next.sequence.length - 1];
    expect(newPad).toBeGreaterThanOrEqual(0);
    expect(newPad).toBeLessThan(next.padCount);
  });
});

// ---------------------------------------------------------------------------
// Full multi-round play loop
// ---------------------------------------------------------------------------

describe('full play loop (deterministic)', () => {
  it('score equals sequence length after each completed round', () => {
    let state = startGame(999);
    for (let round = 1; round <= 5; round++) {
      state = { ...state, phase: 'input' as const };
      const expectedScore = state.sequence.length;
      state = playCorrectSequence(state);
      expect(state.score).toBe(expectedScore);
      if (round < 5) {
        state = advanceRound(state, round * 137);
      }
    }
  });

  it('sequence grows by one each round for 6 rounds', () => {
    let state = startGame(555);
    const lengths: number[] = [state.sequence.length];
    for (let i = 0; i < 5; i++) {
      state = { ...state, phase: 'input' as const };
      state = playCorrectSequence(state);
      state = advanceRound(state, i * 100 + 1);
      lengths.push(state.sequence.length);
    }
    // Each step should be exactly 1 longer than the previous
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBe(lengths[i - 1] + 1);
    }
  });

  it('seeded run is fully deterministic end-to-end', () => {
    function simulate(rootSeed: number): GameState {
      let s = startGame(rootSeed);
      for (let r = 0; r < 4; r++) {
        s = { ...s, phase: 'input' as const };
        s = playCorrectSequence(s);
        s = advanceRound(s, rootSeed + r * 17);
      }
      return s;
    }
    expect(simulate(12345)).toEqual(simulate(12345));
  });

  it('wrong tap on round 3 yields score = length of round-2 sequence', () => {
    let state = startGame(77);
    // Complete rounds 1 and 2
    for (let r = 0; r < 2; r++) {
      state = { ...state, phase: 'input' as const };
      state = playCorrectSequence(state);
      state = advanceRound(state, r * 50 + 1);
    }
    // Start round 3 input, but tap wrong immediately
    state = { ...state, phase: 'input' as const };
    const scoreBeforeWrong = state.score;
    const expected = state.sequence[0];
    const wrong = (expected + 1) % state.padCount;
    const result = checkInput(state, wrong);
    expect(result.result).toBe('wrong');
    expect(result.state.phase).toBe('gameover');
    // Score should not have changed since the last completed round
    expect(result.state.score).toBe(scoreBeforeWrong);
  });
});

// ---------------------------------------------------------------------------
// checkInput — phase guard (terminal phases)
// ---------------------------------------------------------------------------

describe('checkInput — phase guard on terminal phases', () => {
  it('returns "wrong" without changing state when phase is gameover', () => {
    const base = startGame(1);
    const terminal: GameState = { ...base, phase: 'gameover' };
    const result = checkInput(terminal, terminal.sequence[0]);
    expect(result.result).toBe('wrong');
    expect(result.state).toBe(terminal); // same reference — no new object
  });

  it('returns "wrong" without changing state when phase is win', () => {
    const base = { ...startGame(2), phase: 'input' as const };
    let s: GameState = base;
    for (let i = 0; i < base.sequence.length; i++) {
      s = checkInput(s, base.sequence[i]).state;
    }
    // s.phase should now be 'win'
    expect(s.phase).toBe('win');
    const snap = s;
    const result = checkInput(snap, snap.sequence[0]);
    expect(result.result).toBe('wrong');
    expect(result.state).toBe(snap);
  });

  it('does not advance inputIndex when phase is gameover', () => {
    const terminal: GameState = { ...startGame(3), phase: 'gameover' };
    const result = checkInput(terminal, terminal.sequence[0]);
    expect(result.state.inputIndex).toBe(terminal.inputIndex);
  });

  it('does not change phase when already gameover', () => {
    const terminal: GameState = { ...startGame(4), phase: 'gameover' };
    const result = checkInput(terminal, terminal.sequence[0]);
    expect(result.state.phase).toBe('gameover');
  });
});

// ---------------------------------------------------------------------------
// difficultyFor — monotonic ramp
// ---------------------------------------------------------------------------

describe('difficultyFor', () => {
  it('round 1 uses INITIAL_PAD_COUNT', () => {
    expect(difficultyFor(1).padCount).toBe(INITIAL_PAD_COUNT);
  });

  it('padCount never exceeds MAX_PAD_COUNT', () => {
    for (let r = 1; r <= 50; r++) {
      expect(difficultyFor(r).padCount).toBeLessThanOrEqual(MAX_PAD_COUNT);
    }
  });

  it('padCount is monotonically non-decreasing', () => {
    for (let r = 1; r < 30; r++) {
      expect(difficultyFor(r + 1).padCount).toBeGreaterThanOrEqual(difficultyFor(r).padCount);
    }
  });

  it('litMs is monotonically non-increasing (gets faster)', () => {
    for (let r = 1; r < 30; r++) {
      expect(difficultyFor(r + 1).litMs).toBeLessThanOrEqual(difficultyFor(r).litMs);
    }
  });

  it('gapMs is monotonically non-increasing (gets faster)', () => {
    for (let r = 1; r < 30; r++) {
      expect(difficultyFor(r + 1).gapMs).toBeLessThanOrEqual(difficultyFor(r).gapMs);
    }
  });

  it('litMs never goes below PLAYBACK_LIT_MS_MIN', () => {
    for (let r = 1; r <= 50; r++) {
      expect(difficultyFor(r).litMs).toBeGreaterThanOrEqual(PLAYBACK_LIT_MS_MIN);
    }
  });

  it('gapMs never goes below PLAYBACK_GAP_MS_MIN', () => {
    for (let r = 1; r <= 50; r++) {
      expect(difficultyFor(r).gapMs).toBeGreaterThanOrEqual(PLAYBACK_GAP_MS_MIN);
    }
  });

  it('round 1 litMs equals PLAYBACK_LIT_MS (starting value)', () => {
    expect(difficultyFor(1).litMs).toBe(PLAYBACK_LIT_MS);
  });

  it('round 1 gapMs equals PLAYBACK_GAP_MS (starting value)', () => {
    expect(difficultyFor(1).gapMs).toBe(PLAYBACK_GAP_MS);
  });

  it('eventually reaches MAX_PAD_COUNT', () => {
    const highRound = difficultyFor(20);
    expect(highRound.padCount).toBe(MAX_PAD_COUNT);
  });

  it('is deterministic (no randomness)', () => {
    for (let r = 1; r <= 20; r++) {
      expect(difficultyFor(r)).toEqual(difficultyFor(r));
    }
  });
});
