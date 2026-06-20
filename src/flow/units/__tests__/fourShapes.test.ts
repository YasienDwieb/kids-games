import { fourShapes, fourShapesActors, buildFourPuzzle } from '../fourShapes';

const ctx = { width: 800, height: 400, rng: () => 0.5 };

describe('fourShapes', () => {
  it('produces 4 star actors sharing ids with the counting unit', () => {
    const actors = fourShapesActors(ctx);
    expect(actors.map((a) => a.id)).toEqual(['star-0', 'star-1', 'star-2', 'star-3']);
  });
  it('exposes a deterministic odd-one-out index in range', () => {
    const puzzle = buildFourPuzzle();
    expect(puzzle.correctIndex).toBeGreaterThanOrEqual(0);
    expect(puzzle.correctIndex).toBeLessThan(4);
    // determinism: same seed → same odd index
    expect(buildFourPuzzle().correctIndex).toBe(puzzle.correctIndex);
  });
  it('is registered under the four topic', () => {
    expect(fourShapes.id).toBe('four-shapes');
    expect(fourShapes.topicId).toBe('four');
  });
});
