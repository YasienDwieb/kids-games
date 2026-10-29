import PostHog from 'posthog-react-native';
import type { AnalyticsSink } from '../types';

/**
 * PostHog, locked down for a kids app: anonymous events only (no person
 * profiles), no GeoIP, and nothing captured on the SDK's own initiative —
 * no lifecycle events, session replay, surveys or feature flags.
 */
export function posthogSink(options: { apiKey: string; host: string }): AnalyticsSink {
  let client: PostHog | null = null;

  // Created on first opt-in, so a parent who turned sharing off never starts it.
  const get = () =>
    (client ??= new PostHog(options.apiKey, {
      host: options.host,
      personProfiles: 'never',
      disableGeoip: true,
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
      setDefaultPersonProperties: false,
      preloadFeatureFlags: false,
      disableRemoteFeatureFlags: true,
      sendFeatureFlagEvent: false,
      disableSurveys: true,
    }));

  return {
    name: 'posthog',
    track: (event, props) => client?.capture(event, props),
    setEnabled: (enabled) => {
      if (enabled) void get().optIn();
      else void client?.optOut();
    },
    flush: async () => {
      await client?.flush();
    },
  };
}
