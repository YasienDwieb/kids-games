import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useContentConfig } from '@/sdk/content/load';
import type { OccasionId } from '@/sdk/content/types';
import { activeOccasion, localToday } from './activeOccasion';
import { OCCASION_THEMES, type OccasionTheme } from './themes';
import { createStore } from '@/sdk/storage/createStore';
import { useSpeech } from '@/sdk/speech/useSpeech';
import { currentLanguage } from '@/sdk/i18n';
import { track } from '@/sdk/analytics/client';
import { unlockGift } from '@/sdk/player/outfitStore';
import { occasionPhrase } from './phrase';

/** Today's date, refreshed when the app comes back to the foreground. */
function useToday(): string {
  const [today, setToday] = useState(localToday);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setToday(localToday());
    });
    return () => sub.remove();
  }, []);
  return today;
}

/** The occasion theme active today, or null. */
export function useOccasion(): OccasionTheme | null {
  const config = useContentConfig();
  const today = useToday();
  const id = activeOccasion(today, config.themes);
  return id ? OCCASION_THEMES[id] : null;
}

/** The last date the buddy greeted the child (kg:occasion:greeted). */
export const greetedStore = createStore<string | null>('occasion:greeted', null);

/**
 * Home's occasion moment. While `active` (buddy chosen, Home focused) on an
 * occasion day: the first visit of the day speaks the greeting and reports
 * `occasion_seen`; the first visit of the occasion unlocks its wardrobe gift
 * and returns it until `dismissGift()`.
 */
export function useOccasionWelcome(theme: OccasionTheme | null, active: boolean) {
  const { speak } = useSpeech();
  const [gift, setGift] = useState<string | null>(null);
  const ran = useRef<string | null>(null);
  const id: OccasionId | null = theme?.id ?? null;
  const outfit = theme?.outfit ?? null;

  useEffect(() => {
    if (!id || !outfit || !active) return;
    const today = localToday();
    const runKey = `${id}:${today}`;
    if (ran.current === runKey) return;
    ran.current = runKey;
    let alive = true;
    void (async () => {
      const isNew = await unlockGift(outfit);
      if (alive && isNew) setGift(outfit);
      if ((await greetedStore.get()) === today) return;
      await greetedStore.set(today);
      track('occasion_seen', { id });
      if (alive) void speak(occasionPhrase(id, currentLanguage()));
    })();
    return () => {
      alive = false;
    };
  }, [id, outfit, active, speak]);

  // Stable, so the gift card's auto-close timer isn't restarted by re-renders.
  const dismissGift = useCallback(() => setGift(null), []);
  return { gift, dismissGift };
}
