import type { LanguageCode } from '@/sdk/i18n/types';

/** The bundled-clip key for a phrase: `"<lang>:<text>"`, NFC-normalized and trimmed. */
export function clipKey(lang: LanguageCode, text: string): string {
  return `${lang}:${text.normalize('NFC').trim()}`;
}
