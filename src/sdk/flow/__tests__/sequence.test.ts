import {
  registerFlowAdapter,
  selectedAdapters,
  eligibleGameIds,
  resetFlowAdaptersForTests,
  type FlowAdapter,
} from '../adapter';
import { buildSequence, sequenceLength } from '../sequence';

const stub = (gameId: string, count: number): FlowAdapter => ({
  gameId,
  count,
  unitAt: (i) => ({ key: `${gameId}-${i}`, render: () => null }),
});

beforeEach(() => resetFlowAdaptersForTests());

describe('adapter registry', () => {
  it('reports eligible games in registration order', () => {
    registerFlowAdapter(stub('a', 2));
    registerFlowAdapter(stub('b', 3));
    expect(eligibleGameIds()).toEqual(['a', 'b']);
  });

  it('selectedAdapters: null returns all, a list filters & preserves order', () => {
    registerFlowAdapter(stub('a', 1));
    registerFlowAdapter(stub('b', 1));
    expect(selectedAdapters(null).map((a) => a.gameId)).toEqual(['a', 'b']);
    expect(selectedAdapters(['b']).map((a) => a.gameId)).toEqual(['b']);
    expect(selectedAdapters(['x', 'a']).map((a) => a.gameId)).toEqual(['a']);
  });
});

describe('buildSequence', () => {
  it('is empty with no adapters', () => {
    expect(buildSequence([])).toEqual([]);
  });

  it('round-robins evenly-sized games', () => {
    const seq = buildSequence([stub('a', 2), stub('b', 2)]);
    expect(seq).toEqual([
      { gameId: 'a', localIndex: 0 },
      { gameId: 'b', localIndex: 0 },
      { gameId: 'a', localIndex: 1 },
      { gameId: 'b', localIndex: 1 },
    ]);
  });

  it('skips an exhausted game and drains the rest', () => {
    const seq = buildSequence([stub('a', 1), stub('b', 3)]);
    expect(seq).toEqual([
      { gameId: 'a', localIndex: 0 },
      { gameId: 'b', localIndex: 0 },
      { gameId: 'b', localIndex: 1 },
      { gameId: 'b', localIndex: 2 },
    ]);
    expect(seq).toHaveLength(sequenceLength([stub('a', 1), stub('b', 3)]));
  });
});
