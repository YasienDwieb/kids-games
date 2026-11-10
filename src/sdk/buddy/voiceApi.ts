/**
 * Client for the buddy-voice worker (`workers/buddy-voice`): records the
 * welcome line with a custom name and saves it on the device.
 *
 * Configured by EXPO_PUBLIC_VOICE_API_URL + EXPO_PUBLIC_VOICE_APP_KEY; without
 * them `voiceNamingAvailable` is false and the rename option is hidden.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { createStore } from '@/sdk/storage/createStore';
import type { BuddyId } from './index';
import type { NameLang } from './names';

const API_URL = process.env.EXPO_PUBLIC_VOICE_API_URL ?? '';
const APP_KEY = process.env.EXPO_PUBLIC_VOICE_APP_KEY ?? '';

export const voiceNamingAvailable = API_URL.length > 0 && APP_KEY.length > 0;

export const MAX_TAKE = 3;
export const MAX_NAME_LENGTH = 20;

export type RecordError = 'invalid' | 'blocked' | 'rate' | 'network' | 'server';
export type RecordResult = { ok: true; uri: string } | { ok: false; error: RecordError };

// Only used to rate-limit one device fairly; not tied to the child or a person.
const installStore = createStore<string>('install-id', '');
let installId: Promise<string> | null = null;

function newId(): string {
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

function getInstallId(): Promise<string> {
  installId ??= installStore.get().then(async (id) => {
    if (id) return id;
    const fresh = newId();
    await installStore.set(fresh);
    return fresh;
  });
  return installId;
}

const clipDir = () => new Directory(Paths.document, 'buddy-voice');

/** Record one welcome clip; the file stays on the device until replaced. */
export async function recordWelcome(
  buddy: BuddyId,
  lang: NameLang,
  name: string,
  take = 1,
): Promise<RecordResult> {
  if (!voiceNamingAvailable) return { ok: false, error: 'server' };
  let res: Response;
  try {
    res = await fetch(`${API_URL.replace(/\/$/, '')}/v1/welcome`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-app-key': APP_KEY,
        'x-install-id': await getInstallId(),
      },
      body: JSON.stringify({ buddy, lang, name, take }),
    });
  } catch {
    return { ok: false, error: 'network' };
  }
  if (res.status === 429) return { ok: false, error: 'rate' };
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: body.error === 'name:blocked' ? 'blocked' : 'invalid' };
  }
  if (!res.ok) return { ok: false, error: 'server' };

  try {
    const bytes = new Uint8Array(await res.arrayBuffer());
    const dir = clipDir();
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, `${buddy}-${lang}-${Date.now()}-${take}.wav`);
    await file.write(bytes);
    return { ok: true, uri: file.uri };
  } catch {
    return { ok: false, error: 'server' };
  }
}

/** Delete recorded clips that nothing points at any more. */
export function pruneClips(keep: readonly string[]): void {
  try {
    const dir = clipDir();
    if (!dir.exists) return;
    for (const entry of dir.list()) {
      if (entry instanceof File && !keep.includes(entry.uri)) entry.delete();
    }
  } catch {
    // Leftover files are harmless; the next prune tries again.
  }
}
