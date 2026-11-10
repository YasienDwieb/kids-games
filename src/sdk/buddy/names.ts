/**
 * A grown-up can rename the buddy (Mariam → "Noor"). The name is kept per
 * language, with the welcome clips recorded for it (`voiceApi.ts`), on the
 * device only (kg:buddy-name). No name = the built-in name and bundled clips.
 *
 *   const label = useBuddyLabel();     // "Noor", or t('buddy.mariam.name')
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createStore } from '@/sdk/storage/createStore';
import { useBuddy, type BuddyId } from './index';

export type NameLang = 'en' | 'ar';

export type BuddyName = {
  en: string;
  /** Arabic spelling; empty = use the English one. */
  ar: string;
  /** Recorded welcome clips (file URIs) per language. */
  clips: Partial<Record<NameLang, string>>;
};

export type BuddyNames = Partial<Record<BuddyId, BuddyName>>;

const nameStore = createStore<BuddyNames>('buddy-name', {});
let names: BuddyNames = {};
const listeners = new Set<() => void>();

function apply(next: BuddyNames) {
  names = next ?? {};
  listeners.forEach((fn) => fn());
}
nameStore.get().then(apply).catch(() => {});
nameStore.subscribe(apply);

const langOf = (code: string | undefined): NameLang => (code?.startsWith('ar') ? 'ar' : 'en');

/** The custom name in a language (falls back to the English spelling), or null. */
export function customName(buddy: BuddyId, lang: NameLang): string | null {
  const n = names[buddy];
  if (!n) return null;
  return (lang === 'ar' ? n.ar || n.en : n.en) || null;
}

/** The recorded welcome clip for a custom name, or null. */
export function customWelcomeClip(buddy: BuddyId, lang: NameLang): string | null {
  return names[buddy]?.clips[lang] ?? null;
}

export function buddyNameFor(buddy: BuddyId): BuddyName | null {
  return names[buddy] ?? null;
}

function useNames() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return names;
}

/** The name to show and say for a buddy (the chosen one by default), live. */
export function useBuddyLabel(buddy?: BuddyId): string {
  const { t, i18n } = useTranslation();
  const chosen = useBuddy();
  useNames();
  const who = buddy ?? chosen;
  return customName(who, langOf(i18n.language)) ?? t(`buddy.${who}.name`);
}

/** The saved custom name for a buddy, live (null = built-in name). */
export function useBuddyName(buddy: BuddyId): BuddyName | null {
  return useNames()[buddy] ?? null;
}

export async function saveBuddyName(buddy: BuddyId, name: BuddyName): Promise<void> {
  const cur = await nameStore.get();
  await nameStore.set({ ...cur, [buddy]: name });
}

/** Back to the built-in name and voice. */
export async function clearBuddyName(buddy: BuddyId): Promise<void> {
  const cur = { ...(await nameStore.get()) };
  delete cur[buddy];
  await nameStore.set(cur);
}

export { langOf as nameLangOf };
