import { DevSettings } from 'react-native';
import * as Updates from 'expo-updates';
import { createStore } from '@/sdk/storage/createStore';

/**
 * When the app last reloaded itself to change layout direction. Lets the boot
 * check tell "this launch IS the reload" apart from a fresh launch.
 */
const lastReloadStore = createStore<{ at: number }>('rtl-reload', { at: 0 });

/**
 * A boot-time direction mismatch this soon after a reload means the native side
 * ignored forceRTL (e.g. Expo Go without RTL support). Reloading again would
 * loop forever, so the boot check gives up and runs in the current direction.
 */
const BOOT_RELOAD_GUARD_MS = 15_000;

/**
 * Reload the entire JS app. Required after an RTL direction change
 * (I18nManager.forceRTL only takes effect on the next launch).
 *
 * `reason` matters for loop safety:
 *   - 'switch' — the user just picked a language: always reload.
 *   - 'boot'   — App.tsx found a mismatch at startup: reload only if we
 *                didn't just reload, so a native side that won't flip can't
 *                trap the app in a reload loop.
 *
 * Returns whether a reload was triggered. In production we use expo-updates'
 * reloadAsync(); in dev (where Updates is disabled) we fall back to
 * DevSettings.reload().
 */
export async function reloadApp(reason: 'switch' | 'boot' = 'switch'): Promise<boolean> {
  const last = await lastReloadStore.get();
  if (reason === 'boot' && Date.now() - last.at < BOOT_RELOAD_GUARD_MS) {
    return false;
  }
  await lastReloadStore.set({ at: Date.now() });

  try {
    await Updates.reloadAsync();
  } catch {
    // Dev / Expo Go: Updates is unavailable — use the dev reload.
    if (typeof DevSettings?.reload === 'function') {
      DevSettings.reload();
    }
  }
  return true;
}
