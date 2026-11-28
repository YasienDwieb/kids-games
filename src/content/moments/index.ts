/**
 * Journey moments: short Quran, hadith, dua and wudu/salah how-to units the
 * guided journey slots between games (cadence in src/content/config.json →
 * `moments`; a parent can turn them off in Settings).
 *
 * EMPTY until content is reviewed. Every entry needs `reviewedBy` + `reviewedOn`
 * (a named person who checked it), a `source` (book + number) for hadith, dua and
 * how-to, and for an ayah `recitation.permission` (the basis for bundling the
 * audio). Entries missing any of these are dropped and reported, and
 * `src/content/moments/__tests__/content.test.ts` fails CI.
 *
 * To add one: put the illustration (and recitation .m4a) next to this file,
 * add the entry below, and add its voiced lines to ./i18n.ts (en + ar).
 *
 *   {
 *     id: 'ayah-ikhlas',
 *     type: 'ayah',
 *     surah: 112,
 *     ayahs: [1, 4],
 *     textAr: '…',                      // Uthmani text, verified
 *     meaningKey: 'ayah.ikhlas',
 *     image: require('./ikhlas.png'),
 *     audio: require('./112.m4a'),
 *     recitation: { reciter: 'Mahmoud Khalil Al-Husary (Muallim)', origin: 'everyayah.com', permission: '…' },
 *     reviewedBy: '…',
 *     reviewedOn: '2027-01-10',
 *   },
 */
import { registerMoments, type Moment } from '@/sdk';
import './i18n';

export const MOMENTS: Moment[] = [];

registerMoments(MOMENTS);
