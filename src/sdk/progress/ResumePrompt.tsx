import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
// Import useTranslation from react-i18next directly (not via @/sdk): this is an
// SDK-internal module and importing the barrel back would create a cycle.
import { useTranslation } from 'react-i18next';
import { EmojiImage } from '@/components/common/EmojiImage';
import { Icon } from '@/components/common/Icon';
import { Star } from '@/components/common/Star';
import { pulse, useLoop } from '@/components/pop/motion';
import { ACCENTS, COLORS, OUTLINE, POP, SHADOWS, SPACING } from '@/constants';
import { Mascot } from '@/sdk/mascot/Mascot';

export type ResumePromptProps = {
  level: number;
  onContinue: () => void;
  onStartOver: () => void;
};

const STONES_BEHIND = 4;
const STONES_AHEAD = 2;
const STONE = 36;
const BUDDY = 128;

/** Stones lift and dip along the trail, so it reads as a path, not a row of dots. */
const lift = (i: number) => ({ transform: [{ translateY: Math.sin(i * 1.4) * 14 }] });

function DoneStone({ i }: { i: number }) {
  return (
    <View style={[styles.stone, styles.stoneDone, lift(i)]}>
      <Star size={20} />
    </View>
  );
}

/**
 * The way back into a game, as a place: a trail with the buddy standing on the
 * stone they reached. Tap the buddy to carry on along it, or tap home, back at
 * the start of the trail, to begin again. The trail runs in reading direction.
 */
export function ResumePrompt({ level, onContinue, onStartOver }: ResumePromptProps) {
  const { t } = useTranslation();
  const beat = useLoop(900);
  const arrive = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(arrive, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
  }, [arrive]);

  const behind = Math.min(Math.max(1, level - 1), STONES_BEHIND);

  return (
    <View style={styles.root}>
      <View style={styles.trail}>
        <Pressable
          onPress={onStartOver}
          accessibilityRole="button"
          accessibilityLabel={t('resume.startOver')}
          hitSlop={10}
          style={({ pressed }) => [styles.home, pressed ? styles.pressed : SHADOWS.sm]}
        >
          <EmojiImage emoji="🏠" size={54} />
        </Pressable>

        {Array.from({ length: behind }, (_, i) => (
          <DoneStone key={i} i={i} />
        ))}

        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={t('resume.continueLevel', { level })}
          hitSlop={10}
        >
          <Animated.View style={[styles.buddy, { transform: [{ scale: arrive }] }]}>
            <Mascot pose="wave" size={BUDDY} />
            <View style={[styles.stoneHere, SHADOWS.sm]} />
            <Animated.View style={[styles.go, SHADOWS.sm, pulse(beat, 0.14)]}>
              <Icon name="arrow-forward" size={30} />
            </Animated.View>
          </Animated.View>
        </Pressable>

        {Array.from({ length: STONES_AHEAD }, (_, i) => (
          <View key={i} style={[styles.stone, styles.stoneAhead, lift(behind + i + 1)]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md },
  trail: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  home: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  stone: {
    width: STONE,
    height: STONE,
    borderRadius: STONE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  stoneDone: { backgroundColor: POP.zap },
  stoneAhead: { backgroundColor: COLORS.surface, borderColor: COLORS.inkFaint, borderStyle: 'dashed' },
  buddy: { alignItems: 'center' },
  stoneHere: {
    width: 104,
    height: 26,
    marginTop: -12,
    borderRadius: 13,
    backgroundColor: POP.zap,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    zIndex: -1,
  },
  go: {
    position: 'absolute',
    bottom: 0,
    end: -12,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENTS.green.base,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
});
