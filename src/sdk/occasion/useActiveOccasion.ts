import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useContentConfig } from '@/sdk/content/load';
import { activeOccasion, localToday } from './activeOccasion';
import { OCCASION_THEMES, type OccasionTheme } from './themes';

// Kept apart from useOccasion.ts (the greeting, which pulls in speech and
// analytics) so light consumers like BuddyFigure and SceneCanvas stay light.

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

