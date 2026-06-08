import { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { i18n } from './index';
import { isRTL, languageMeta, LANGUAGES, DEFAULT_LANGUAGE, type LanguageCode } from './types';
import { settingsStore } from '@/sdk/settings/store';

/** Best-effort device language, constrained to a supported code. */
function deviceLanguage(): LanguageCode {
  const code = getLocales()[0]?.languageCode?.toLowerCase();
  return LANGUAGES.some((l) => l.code === code) ? (code as LanguageCode) : DEFAULT_LANGUAGE;
}

/**
 * Applies a language to the running i18n instance + RTL layout direction.
 * Returns whether a reload is required (RTL-ness changed) — the caller decides
 * how to surface that (the SettingsScreen shows a "Switching…" notice + reload).
 *
 * Does NOT persist — persistence flows through useSettings/settingsStore so the
 * stored language is the single source of truth on next boot.
 */
export async function applyLanguage(code: LanguageCode): Promise<{ needsReload: boolean }> {
  const wantRTL = isRTL(code);
  const needsReload = I18nManager.isRTL !== wantRTL;

  if (i18n.language !== code) {
    await i18n.changeLanguage(code);
  }
  if (needsReload) {
    // forceRTL only takes effect after a reload; flip the flag now and let the
    // caller trigger the reload.
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
  }
  return { needsReload };
}

/**
 * Sync i18n + native RTL with whatever language is persisted in settings.
 * Call once on boot (App.tsx). If the persisted language disagrees with the
 * current native RTL direction, returns needsReload so the boot flow can reload
 * once to settle into the correct direction.
 */
export async function bootstrapLanguage(): Promise<{ needsReload: boolean }> {
  const settings = await settingsStore.get();
  // Persisted choice wins; otherwise follow the device, falling back to default.
  const code = (settings.language as LanguageCode) ?? deviceLanguage();
  return applyLanguage(code);
}

/** React hook exposing the current language + a switcher. */
export function useLanguage() {
  const [language, setLanguage] = useState<LanguageCode>(
    (i18n.language as LanguageCode) ?? 'en',
  );

  useEffect(() => {
    const onChange = (lng: string) => setLanguage(lng as LanguageCode);
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  // Switch language: persist to settings, apply to i18n, report reload need.
  const changeLanguage = useCallback(
    async (code: LanguageCode): Promise<{ needsReload: boolean }> => {
      const current = await settingsStore.get();
      await settingsStore.set({ ...current, language: code });
      return applyLanguage(code);
    },
    [],
  );

  return { language, meta: languageMeta(language), changeLanguage };
}
