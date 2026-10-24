import { I18nManager } from 'react-native';

// Font family tokens. Names match the @expo-google-fonts exports loaded in
// App.tsx via useFonts.
//
// Latin (en): Lilita One = loud comic display; Nunito (heavy) = friendly body.
// Arabic (ar): Baloo Bhaijaan 2 = rounded playful display; IBM Plex Sans
// Arabic = body.
//
// FONTS is language-aware WITHOUT changing any `FONTS.display` call site. The
// family is keyed off `I18nManager.isRTL`, NOT i18n.language: RTL is persisted
// natively and is synchronously correct from the first line of JS on every
// boot, whereas i18n.language is only set later (in App's effect) — after every
// StyleSheet.create() has already captured the font family. Language changes go
// through a full app reload, so isRTL is stable within a session.

const LATIN = {
  display: 'LilitaOne_400Regular',
  displayBold: 'LilitaOne_400Regular',
  displayMedium: 'LilitaOne_400Regular',
  body: 'Nunito_800ExtraBold',
  bodySemi: 'Nunito_700Bold',
  bodyExtra: 'Nunito_900Black',
} as const;

const ARABIC = {
  display: 'BalooBhaijaan2_700Bold',
  displayBold: 'BalooBhaijaan2_800ExtraBold',
  displayMedium: 'BalooBhaijaan2_600SemiBold',
  body: 'IBMPlexSansArabic_700Bold',
  bodySemi: 'IBMPlexSansArabic_600SemiBold',
  bodyExtra: 'IBMPlexSansArabic_700Bold',
} as const;

type FontRole = keyof typeof LATIN;

function familyFor(role: FontRole): string {
  return I18nManager.isRTL ? ARABIC[role] : LATIN[role];
}

/** The font set for one script regardless of UI direction (an Arabic letter in an English UI). */
export function fontsFor(language: 'en' | 'ar'): { readonly [K in FontRole]: string } {
  return language === 'ar' ? ARABIC : LATIN;
}

// Object with getters so `FONTS.display` resolves at access time per language.
export const FONTS = {
  get display() {
    return familyFor('display');
  },
  get displayBold() {
    return familyFor('displayBold');
  },
  get displayMedium() {
    return familyFor('displayMedium');
  },
  get body() {
    return familyFor('body');
  },
  get bodySemi() {
    return familyFor('bodySemi');
  },
  get bodyExtra() {
    return familyFor('bodyExtra');
  },
} as { readonly [K in FontRole]: string };

const ARABIC_SCRIPT = /[؀-ۿ]/;

/**
 * Family for content in a given language, whatever the app's direction — School
 * shows Arabic lessons in the English app and English lessons in the Arabic one.
 */
export function fontForLang(lang: 'en' | 'ar', role: FontRole = 'display'): string {
  return lang === 'ar' ? ARABIC[role] : LATIN[role];
}

/** Family for a piece of text by its script (Arabic letters get the Arabic face). */
export function fontForText(text: string, role: FontRole = 'display'): string {
  return fontForLang(ARABIC_SCRIPT.test(text) ? 'ar' : 'en', role);
}
