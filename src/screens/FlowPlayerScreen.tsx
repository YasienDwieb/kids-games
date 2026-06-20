// src/screens/FlowPlayerScreen.tsx
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  const { width, height } = useWindowDimensions();

  // The games' rounds are authored for a tall portrait canvas. In the
  // landscape-locked flow they'd overflow top & bottom, so we render each round
  // at the device's natural portrait size and uniformly scale it to fit the
  // safe area — guaranteeing it stays centered and is never trimmed. The wide
  // sides show the shared backdrop (letterbox).
  const availW = Math.max(1, width - insets.left - insets.right);
  const availH = Math.max(1, height - insets.top - insets.bottom);
  const designW = Math.min(width, height); // portrait width
  const designH = Math.max(width, height); // portrait height
  const scale = Math.min(availW / designW, availH / designH);

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
          <Animated.View style={[styles.center, { opacity: fade }]}>
            {/* Portrait design box, uniformly scaled to fit and centered. */}
            <View style={{ width: designW, height: designH, transform: [{ scale }] }}>
              {unit.render(handleComplete)}
            </View>
          </Animated.View>
        ) : null}
        {status === 'done' ? (
          <View style={styles.center} pointerEvents="box-none">
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
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  restText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
