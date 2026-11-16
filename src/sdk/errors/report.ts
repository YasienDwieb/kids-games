/**
 * JS error reporting: every caught or uncaught error becomes an anonymous
 * `app_error` analytics event, so a store crash report that only says
 * "JavascriptException" can be matched to its message.
 */
import { flushAnalytics, track } from '../analytics/client';

function messageOf(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export function reportError(error: unknown, where: string, fatal = false): void {
  try {
    track('app_error', { where, message: messageOf(error), fatal });
  } catch {
    // Reporting must never throw from inside an error path.
  }
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsLike = {
  getGlobalHandler: () => GlobalHandler;
  setGlobalHandler: (fn: GlobalHandler) => void;
};

/** How long a fatal error waits for the report to leave before the app goes down. */
const FATAL_FLUSH_MS = 1500;
let installed = false;

/**
 * Wraps React Native's global handler (uncaught errors outside render: timers,
 * event handlers, promises turned fatal). The original handler still runs, so
 * fatal errors still end the app as before — just after the report is sent.
 */
export function installErrorReporting(): void {
  const utils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (installed || !utils) return;
  installed = true;
  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((error, isFatal) => {
    reportError(error, 'global', !!isFatal);
    if (!isFatal) {
      previous(error, isFatal);
      return;
    }
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, FATAL_FLUSH_MS));
    void Promise.race([flushAnalytics(), timeout]).finally(() => previous(error, isFatal));
  });
}
