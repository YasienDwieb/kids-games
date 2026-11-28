import { useCallback, useEffect, useRef, useState } from 'react';
import type { OccasionId } from '@/sdk/content/types';
import { localToday } from './activeOccasion';
import type { OccasionTheme } from './themes';
export { useOccasion } from './useActiveOccasion';
import { createStore } from '@/sdk/storage/createStore';
import { useSpeech } from '@/sdk/speech/useSpeech';
import { currentLanguage } from '@/sdk/i18n';
import { track } from '@/sdk/analytics/client';
import { unlockGift } from '@/sdk/player/outfitStore';
import { occasionPhrase } from './phrase';

/** The last date the buddy greeted the child (kg:occasion:greeted). */
export const greetedStore = createStore<string | null>('occasion:greeted', null);

/**
 * Home's occasion moment. While `active` (buddy chosen, Home focused) on an
 * occasion day: the first visit of the day speaks the greeting and reports
 * `occasion_seen`; the first visit of the occasion each year returns its
 * companion id as `gift` (for the gift card) until `dismissGift()`.
 */
export function useOccasionWelcome(theme: OccasionTheme | null, active: boolean) {
  const { speak } = useSpeech();
  const [gift, setGift] = useState<string | null>(null);
  const ran = useRef<string | null>(null);
  const id: OccasionId | null = theme?.id ?? null;
  const companion = theme?.companion.id ?? null;

  useEffect(() => {
    if (!id || !companion || !active) return;
    const today = localToday();
    const runKey = `${id}:${today}`;
    if (ran.current === runKey) return;
    ran.current = runKey;
    let alive = true;
    void (async () => {
      // Once per occasion per year: next Ramadan brings the card back.
      const isNew = await unlockGift(`${companion}:${today.slice(0, 4)}`);
      if (alive && isNew) setGift(companion);
      if ((await greetedStore.get()) === today) return;
      await greetedStore.set(today);
      track('occasion_seen', { id });
      if (alive) void speak(occasionPhrase(id, currentLanguage()));
    })();
    return () => {
      alive = false;
    };
  }, [id, companion, active, speak]);

  // Stable, so the gift card's auto-close timer isn't restarted by re-renders.
  const dismissGift = useCallback(() => setGift(null), []);
  return { gift, dismissGift };
}
