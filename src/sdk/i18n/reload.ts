import { DevSettings } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Reload the entire JS app. Required after an RTL direction change
 * (I18nManager.forceRTL only takes effect on the next launch).
 *
 * In production we use expo-updates' reloadAsync(); in dev (where Updates is
 * disabled) we fall back to DevSettings.reload(). Both restart the JS bundle
 * without the user manually killing the app.
 */
export async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch {
    // Dev / Expo Go: Updates is unavailable — use the dev reload.
    if (typeof DevSettings?.reload === 'function') {
      DevSettings.reload();
    }
  }
}
