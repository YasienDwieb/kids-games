import { registerTranslations } from '@/sdk';

/**
 * Voiced lines for journey moments (namespace `moments`): a moment's
 * `meaningKey` / `textKey` / step `phraseKey` resolve here, e.g. `ayah.ikhlas`.
 * Keep en and ar keys identical.
 */
const en = {} as const;
const ar: typeof en = {};

registerTranslations('moments', { en, ar });
