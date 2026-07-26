import { makeChallenge } from '../ParentGate';

/**
 * The gate is the only thing standing between a child and the controls that
 * break their own experience (language switch, age filter, journey reset), so
 * its challenge generation is worth pinning down.
 */
describe('makeChallenge', () => {
  const rounds = Array.from({ length: 400 }, () => makeChallenge());

  it('always offers exactly three distinct choices', () => {
    for (const c of rounds) {
      expect(c.choices).toHaveLength(3);
      expect(new Set(c.choices).size).toBe(3);
    }
  });

  it('always includes the correct answer', () => {
    for (const c of rounds) {
      expect(c.choices).toContain(c.answer);
      expect(c.answer).toBe(c.a * c.b);
    }
  });

  it('keeps operands hard enough to stop a 10 year old', () => {
    for (const c of rounds) {
      expect(c.a).toBeGreaterThanOrEqual(6);
      expect(c.a).toBeLessThanOrEqual(9);
      expect(c.b).toBeGreaterThanOrEqual(6);
      expect(c.b).toBeLessThanOrEqual(9);
    }
  });

  it('never offers a zero or negative decoy', () => {
    for (const c of rounds) {
      for (const choice of c.choices) expect(choice).toBeGreaterThan(0);
    }
  });

  it('does not always put the answer in the same slot', () => {
    const slots = new Set(rounds.map((c) => c.choices.indexOf(c.answer)));
    expect(slots.size).toBeGreaterThan(1);
  });
});
