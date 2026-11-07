/**
 * The road trip — the whole game's map, in pictures. Four stops a tour
 * (meadow → beach → desert → snow), the car parked at the one it's driving to
 * next and a trophy at the end. One big button drives; the car button picks a
 * car. The road runs in reading direction.
 */
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import {
  ACCENTS,
  COLORS,
  EmojiImage,
  Icon,
  OUTLINE,
  POP,
  PressableButton,
  SHADOWS,
  SPACING,
  Star,
  TOUCH_TARGET,
  pulse,
  useLoop,
  useTranslation,
} from '@/sdk';
import { THEME_ORDER, THEMES } from '../constants';
import type { CarDef } from '../types';

const STOP = 76;
/** A road dash between stops, with its margins. */
const DASH_SPAN = 42;

type TripScreenProps = {
  /** The level about to be driven (1-based). */
  level: number;
  car: CarDef;
  onDrive: () => void;
  onCars: () => void;
};

export function TripScreen({ level, car, onDrive, onCars }: TripScreenProps) {
  const { t } = useTranslation();
  const beat = useLoop(900);
  const here = (level - 1) % THEME_ORDER.length;
  const tours = Math.floor((level - 1) / THEME_ORDER.length);

  // The car hops into its stop each time the map appears.
  const hop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    hop.setValue(0);
    Animated.spring(hop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  }, [hop, here]);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable
          onPress={onCars}
          accessibilityRole="button"
          accessibilityLabel={t('turbo-road:a11y.cars')}
          hitSlop={8}
          style={({ pressed }) => [styles.carButton, pressed ? styles.pressed : SHADOWS.sm]}
        >
          <EmojiImage emoji={car.emoji} size={40} />
        </Pressable>
      </View>

      <View style={styles.road}>
        {THEME_ORDER.map((id, i) => {
          const theme = THEMES[id];
          const done = i < here;
          return (
            <View key={id} style={styles.leg} accessible accessibilityLabel={t(`turbo-road:themes.${id}`)}>
              {i > 0 ? <View style={[styles.dash, done || i === here ? styles.dashDone : null]} /> : null}
              <View style={[styles.stop, { backgroundColor: theme.sky }, i === here ? styles.stopHere : null]}>
                <EmojiImage emoji={theme.chipEmoji} size={40} />
                {done ? (
                  <View style={styles.doneBadge}>
                    <Star size={20} />
                  </View>
                ) : null}
              </View>
              {i === here ? (
                <Animated.View
                  style={[
                    styles.car,
                    // The stop sits after the road leading to it (none before the first).
                    { start: (i > 0 ? DASH_SPAN : 0) + STOP / 2 - 22 },
                    {
                      opacity: hop,
                      transform: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
                    },
                  ]}
                >
                  <EmojiImage emoji={car.emoji} size={44} />
                </Animated.View>
              ) : null}
            </View>
          );
        })}
        <View style={styles.leg}>
          <View style={styles.dash} />
          <View style={[styles.stop, styles.finish]}>
            <EmojiImage emoji="🏆" size={40} />
          </View>
          {tours > 0 ? (
            <View style={styles.trophies} accessible accessibilityLabel={`🏆 ${tours}`}>
              {Array.from({ length: Math.min(tours, 5) }, (_, i) => (
                <EmojiImage key={i} emoji="🏆" size={16} />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <Animated.View style={pulse(beat, 0.06)}>
        <PressableButton accessibilityLabel={t('turbo-road:a11y.drive')} color={ACCENTS.green.base} onPress={onDrive}>
          <View style={styles.drive}>
            <Icon name="play" size={40} />
          </View>
        </PressableButton>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingBottom: SPACING.md },
  top: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.md, minHeight: TOUCH_TARGET.recommended },
  carButton: {
    width: TOUCH_TARGET.recommended,
    height: TOUCH_TARGET.recommended,
    borderRadius: TOUCH_TARGET.recommended / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  road: { flexDirection: 'row', alignItems: 'center' },
  leg: { flexDirection: 'row', alignItems: 'center' },
  dash: { width: 34, height: 8, borderRadius: 4, backgroundColor: COLORS.inkFaint, marginHorizontal: 4 },
  dashDone: { backgroundColor: POP.zap, borderWidth: OUTLINE.thin, borderColor: OUTLINE.color },
  stop: {
    width: STOP,
    height: STOP,
    borderRadius: STOP / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  stopHere: { borderWidth: OUTLINE.thick, transform: [{ scale: 1.12 }] },
  finish: { backgroundColor: POP.zap },
  doneBadge: { position: 'absolute', top: -10, end: -8 },
  car: { position: 'absolute', top: -44 },
  trophies: { position: 'absolute', bottom: -24, start: 42, flexDirection: 'row' },
  drive: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xl },
});
