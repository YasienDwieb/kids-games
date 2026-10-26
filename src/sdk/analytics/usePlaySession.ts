import { useEffect } from 'react';
import { startPlaySession } from './client';
import type { PlayMode } from './events';

/** Reports game_start on mount and game_end (with foreground time) on unmount. */
export function usePlaySession(gameId: string | null, mode: PlayMode): void {
  useEffect(() => {
    if (!gameId) return;
    return startPlaySession(gameId, mode);
  }, [gameId, mode]);
}
