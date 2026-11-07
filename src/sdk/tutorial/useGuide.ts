import { useCallback, useEffect, useRef } from 'react';
import { useSpeech } from '../speech/useSpeech';
import { useFirstRun } from './useFirstRun';
import { useIdle } from './useIdle';

const IDLE_MS = 9000;

type GuideOptions = {
  /** First-run id, shared by a game's standalone and journey rounds. */
  id: string;
  /** What to say; comes from the game's phrase builder (docs/VOICE.md). */
  phrase?: string | null;
  /** Change it to say the phrase again for a new round. */
  roundKey?: unknown;
  /** False once the round is over, or while something covers it. */
  active?: boolean;
};

/**
 * How a game explains itself without text: says the prompt when a round starts,
 * shows the hand on the first play, and does both again when a child goes idle.
 * Call `poke()` on every touch; the first one ends the first-run demo.
 */
export function useGuide({ id, phrase = null, roundKey, active = true }: GuideOptions) {
  const { speak } = useSpeech();
  const firstRun = useFirstRun(id);
  const { idle, poke: pokeIdle } = useIdle(IDLE_MS, active);

  const phraseRef = useRef(phrase);
  phraseRef.current = phrase;
  const say = useCallback(() => {
    if (phraseRef.current) void speak(phraseRef.current);
  }, [speak]);

  useEffect(() => {
    if (active) say();
  }, [active, roundKey, say]);

  useEffect(() => {
    if (active && idle) say();
  }, [active, idle, say]);

  const { status, complete } = firstRun;
  const poke = useCallback(() => {
    pokeIdle();
    if (status === 'show') complete();
  }, [pokeIdle, status, complete]);

  return { showDemo: active && (status === 'show' || idle), poke, say };
}
