import {
  registerFlowUnit, getFlowUnit, registerTopic, getAllTopics,
  activeTopics, resetFlowRegistryForTests, type FlowUnit, type Topic,
} from '../curriculum';

const stubUnit = (id: string, topicId: string): FlowUnit => ({
  id, topicId,
  enterActors: () => [],
  exitActors: () => [],
  Component: () => null,
});

beforeEach(() => resetFlowRegistryForTests());

describe('flow registry', () => {
  it('registers and retrieves units', () => {
    registerFlowUnit(stubUnit('u1', 't1'));
    expect(getFlowUnit('u1')?.topicId).toBe('t1');
    expect(getFlowUnit('nope')).toBeUndefined();
  });
  it('keeps topics in insertion order', () => {
    registerTopic({ id: 'a', unitIds: ['u1'] });
    registerTopic({ id: 'b', unitIds: ['u2'] });
    expect(getAllTopics().map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('activeTopics', () => {
  const all: Topic[] = [{ id: 'a', unitIds: [] }, { id: 'b', unitIds: [] }];
  it('returns all when filter is null', () => {
    expect(activeTopics(all, null)).toEqual(all);
  });
  it('filters and preserves authored order', () => {
    expect(activeTopics(all, ['b']).map((t) => t.id)).toEqual(['b']);
  });
  it('ignores unknown ids', () => {
    expect(activeTopics(all, ['x', 'a']).map((t) => t.id)).toEqual(['a']);
  });
});
