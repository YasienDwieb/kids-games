import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { DEFAULT_LANGUAGE, type LanguageCode } from './types';

// Initial language is keyed off the *native* RTL flag, which persists across
// reloads and is synchronously correct from the first line of JS — so styles
// (FONTS) and gameName() resolve to the right language at module-load time,
// before App's effect runs bootstrapLanguage(). bootstrapLanguage() then
// reconciles with the persisted setting; if they already agree (the common
// case) nothing reloads.
const initialLng: LanguageCode = I18nManager.isRTL ? 'ar' : 'en';

// Single shared i18next instance. Core namespace is 'core'; each game registers
// its own namespace via registerTranslations() so parallel additions never
// collide on a shared catalog file.
i18n.use(initReactI18next).init({
  resources: {
    en: { core: en },
    ar: { core: ar },
  },
  lng: initialLng,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'core',
  ns: ['core'],
  interpolation: { escapeValue: false },
  returnNull: false,
  // v4 plural-rule suffixes — needed for Arabic's 6 plural forms.
  compatibilityJSON: 'v4',
});

/**
 * Register a game's translation bundles under its own namespace.
 * Mirrors the registerGame() side-effect pattern: call this from a side-effect
 * module imported in the game's barrel.
 *
 * @example
 *   registerTranslations('simple-pairs', { en: {...}, ar: {...} });
 *   // later, in the game:  t('simple-pairs:title')
 */
export function registerTranslations(
  namespace: string,
  bundles: Partial<Record<LanguageCode, Record<string, unknown>>>,
): void {
  (Object.entries(bundles) as [LanguageCode, Record<string, unknown>][]).forEach(
    ([lng, resources]) => {
      if (!resources) return;
      // deep=true so nested keys merge; overwrite=true so hot-reload re-registers cleanly.
      i18n.addResourceBundle(lng, namespace, resources, true, true);
    },
  );
}

/** Imperatively read the current language code. */
export function currentLanguage(): LanguageCode {
  return (i18n.language as LanguageCode) ?? DEFAULT_LANGUAGE;
}

export { i18n };
export * from './types';
