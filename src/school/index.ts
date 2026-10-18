import { useSettings, useTranslation, type LanguageCode } from '@/sdk';
import type { AccentName } from '@/constants';
import { unitsFor } from './content/egMoe';
import type { Subject, Unit } from './types';

export * from './types';
export * from './progress';
export { allUnits, findLesson, findUnit, unitsFor } from './content/egMoe';
export { shuffleRound } from './build';

/** Each subject's colour family and the glyph on its card. */
export const SUBJECT_META: Record<Subject, { accent: AccentName; glyph: string }> = {
  arabic: { accent: 'green', glyph: 'أ ب' },
  english: { accent: 'pink', glyph: 'ABC' },
  math: { accent: 'blue', glyph: '1+2' },
};

/** The app language as a lesson language (Math follows it). */
export function useAppLang(): LanguageCode {
  const { i18n } = useTranslation();
  return i18n.language === 'ar' ? 'ar' : 'en';
}

/** The parent-set level and term, and a subject's units for them. */
export function useSchool(): {
  level: 'kg1' | 'kg2';
  term: 1 | 2;
  lang: LanguageCode;
  units: (subject: Subject) => Unit[];
} {
  const { settings } = useSettings();
  const lang = useAppLang();
  const level = settings.schoolLevel;
  const term = settings.schoolTerm;
  return { level, term, lang, units: (subject) => unitsFor(lang, subject, level, term) };
}
