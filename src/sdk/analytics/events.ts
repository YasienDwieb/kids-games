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
  /**
   * A JS error the app survived (or is about to die of, `fatal`). `where` is the
   * boundary or handler that caught it (`app`, `game:<id>`, `flow:<id>`, `3d:<id>`, `global`);
   * `message` is the error's own text, cut to 100 chars. No stack or user data.
   */
  app_error: { where: string; message: string; fatal: boolean };
  /** The last launch died while a 3D view was starting; 3D stays off on this build. */
  gl3d_disabled: Record<string, never>;
};

export type EventName = keyof AnalyticsEvents;
