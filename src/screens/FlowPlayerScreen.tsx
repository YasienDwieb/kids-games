// src/screens/FlowPlayerScreen.tsx
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  SceneCanvas, useFlow, selectedAdapters, useSettings, useTranslation,
  FONTS, FONT_SIZES, COLORS,
} from '@/sdk';
import { BackButton } from '../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'FlowPlayer'>;

export function FlowPlayerScreen({ navigation }: Props) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Keep game content out from under the status bar / side nav bar / notch.
  const safe = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  // Landscape lock for guided mode only; restore portrait on exit.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const adapters = useMemo(
    () => selectedAdapters(settings.flowGameIds),
    [settings.flowGameIds],
  );
  const { status, unit, advance } = useFlow({ adapters });

  // Smooth cross-fade on the shared backdrop when the unit changes.
  const fade = useRef(new Animated.Value(0)).current;
  const advancing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Fade the new unit in whenever it changes.
  useEffect(() => {
    advancing.current = false;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [unit?.key, fade]);

  const handleComplete = useCallback(() => {
    if (advancing.current) return;
    advancing.current = true;
    Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      timer.current = setTimeout(() => advance(), 80);
    });
  }, [advance, fade]);

  return (
    <View style={styles.root}>
      <SceneCanvas>
        {status === 'playing' && unit ? (
          <Animated.View style={[styles.fill, safe, { opacity: fade }]}>
            {unit.render(handleComplete)}
          </Animated.View>
        ) : null}
        {status === 'done' ? (
          <View style={[styles.rest, safe]} pointerEvents="box-none">
            <Text style={styles.restText}>{t('flow.allCaughtUp')}</Text>
          </View>
        ) : null}
      </SceneCanvas>
      <BackButton onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  fill: { flex: 1 },
  rest: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  restText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
