import { makeActor } from '../actors';
import { planTransition } from '../transition';

const A = (id: string, x: number) => makeActor({ id, x, y: 0, content: id });

describe('planTransition', () => {
  it('matches shared ids and keeps from/to geometry', () => {
    const plan = planTransition([A('s1', 0)], [A('s1', 100)]);
    expect(plan.matched).toHaveLength(1);
    expect(plan.matched[0].from.x).toBe(0);
    expect(plan.matched[0].to.x).toBe(100);
    expect(plan.entering).toHaveLength(0);
    expect(plan.leaving).toHaveLength(0);
  });
  it('classifies entering and leaving ids', () => {
    const plan = planTransition([A('s1', 0), A('s2', 0)], [A('s2', 0), A('s3', 0)]);
    expect(plan.matched.map((m) => m.id)).toEqual(['s2']);
    expect(plan.entering.map((a) => a.id)).toEqual(['s3']);
    expect(plan.leaving.map((a) => a.id)).toEqual(['s1']);
  });
  it('takes content from the target on match', () => {
    const plan = planTransition(
      [makeActor({ id: 's1', x: 0, y: 0, content: 'old' })],
      [makeActor({ id: 's1', x: 0, y: 0, content: 'new' })],
    );
    expect(plan.matched[0].content).toBe('new');
  });
});
