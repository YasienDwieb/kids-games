// src/screens/FlowPlayerScreen.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  SceneCanvas, useFlow, activeTopics, getAllTopics, useSettings, useTranslation,
  FONTS, FONT_SIZES, COLORS, type Actor,
} from '@/sdk';
import { BackButton } from '../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'FlowPlayer'>;

export function FlowPlayerScreen({ navigation }: Props) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  // Landscape lock for guided mode only; restore portrait on exit.
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const topics = useMemo(
    () => activeTopics(getAllTopics(), settings.flowTopicIds),
    [settings.flowTopicIds],
  );
  const { status, unit, advance } = useFlow({ topics });

  const [actors, setActors] = useState<Actor[]>([]);
  const advancing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clean up any pending advance timer on unmount.
  useEffect(() => () => { clearTimeout(timerRef.current); }, []);

  // Lay out the active unit's actors. Depends on width/height as well as the
  // unit because the landscape lock is async: dimensions arrive portrait on
  // mount and update once the rotation lands, so we must re-lay-out then.
  // Under the lock that dimension change happens only on the initial flip.
  useEffect(() => {
    if (unit) {
      advancing.current = false;
      setActors(unit.enterActors({ width, height, rng: Math.random }));
    }
  }, [unit, width, height]);

  const handleComplete = () => {
    if (!unit || advancing.current) return;
    advancing.current = true;
    timerRef.current = setTimeout(() => advance(), 350);
  };

  const UnitComponent = unit?.Component;

  return (
    <View style={styles.root}>
      <SceneCanvas actors={actors}>
        {status === 'playing' && UnitComponent ? (
          <UnitComponent actors={actors} onComplete={handleComplete} />
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
  rest: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  restText: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.ink,
    textAlign: 'center',
  },
});
