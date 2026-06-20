import '@/flow'; // side-effect: registers units + the four topic
import { getAllTopics, getFlowUnit } from '@/sdk';

describe('four topic registration', () => {
  it('registers the four topic with both units in order', () => {
    const four = getAllTopics().find((t) => t.id === 'four');
    expect(four?.unitIds).toEqual(['four-count', 'four-shapes']);
  });
  it('registers both units', () => {
    expect(getFlowUnit('four-count')?.topicId).toBe('four');
    expect(getFlowUnit('four-shapes')?.topicId).toBe('four');
  });
});
