import { useCallback, useContext, useEffect, useRef } from 'react';
import { GameExitContext } from '../layout/ScreenBackContext';
import { whenOverlayClear } from '../layout/overlayGate';
import { voiceHoldRemaining } from '../speech/voiceGate';
import { useCelebrate, type CelebrationSize } from './Celebration';

/** Run `fn` once no card is up and nobody is talking or about to. */
function whenQuiet(fn: () => void): void {
  whenOverlayClear(() => {
    const wait = voiceHoldRemaining();
    if (wait > 0) setTimeout(() => whenQuiet(fn), wait);
    else fn();
  });
}

/**
 * How a game moves on from a win: no card and no button. Celebrates, waits for
 * the praise voice to finish, then carries on by itself. Nothing runs after the
 * game has left the screen.
 */
export function useRoundEnd() {
  const celebrate = useCelebrate();
  const exitGame = useContext(GameExitContext);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Celebrate, then `next()`. */
  const next = useCallback(
    async (size: CelebrationSize, go: () => void) => {
      await celebrate(size);
      if (mounted.current) go();
    },
    [celebrate],
  );

  /**
   * The game's last round: a big celebration, then back to Home. `finish` books
   * the reward; a Level Up or sticker it earns plays out before the game leaves.
   */
  const end = useCallback(
    async (finish: () => Promise<unknown>) => {
      await celebrate('big');
      if (!mounted.current) return;
      await finish();
      whenQuiet(() => {
        if (mounted.current) exitGame();
      });
    },
    [celebrate, exitGame],
  );

  return { next, end };
}
