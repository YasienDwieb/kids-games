import bundled from '@/content/config.json';
import { reportError } from '../errors/report';
import type { AppContentConfig } from './types';
import { validateContentConfig } from './validate';

let cached: AppContentConfig | null = null;

/**
 * Validates `source` and reports any problems once as an `app_error`
 * (`where: 'content-config'`). Exposed for tests; the app uses `getContentConfig()`.
 */
export function loadContentConfig(source: unknown = bundled): AppContentConfig {
  const { config, problems } = validateContentConfig(source);
  if (problems.length > 0) {
    reportError(new Error(problems.join('; ')), 'content-config');
  }
  return config;
}

/** The validated content config, loaded on first use. */
export function getContentConfig(): AppContentConfig {
  if (!cached) cached = loadContentConfig();
  return cached;
}

/**
 * Hook form of `getContentConfig()`. Stable for now; phase 2 makes it update
 * when a fetched config arrives, so components should read it through here.
 */
export function useContentConfig(): AppContentConfig {
  return getContentConfig();
}

/** Test-only: forget the cached config. */
export function resetContentConfigForTests(): void {
  cached = null;
}
