/**
 * The analytics event catalogue: the only contract between the app and any
 * analytics backend. Keep events coarse (per game / per round, never per tap)
 * and properties free of anything that identifies a child.
 */
export type PlayMode = 'free' | 'journey';

/**
 * Why a play session ended. `complete`: the game finished itself (useRoundEnd)
 * or the journey ran out; `error`: an error boundary sent the child Home;
 * `limit`: the daily play limit's break screen sent them Home; `back`: anything
 * else, which is the child (or a grown-up) pressing back. A session the OS
 * killed in the background sends no game_end at all.
 */
export type EndReason = 'back' | 'complete' | 'error' | 'limit';

/** The furthest hint a round needed (see sdk/feedback/hints.ts). */
export type HintReached = 'none' | 'retry' | 'highlight' | 'reveal';

export type AnalyticsEvents = {
  app_open: Record<string, never>;
  game_start: { gameId: string; mode: PlayMode };
  /**
   * durationSec counts foreground time only. secondsToFirstRound is the
   * foreground time before the first finished round (null if none);
   * backgrounded = the app left the foreground at least once mid-game.
   */
  game_end: {
    gameId: string;
    mode: PlayMode;
    durationSec: number;
    rounds: number;
    endedBy: EndReason;
    secondsToFirstRound: number | null;
    backgrounded: boolean;
  };
  /**
   * misses / hint come from the shared hint ladder (useHintLadder and the hooks
   * built on it); both are null when the round's game doesn't use it.
   */
  round_complete: {
    gameId: string;
    mode: PlayMode | null;
    stars: number;
    misses: number | null;
    hint: HintReached | null;
  };
  journey_done: { total: number };
  /**
   * A JS error the app survived (or is about to die of, `fatal`). `where` is the
   * boundary or handler that caught it (`app`, `game:<id>`, `flow:<id>`, `3d:<id>`, `global`);
   * `message` is the error's own text, cut to 100 chars. No stack or user data.
   */
  app_error: { where: string; message: string; fatal: boolean };
  /** A first-run demo (useFirstRun id, e.g. 'mouse-maze') was shown / finished. */
  tutorial_shown: { id: string; mode: PlayMode | null };
  tutorial_done: { id: string; mode: PlayMode | null };
  /** A child went idle long enough for the help to come back (useIdle). */
  idle_hint: { id: string; mode: PlayMode | null };
  /** A journey moment (ayah / hadith / dua / howto) was shown / finished; `misses` from how-to picks. */
  moment_shown: { type: string; id: string };
  moment_done: { type: string; id: string; misses: number };
  /** Home was opened on an occasion day (once per day); `id` is the OccasionId. */
  occasion_seen: { id: string };
  /** The last launch died while a 3D view was starting; 3D stays off on this build. */
  gl3d_disabled: Record<string, never>;
};

export type EventName = keyof AnalyticsEvents;
