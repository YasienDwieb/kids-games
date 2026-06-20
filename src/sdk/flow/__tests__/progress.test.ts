import { resolveStart, advancePosition, DEFAULT_FLOW_PROGRESS, type FlowProgress } from '../progress';
import type { Topic } from '../curriculum';

const topics: Topic[] = [
  { id: 't1', unitIds: ['a', 'b'] },
  { id: 't2', unitIds: ['c'] },
];

describe('resolveStart', () => {
  it('returns done when there are no topics', () => {
    expect(resolveStart([], DEFAULT_FLOW_PROGRESS)).toEqual({ done: true });
  });
  it('starts at first topic when nothing saved', () => {
    expect(resolveStart(topics, DEFAULT_FLOW_PROGRESS)).toEqual({ done: false, topicId: 't1', unitIndex: 0 });
  });
  it('resumes a saved valid position', () => {
    const saved: FlowProgress = { topicId: 't1', unitIndex: 1, updatedAt: 1 };
    expect(resolveStart(topics, saved)).toEqual({ done: false, topicId: 't1', unitIndex: 1 });
  });
  it('clamps an out-of-range saved index', () => {
    const saved: FlowProgress = { topicId: 't2', unitIndex: 9, updatedAt: 1 };
    expect(resolveStart(topics, saved)).toEqual({ done: false, topicId: 't2', unitIndex: 0 });
  });
  it('falls back to first topic when saved topic is gone', () => {
    const saved: FlowProgress = { topicId: 'ghost', unitIndex: 0, updatedAt: 1 };
    expect(resolveStart(topics, saved)).toEqual({ done: false, topicId: 't1', unitIndex: 0 });
  });
});

describe('advancePosition', () => {
  it('advances within a topic', () => {
    expect(advancePosition(topics, { topicId: 't1', unitIndex: 0 })).toEqual({ done: false, topicId: 't1', unitIndex: 1 });
  });
  it('rolls into the next topic', () => {
    expect(advancePosition(topics, { topicId: 't1', unitIndex: 1 })).toEqual({ done: false, topicId: 't2', unitIndex: 0 });
  });
  it('returns done after the last unit of the last topic', () => {
    expect(advancePosition(topics, { topicId: 't2', unitIndex: 0 })).toEqual({ done: true });
  });
});
