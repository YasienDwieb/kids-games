import { reportError } from '../../errors/report';
import { getContentConfig, loadContentConfig, resetContentConfigForTests } from '../load';
import { SAFE_DEFAULT } from '../validate';

jest.mock('../../errors/report', () => ({ reportError: jest.fn() }));
const report = reportError as jest.MockedFunction<typeof reportError>;

beforeEach(() => {
  report.mockClear();
  resetContentConfigForTests();
});

describe('content config loading', () => {
  // protects=a clean config never produces an app_error; fails_when=reportError fires for valid input; no_claim=reportError is mocked, so the analytics event itself is not checked
  it('does not report a clean config', () => {
    const config = getContentConfig();
    expect(config.schemaVersion).toBe(1);
    expect(report).not.toHaveBeenCalled();
  });

  // protects=a bad config is reported exactly once with every problem in it; fails_when=it is reported zero or several times, or under another `where`; no_claim=reportError is mocked
  it('reports a broken config once and falls back', () => {
    const config = loadContentConfig({ schemaVersion: 1, revision: 'x', catalogue: { order: [1, 2] }, themes: {}, moments: {} });
    expect(config.catalogue.order).toEqual([]);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report.mock.calls[0][1]).toBe('content-config');
    expect(String(report.mock.calls[0][0])).toMatch(/catalogue\.order.*;.*catalogue\.order/);
    expect(loadContentConfig('garbage')).toBe(SAFE_DEFAULT);
    expect(report).toHaveBeenCalledTimes(2);
  });

  // protects=the config is validated once per launch, not on every read; fails_when=repeated reads return different objects; no_claim=none beyond protects
  it('caches the loaded config', () => {
    expect(getContentConfig()).toBe(getContentConfig());
  });
});
