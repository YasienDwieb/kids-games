import type { OccasionId } from '@/sdk/content/types';
import type { LanguageCode } from '@/sdk/i18n/types';

/**
 * The buddy's occasion greeting, spoken on the first Home visit of each day.
 * Listed in src/games/voiceCatalog.ts so a bundled clip exists for it.
 */
const GREETINGS: Record<OccasionId, Record<LanguageCode, string>> = {
  ramadan: { en: 'Ramadan Mubarak!', ar: 'رَمَضان كَريم!' },
  'eid-al-fitr': { en: 'Eid Mubarak!', ar: 'عيد مُبارَك!' },
  'eid-al-adha': { en: 'Happy Eid al-Adha!', ar: 'عيد أَضْحى مُبارَك!' },
};

export function occasionPhrase(id: OccasionId, lang: LanguageCode): string {
  return GREETINGS[id][lang];
}
