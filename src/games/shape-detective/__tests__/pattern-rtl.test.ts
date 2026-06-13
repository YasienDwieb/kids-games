/**
 * Regression test: RTL correctIndex alignment for PatternPuzzle.
 *
 * Bug that was fixed (PR: RTL pattern puzzle marks wrong option correct):
 *   PatternPuzzle.tsx previously applied `direction: 'ltr'` to the sequence
 *   ScrollView when I18nManager.isRTL was true. This pinned the visual ? slot
 *   to the physical right end. An Arabic child reads right-to-left, so the slot
 *   they perceive as "next" is at the physical LEFT — the opposite end from where
 *   the LTR-pinned layout placed the ?. Presentation and reading direction
 *   disagreed, causing the wrong option to be marked correct for RTL users.
 *
 * Fix applied (Option B):
 *   The `direction: 'ltr'` pin and the `ltrRow` style were removed from the
 *   sequence ScrollView. The row now reverses naturally in RTL flex, so the ?
 *   slot sits at the right end for LTR and the left end for RTL — matching the
 *   natural reading direction in both locales. Because Shape Detective patterns
 *   are attribute cycles (not spatial timelines), a reversed row is logically
 *   identical. The correctIndex produced by generate.ts is unchanged and now
 *   aligns with the perceived "next" position in both LTR and RTL.
 *
 * Tests in this file:
 *   (a) Source-level guard — asserts PatternPuzzle.tsx does NOT contain a
 *       direction:'ltr' pin on the sequence row. Fails immediately if someone
 *       re-introduces the bug.
 *   (b) Semantic continuation — asserts options[correctIndex] is the shape that
 *       continues the cycle, across multiple seeds and attribute combinations.
 *       Includes the canonical ♥◆♥◆→♥ example (encoded as kind-only, cycleLen=2).
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildPatternPuzzle } from '../utils/generate';

// ---------------------------------------------------------------------------
// (a) Source-level guard: no ltr pin on the sequence row
// ---------------------------------------------------------------------------

describe('PatternPuzzle source: no ltr pin on sequence row', () => {
  const componentPath = path.resolve(
    __dirname,
    '../components/PatternPuzzle.tsx',
  );
  const source = fs.readFileSync(componentPath, 'utf8');

  it('ltrRow style is not defined in the stylesheet', () => {
    // The old bug had: ltrRow: { direction: 'ltr' as const }
    expect(source).not.toMatch(/ltrRow\s*:/);
  });

  it('I18nManager.isRTL is not used to apply an ltrRow / direction pin to the sequence scroll', () => {
    // The old bug had: I18nManager.isRTL && styles.ltrRow  on the ScrollView
    // Guard: no expression of the form  isRTL && styles.ltrRow
    expect(source).not.toMatch(/isRTL\s*&&\s*styles\.ltrRow/);
  });

  it('no direction:ltr in non-comment code lines', () => {
    // Catch a potential re-introduction as a style property (inline or in
    // StyleSheet.create) anywhere in PatternPuzzle.tsx.
    //
    // PatternPuzzle has no drag surface, so direction:'ltr' must never appear
    // as actual code — only (optionally) in comments documenting the absence.
    //
    // Strip comment lines (lines whose first non-whitespace chars are * or //)
    // before searching, so a comment like "no direction:'ltr' pin" does not
    // trigger the guard.
    const codeLines = source
      .split('\n')
      .filter((line) => !/^\s*(\*|\/\/)/.test(line))
      .join('\n');

    const ltrCount = (codeLines.match(/direction\s*:\s*['"]ltr['"]/g) ?? []).length;
    expect(ltrCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// (b) Semantic continuation: options[correctIndex] continues the cycle
// ---------------------------------------------------------------------------

describe('buildPatternPuzzle: correctIndex always continues the cycle', () => {
  function shapesEqual(
    a: { kind: string; color: string; size: string },
    b: { kind: string; color: string; size: string },
  ) {
    return a.kind === b.kind && a.color === b.color && a.size === b.size;
  }

  /**
   * Core invariant: the last visible shape in the sequence and the correct
   * option must differ in a way consistent with the cycle, AND the sequence
   * elements must be consistent (positions 0, cycleLen, 2*cycleLen … are
   * the same shape; positions 1, cycleLen+1, … are the same shape, etc.).
   *
   * Additionally: options[correctIndex] must equal the shape at
   * sequence.length % cycleLen in the cycle — that is, it is the
   * continuation of the repeating pattern.
   */
  function assertContinuation(
    seed: number,
    attrs: ReadonlyArray<'kind' | 'color' | 'size'>,
    optCount: number,
  ) {
    const puzzle = buildPatternPuzzle(seed, attrs, optCount);
    const { sequence, options, correctIndex } = puzzle;

    expect(options.length).toBe(optCount);
    expect(correctIndex).toBeGreaterThanOrEqual(0);
    expect(correctIndex).toBeLessThan(optCount);

    // Determine cycle length from sequence (2 for single attr, 3 for 2+)
    const cycleLen = attrs.length >= 2 ? 3 : 2;

    // The cycle is the first cycleLen shapes of the sequence
    const cycle = sequence.slice(0, cycleLen);

    // Every subsequent shape must equal its cycle counterpart
    for (let i = cycleLen; i < sequence.length; i++) {
      expect(shapesEqual(sequence[i], cycle[i % cycleLen])).toBe(true);
    }

    // The correct answer must equal the next step in the cycle
    const expectedNext = cycle[sequence.length % cycleLen];
    const actualAnswer = options[correctIndex];

    expect(shapesEqual(actualAnswer, expectedNext)).toBe(true);

    // Every distractor must differ from the correct answer
    options.forEach((opt, i) => {
      if (i !== correctIndex) {
        expect(shapesEqual(opt, actualAnswer)).toBe(false);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Canonical example: kind-only cycle of length 2 (analogous to ♥◆♥◆ → ♥)
  // After 2 full reps the sequence is [A,B,A,B]; next must be A = cycle[0].
  // This is the exact scenario the RTL bug broke: an Arabic child reading
  // right-to-left saw the ? on the wrong end of the pinned-LTR row.
  // --------------------------------------------------------------------------
  it('kind-only (cycleLen=2) seed=1: options[correctIndex] continues ♥◆♥◆-style cycle', () => {
    assertContinuation(1, ['kind'], 3);
  });

  it('kind-only (cycleLen=2) seed=7: continuation holds', () => {
    assertContinuation(7, ['kind'], 3);
  });

  it('kind-only (cycleLen=2) seed=42: continuation holds', () => {
    assertContinuation(42, ['kind'], 3);
  });

  // --------------------------------------------------------------------------
  // Two attributes (cycleLen=3)
  // --------------------------------------------------------------------------
  it('kind+color (cycleLen=3) seed=100: options[correctIndex] continues the cycle', () => {
    assertContinuation(100, ['kind', 'color'], 4);
  });

  it('kind+color (cycleLen=3) seed=9999: continuation holds', () => {
    assertContinuation(9999, ['kind', 'color'], 4);
  });

  it('color+size (cycleLen=3) seed=200: continuation holds', () => {
    assertContinuation(200, ['color', 'size'], 4);
  });

  // --------------------------------------------------------------------------
  // Three attributes (cycleLen=3)
  // --------------------------------------------------------------------------
  it('kind+color+size (cycleLen=3) seed=55: continuation holds with 5 options', () => {
    assertContinuation(55, ['kind', 'color', 'size'], 5);
  });

  it('kind+color+size (cycleLen=3) seed=12345: continuation holds', () => {
    assertContinuation(12345, ['kind', 'color', 'size'], 5);
  });

  // --------------------------------------------------------------------------
  // Cross-seed sweep: assert for seeds 1..30 with varying config
  // --------------------------------------------------------------------------
  it('continuation holds for seeds 1..30, single attribute, 3 options', () => {
    for (let seed = 1; seed <= 30; seed++) {
      assertContinuation(seed, ['kind'], 3);
    }
  });

  it('continuation holds for seeds 1..30, two attributes, 4 options', () => {
    for (let seed = 1; seed <= 30; seed++) {
      assertContinuation(seed, ['kind', 'color'], 4);
    }
  });

  it('continuation holds for seeds 1..30, three attributes, 5 options', () => {
    for (let seed = 1; seed <= 30; seed++) {
      assertContinuation(seed, ['kind', 'color', 'size'], 5);
    }
  });
});
