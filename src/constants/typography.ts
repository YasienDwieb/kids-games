import { I18nManager } from 'react-native';

// Font family tokens. Names match the @expo-google-fonts exports loaded in
// App.tsx via useFonts.
//
// Latin (en): Fredoka = playful display; Nunito = friendly body.
// Arabic (ar): IBM Plex Sans Arabic — one family, weighted by role.
//
// FONTS is language-aware WITHOUT changing any `FONTS.display` call site. The
// family is keyed off `I18nManager.isRTL`, NOT i18n.language: RTL is persisted
// natively and is synchronously correct from the first line of JS on every
// boot, whereas i18n.language is only set later (in App's effect) — after every
// StyleSheet.create() has already captured the font family. Language changes go
// through a full app reload, so isRTL is stable within a session.

const LATIN = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Nunito_700Bold',
  bodySemi: 'Nunito_600SemiBold',
  bodyExtra: 'Nunito_800ExtraBold',
} as const;

const ARABIC = {
  display: 'IBMPlexSansArabic_600SemiBold',
  displayBold: 'IBMPlexSansArabic_700Bold',
  displayMedium: 'IBMPlexSansArabic_500Medium',
  body: 'IBMPlexSansArabic_700Bold',
  bodySemi: 'IBMPlexSansArabic_600SemiBold',
  bodyExtra: 'IBMPlexSansArabic_700Bold',
} as const;

type FontRole = keyof typeof LATIN;

function familyFor(role: FontRole): string {
  return I18nManager.isRTL ? ARABIC[role] : LATIN[role];
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
