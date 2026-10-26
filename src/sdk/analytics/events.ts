/**
 * The analytics event catalogue: the only contract between the app and any
 * analytics backend. Keep events coarse (per game / per round, never per tap)
 * and properties free of anything that identifies a child.
 */
export type PlayMode = 'free' | 'journey';

export type AnalyticsEvents = {
  app_open: Record<string, never>;
  game_start: { gameId: string; mode: PlayMode };
  /** durationSec counts foreground time only. */
  game_end: { gameId: string; mode: PlayMode; durationSec: number; rounds: number };
  round_complete: { gameId: string; mode: PlayMode | null; stars: number };
  journey_done: { total: number };
};

export type EventName = keyof AnalyticsEvents;
