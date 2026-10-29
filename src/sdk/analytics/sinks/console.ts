import type { AnalyticsSink } from '../types';

/** Dev builds: log events instead of sending them anywhere. */
export function consoleSink(): AnalyticsSink {
  let on = true;
  return {
    name: 'console',
    track: (event, props) => {
      if (on) console.log('[analytics]', event, props);
    },
    setEnabled: (enabled) => {
      on = enabled;
    },
    flush: async () => undefined,
  };
}
