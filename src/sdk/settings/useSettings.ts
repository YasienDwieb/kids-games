import { useEffect, useState } from 'react';
import { settingsStore, DEFAULT_SETTINGS, type Settings } from './store';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let mounted = true;
    settingsStore.get().then((s) => mounted && setSettings(s));
    const unsub = settingsStore.subscribe((s) => setSettings(s));
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const update = async (patch: Partial<Settings>) => {
    const next = { ...(await settingsStore.get()), ...patch };
    await settingsStore.set(next);
  };

  return { settings, update };
}
