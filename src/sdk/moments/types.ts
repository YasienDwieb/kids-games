import type { MomentType } from '@/sdk/content/types';

/** Who checked a moment and when. Both required: unreviewed content never shows. */
export type Reviewed = { reviewedBy: string; reviewedOn: string };

/** A book and its hadith/dua number, e.g. { book: 'Sahih al-Bukhari', number: '6018' }. */
export type Source = { book: string; number: string };

type Base = Reviewed & {
  /** Stable id, e.g. 'ayah-ikhlas'. */
  id: string;
  /** Bundled illustration (`require('./ikhlas.png')`). */
  image: number;
};

export type AyahMoment = Base & {
  type: 'ayah';
  surah: number;
  ayahs: [number, number];
  /** The ayahs in Uthmani script, shown as-is in both languages. */
  textAr: string;
  /** i18n key (namespace `moments`) for the meaning, voiced in the UI language. */
  meaningKey: string;
  /** Bundled recitation (`require('./112.m4a')`). */
  audio: number;
  recitation: {
    reciter: string;
    origin: string;
    /** The basis for redistributing the file in the app. Required. */
    permission: string;
  };
};

export type HadithMoment = Base & {
  type: 'hadith';
  /** i18n key (namespace `moments`), voiced in the UI language. */
  textKey: string;
  source: Source & { grade: 'sahih' | 'hasan' };
};

export type DuaMoment = Base & {
  type: 'dua';
  /** i18n key (namespace `moments`) for the meaning, voiced in the UI language. */
  textKey: string;
  /** The dua in Arabic, voiced in Arabic after the meaning. */
  textAr: string;
  source: Source;
};

export type HowToStep = {
  image: number;
  /** i18n key (namespace `moments`) for the step, voiced as the prompt. */
  phraseKey: string;
};

export type HowToMoment = Base & {
  type: 'howto';
  topic: 'wudu' | 'salah';
  source: Source;
  /** The whole sequence, in order. Split into units of 3–4 steps by the adapter. */
  steps: HowToStep[];
};

export type Moment = AyahMoment | HadithMoment | DuaMoment | HowToMoment;

export type { MomentType };
