/**
 * Boot-time wiring, imported by App.tsx only (kept out of the @/sdk barrel so
 * tests never load a vendor SDK). The backend is picked by EAS env vars, so
 * forks and local builds without a key send nothing:
 *   EXPO_PUBLIC_ANALYTICS_PROVIDER  posthog
 *   EXPO_PUBLIC_ANALYTICS_KEY       the project's public ingest key
 *   EXPO_PUBLIC_ANALYTICS_HOST      optional, defaults to PostHog EU
 *   EXPO_PUBLIC_ANALYTICS_IN_DEV    1 = send from dev builds too
 */
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { setupAnalytics, track } from './client';
import { consoleSink } from './sinks/console';
import type { AnalyticsSink, EventProps } from './types';

const PROVIDER = process.env.EXPO_PUBLIC_ANALYTICS_PROVIDER;
const KEY = process.env.EXPO_PUBLIC_ANALYTICS_KEY;
const HOST = process.env.EXPO_PUBLIC_ANALYTICS_HOST || 'https://eu.i.posthog.com';
const IN_DEV = process.env.EXPO_PUBLIC_ANALYTICS_IN_DEV === '1';

function sinks(): AnalyticsSink[] {
  if (KEY && PROVIDER === 'posthog' && (!__DEV__ || IN_DEV)) {
    // Required lazily so builds without a key never initialise the vendor SDK.
    const { posthogSink } = require('./sinks/posthog') as typeof import('./sinks/posthog');
    return [posthogSink({ apiKey: KEY, host: HOST })];
  }
  return __DEV__ ? [consoleSink()] : [];
}

function context(): EventProps {
  return {
    appVersion: Application.nativeApplicationVersion,
    build: Application.nativeBuildVersion,
    updateId: Updates.updateId ?? null,
    channel: Updates.channel ?? null,
    platform: Platform.OS,
  };
}

export function initAnalytics(): void {
  track('app_open', {});
  setupAnalytics(sinks(), context()).catch((e) => {
    if (__DEV__) console.warn('[analytics] setup failed', e);
  });
}
