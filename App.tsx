import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { RootNavigator } from './src/app/navigation';
import './src/sdk/i18n'; // side-effect: initializes i18next before anything reads it
import { bootstrapLanguage } from './src/sdk/i18n/useLanguage';
import { reloadApp } from './src/sdk/i18n/reload';
import './src/games'; // side-effect: registers all games + their translations

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  // Sync language + RTL with persisted settings before first paint. If the
  // native RTL direction disagrees with the chosen language we must reload once
  // so the layout settles into the correct direction.
  const [langReady, setLangReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    bootstrapLanguage().then(({ needsReload }) => {
      if (cancelled) return;
      if (needsReload) {
        reloadApp();
        return;
      }
      setLangReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded || !langReady) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
