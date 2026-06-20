// src/sdk/flow/__tests__/useFlow.test.tsx
import { act, create } from 'react-test-renderer';
import { useEffect } from 'react';
import { useFlow, type UseFlowResult } from '../useFlow';
import {
  registerFlowUnit, registerTopic, resetFlowRegistryForTests, getAllTopics,
} from '../curriculum';
import { createFlowProgressStore, DEFAULT_FLOW_PROGRESS } from '../progress';

// Probe component: surfaces the hook result to the test via a ref callback.
function Probe({ onResult }: { onResult: (r: UseFlowResult) => void }) {
  const r = useFlow({ topics: getAllTopics() });
  useEffect(() => { onResult(r); });
  return null;
}

const stub = (id: string, topicId: string) => ({
  id, topicId, enterActors: () => [], exitActors: () => [], Component: () => null,
});

beforeEach(async () => {
  resetFlowRegistryForTests();
  await createFlowProgressStore().set(DEFAULT_FLOW_PROGRESS);
  registerFlowUnit(stub('a', 't1'));
  registerFlowUnit(stub('b', 't1'));
  registerTopic({ id: 't1', unitIds: ['a', 'b'] });
});

it('starts playing on the first unit then advances to done', async () => {
  let latest: UseFlowResult | null = null;
  await act(async () => {
    create(<Probe onResult={(r) => { latest = r; }} />);
  });
  // settle the async load
  await act(async () => { await Promise.resolve(); });
  expect(latest!.status).toBe('playing');
  expect(latest!.unit?.id).toBe('a');

  await act(async () => { latest!.advance(); });
  expect(latest!.unit?.id).toBe('b');

  await act(async () => { latest!.advance(); });
  expect(latest!.status).toBe('done');
});
