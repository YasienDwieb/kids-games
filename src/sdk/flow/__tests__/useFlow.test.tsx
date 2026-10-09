// src/sdk/flow/__tests__/useFlow.test.tsx
import { act, create } from 'react-test-renderer';
import { useEffect, useMemo } from 'react';
import { useFlow, type UseFlowResult } from '../useFlow';
import {
  registerFlowAdapter, getAllFlowAdapters, selectedAdapters, resetFlowAdaptersForTests, type FlowAdapter,
} from '../adapter';
import { createFlowProgressStore, DEFAULT_FLOW_PROGRESS } from '../progress';

// Probe component: surfaces the hook result to the test via a ref callback.
function Probe({ onResult }: { onResult: (r: UseFlowResult) => void }) {
  const r = useFlow({ adapters: getAllFlowAdapters() });
  useEffect(() => { onResult(r); });
  return null;
}

function SubsetProbe({ ids, onResult }: { ids: string[]; onResult: (r: UseFlowResult) => void }) {
  const adapters = useMemo(() => selectedAdapters(ids), [ids]);
  const r = useFlow({ adapters });
  useEffect(() => { onResult(r); });
  return null;
}

const stub = (gameId: string, count: number): FlowAdapter => ({
  gameId,
  count,
  unitAt: (i) => ({ key: `${gameId}-${i}`, render: () => null }),
});

beforeEach(async () => {
  resetFlowAdaptersForTests();
  await createFlowProgressStore().set(DEFAULT_FLOW_PROGRESS);
  // Two games, one unit each → interleaved journey of length 2.
  registerFlowAdapter(stub('a', 1));
  registerFlowAdapter(stub('b', 1));
});

it('starts on the first game then mashes to the second, then done', async () => {
  let latest: UseFlowResult | null = null;
  await act(async () => {
    create(<Probe onResult={(r) => { latest = r; }} />);
  });
  // settle the async load
  await act(async () => { await Promise.resolve(); });
  expect(latest!.status).toBe('playing');
  expect(latest!.total).toBe(2);
  expect(latest!.unit?.key).toBe('a-0');

  await act(async () => { latest!.advance(); });
  expect(latest!.unit?.key).toBe('b-0');

  await act(async () => { latest!.advance(); });
  expect(latest!.status).toBe('done');
});

it('re-places the child when the game subset loads after the checkpoint', async () => {
  await createFlowProgressStore().set({ step: 1, seed: 7, updatedAt: 1, done: { a: 1 } });
  let latest: UseFlowResult | null = null;
  const all = ['a', 'b'];
  let root!: ReturnType<typeof create>;
  await act(async () => {
    root = create(<SubsetProbe ids={all} onResult={(r) => { latest = r; }} />);
  });
  await act(async () => { await Promise.resolve(); });
  expect(latest!.unit?.key).toBe('b-0');

  const onlyB = ['b'];
  await act(async () => {
    root.update(<SubsetProbe ids={onlyB} onResult={(r) => { latest = r; }} />);
  });
  expect(latest!.status).toBe('playing');
  expect(latest!.step).toBe(0);
  expect(latest!.unit?.key).toBe('b-0');
});
