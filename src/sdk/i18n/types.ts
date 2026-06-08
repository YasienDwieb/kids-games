// Supported app languages. Add a new code here + a font in App.tsx + RTL flag
// in LANGUAGES below to introduce another language.
export type LanguageCode = 'en' | 'ar';

export type LanguageMeta = {
  code: LanguageCode;
  /** Native name shown in the language picker (e.g. "العربية"). */
  label: string;
  /** Right-to-left script. Drives layout mirroring + font selection. */
  rtl: boolean;
};

export const LANGUAGES: readonly LanguageMeta[] = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function languageMeta(code: string | null | undefined): LanguageMeta {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isRTL(code: string | null | undefined): boolean {
  return languageMeta(code).rtl;
}
