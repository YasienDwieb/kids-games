import { DevSettings } from 'react-native';
import * as Updates from 'expo-updates';
import { createStore } from '@/sdk/storage/createStore';

/**
 * Boot-reload bookkeeping. `pending`: we reloaded to apply a direction and
 * haven't booted since. `ignored`: that reload didn't take (e.g. Expo Go), so
 * boot must stop retrying until the user picks a language again.
 *
 * Deliberately not time-based: a slow device can take longer than any window
 * to come back from a reload, which turned a time guard into a reload loop.
 */
const reloadStateStore = createStore<{ pending: boolean; ignored: boolean }>('rtl-reload', {
  pending: false,
  ignored: false,
});

/**
 * Reload the entire JS app. Required after an RTL direction change
 * (I18nManager.forceRTL only takes effect on the next launch).
 *
 * `reason` matters for loop safety:
 *   - 'switch' — the user just picked a language: always reload.
 *   - 'boot'   — App.tsx found a mismatch at startup: reload at most once
 *                per attempt, so a native side that won't flip can't trap
 *                the app in a reload loop.
 *
 * Returns whether a reload was triggered. In production we use expo-updates'
 * reloadAsync(); in dev (where Updates is disabled) we fall back to
 * DevSettings.reload().
 */
export async function reloadApp(reason: 'switch' | 'boot' = 'switch'): Promise<boolean> {
  if (reason === 'boot') {
    const state = await reloadStateStore.get();
    if (state.ignored) return false;
    if (state.pending) {
      await reloadStateStore.set({ pending: false, ignored: true });
      return false;
    }
  }
  await reloadStateStore.set({ pending: true, ignored: false });

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

/** Boot found the direction already correct: forget any pending reload. */
export async function settleReload(): Promise<void> {
  const state = await reloadStateStore.get();
  if (state.pending || state.ignored) await reloadStateStore.set({ pending: false, ignored: false });
}
