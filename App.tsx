import { useEffect, useState } from 'react';
import { LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFonts } from 'expo-font';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  BalooBhaijaan2_600SemiBold,
  BalooBhaijaan2_700Bold,
  BalooBhaijaan2_800ExtraBold,
} from '@expo-google-fonts/baloo-bhaijaan-2';
import {
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { RootNavigator } from './src/app/navigation';
import './src/sdk/i18n'; // side-effect: initializes i18next before anything reads it
import { bootstrapLanguage } from './src/sdk/i18n/useLanguage';
import { reloadApp, settleReload } from './src/sdk/i18n/reload';
import './src/games'; // side-effect: registers all games + their translations
import './src/flow'; // side-effect: registers flow units + topics

// @react-three/fiber 9 still uses THREE.Clock; three 0.18x warns on every Canvas mount.
// Remounting a Lulu Canvas logs this on Android GL; harmless.
LogBox.ignoreLogs([
  'THREE.Clock: This module has been deprecated',
  'WEBGL_lose_context extension not supported',
]);

export default function App() {
  const [fontsLoaded] = useFonts({
    LilitaOne_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    BalooBhaijaan2_600SemiBold,
    BalooBhaijaan2_700Bold,
    BalooBhaijaan2_800ExtraBold,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  // Lock to *sensor* landscape so the app stays landscape in both directions
  // (rotating the device flips between left/right). app.json's "landscape"
  // maps to a single fixed landscape on Android; this allows both.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(
      (e) => console.warn('Failed to lock orientation to landscape', e)
    );
  }, []);

  // Sync language + RTL with persisted settings before first paint. If the
  // native RTL direction disagrees with the chosen language we must reload once
  // so the layout settles into the correct direction.
  const [langReady, setLangReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    bootstrapLanguage()
      .then(({ needsReload }) => {
        if (cancelled) return;
        // The reload only matters for native RTL (I18nManager.forceRTL takes
        // effect next launch). On web, direction is CSS-driven — never reload,
        // or the app would blank/loop on first boot.
        if (needsReload && Platform.OS !== 'web') {
          // reloadApp('boot') tries one reload per attempt, so a
          // native side that ignores forceRTL can't loop the app forever.
          return reloadApp('boot').then((reloaded) => {
            if (cancelled || reloaded) return;
            // log, not warn: a dev-only Expo Go quirk shouldn't raise a LogBox banner.
            console.log('RTL direction did not apply after reload; continuing without it');
            setLangReady(true);
          });
        }
        void settleReload();
        setLangReady(true);
      })
      .catch((e) => {
        // A locale-read failure must not blank the whole app — boot anyway.
        console.error('bootstrapLanguage failed; continuing with defaults', e);
        if (!cancelled) setLangReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded || !langReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
