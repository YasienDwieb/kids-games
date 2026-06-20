// src/sdk/flow/__tests__/useFlow.test.tsx
import { act, create } from 'react-test-renderer';
import { useEffect } from 'react';
import { useFlow, type UseFlowResult } from '../useFlow';
import {
  registerFlowAdapter, getAllFlowAdapters, resetFlowAdaptersForTests, type FlowAdapter,
} from '../adapter';
import { createFlowProgressStore, DEFAULT_FLOW_PROGRESS } from '../progress';

// Probe component: surfaces the hook result to the test via a ref callback.
function Probe({ onResult }: { onResult: (r: UseFlowResult) => void }) {
  const r = useFlow({ adapters: getAllFlowAdapters() });
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
