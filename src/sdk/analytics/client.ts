import { AppState, type NativeEventSubscription } from 'react-native';
import { DEFAULT_SETTINGS, settingsStore, type Settings } from '@/sdk/settings/store';
import type { AnalyticsEvents, EventName, PlayMode } from './events';
import type { AnalyticsSink, EventProps } from './types';

type Session = {
  gameId: string;
  mode: PlayMode;
  rounds: number;
  activeMs: number;
  resumedAt: number | null;
};

/** Events tracked before setup finishes (e.g. app_open) wait here. */
const MAX_PENDING = 50;
const MAX_STRING = 100;

let sinks: AnalyticsSink[] = [];
let ready = false;
let enabled = DEFAULT_SETTINGS.analyticsEnabled;
let base: EventProps = {};
let fromSettings: EventProps = {};
let pending: Array<[string, EventProps]> = [];
let session: Session | null = null;
let teardown: Array<() => void> = [];

function safely(fn: () => void) {
  try {
    fn();
  } catch (e) {
    // Analytics must never break play.
    if (__DEV__) console.warn('[analytics]', e);
  }
}

function clean(props: Record<string, unknown>): EventProps {
  const out: EventProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'string') out[k] = v.slice(0, MAX_STRING);
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
  }
  return out;
}

function applySettings(s: Settings) {
  fromSettings = { language: s.language, ageBand: s.ageBand, appMode: s.mode };
  if (s.analyticsEnabled === enabled) return;
  enabled = s.analyticsEnabled;
  sinks.forEach((sink) => safely(() => sink.setEnabled(enabled)));
}

function send(event: string, props: EventProps) {
  if (!enabled) return;
  const merged = clean({ ...base, ...fromSettings, ...props });
  sinks.forEach((sink) => safely(() => sink.track(event, merged)));
}

function pause(s: Session) {
  if (s.resumedAt == null) return;
  s.activeMs += Date.now() - s.resumedAt;
  s.resumedAt = null;
}

export function flushAnalytics(): Promise<void> {
  return Promise.all(sinks.map((s) => s.flush().catch(() => undefined))).then(() => undefined);
}

/** Wire the backends once at boot; `context` rides along on every event. */
export async function setupAnalytics(next: AnalyticsSink[], context: EventProps = {}): Promise<void> {
  sinks = next;
  base = context;
  const s = await settingsStore.get().catch(() => DEFAULT_SETTINGS);
  enabled = s.analyticsEnabled;
  applySettings(s);
  sinks.forEach((sink) => safely(() => sink.setEnabled(enabled)));

  const unsub = settingsStore.subscribe(applySettings);
  const sub: NativeEventSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      if (session && session.resumedAt == null) session.resumedAt = Date.now();
      return;
    }
    if (session) pause(session);
    void flushAnalytics();
  });
  teardown = [unsub, () => sub.remove()];

  ready = true;
  const queued = pending;
  pending = [];
  queued.forEach(([e, p]) => send(e, p));
}

export function track<N extends EventName>(event: N, props: AnalyticsEvents[N]): void {
  const p = clean(props);
  if (!ready) {
    if (pending.length < MAX_PENDING) pending.push([event, p]);
    return;
  }
  send(event, p);
}

/** Starts a play session; the returned function ends it and reports game_end. */
export function startPlaySession(gameId: string, mode: PlayMode): () => void {
  const s: Session = {
    gameId,
    mode,
    rounds: 0,
    activeMs: 0,
    resumedAt: AppState.currentState === 'active' ? Date.now() : null,
  };
  session = s;
  track('game_start', { gameId, mode });
  return () => {
    pause(s);
    if (session === s) session = null;
    track('game_end', {
      gameId,
      mode,
      durationSec: Math.round(s.activeMs / 1000),
      rounds: s.rounds,
    });
  };
}

/** A finished round, reported from the shared star award. */
export function trackRound(gameId: string, stars: number): void {
  if (session) session.rounds += 1;
  track('round_complete', { gameId, mode: session?.mode ?? null, stars });
}

/** Test helper: back to the pre-setup state. */
export function resetAnalytics(): void {
  teardown.forEach((fn) => fn());
  teardown = [];
  sinks = [];
  ready = false;
  enabled = DEFAULT_SETTINGS.analyticsEnabled;
  base = {};
  fromSettings = {};
  pending = [];
  session = null;
}
