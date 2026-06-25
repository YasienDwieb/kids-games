// src/screens/FlowPlayerScreen.tsx
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, I18nManager, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  SceneCanvas, useFlow, selectedAdapters, useSettings, useTranslation,
  FONTS, FONT_SIZES, COLORS, SPACING, TOUCH_TARGET,
} from '@/sdk';
import { BackButton } from '../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'FlowPlayer'>;

export function FlowPlayerScreen({ navigation }: Props) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Inset the game's content off the status bar / screen edges. The floating
  // back button sits in the top-start corner, so only the START side gets the
  // extra clearance — adding it on both sides wastes landscape width and forces
  // content (e.g. tray rows) to wrap. Each physical side gets its own safe-area
  // inset so the side nav-bar/notch is cleared without over-padding the other.
  const startInset = I18nManager.isRTL ? insets.right : insets.left;
  const endInset = I18nManager.isRTL ? insets.left : insets.right;
  const contentPad = {
    paddingTop: insets.top + SPACING.xs,
    paddingBottom: insets.bottom + SPACING.xs,
    paddingStart: startInset + SPACING.md + TOUCH_TARGET.recommended,
    paddingEnd: endInset + SPACING.md,
  };

  const adapters = useMemo(
    () => selectedAdapters(settings.flowGameIds),
    [settings.flowGameIds],
  );
  const { status, unit, advance, step, total } = useFlow({ adapters });
  const progress = total > 0 ? step / total : 0;

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
      <SceneCanvas progress={progress}>
        {status === 'playing' && unit ? (
          <Animated.View style={[styles.fill, contentPad, { opacity: fade }]}>
            {unit.render(handleComplete)}
          </Animated.View>
        ) : null}
        {status === 'done' ? (
          <View style={styles.rest} pointerEvents="box-none">
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
