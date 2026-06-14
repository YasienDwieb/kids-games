/**
 * NumberChoice — chunky tappable numeral button for choice-row puzzles.
 *
 * States:
 *   default  — surface bg + line2 deep-edge shadow, press compresses 4px
 *   selected — same as default (selection acknowledged but not yet revealed)
 *   correct  — green tint bg + green border + "✓" badge top-right, pop scale 1.08
 *   wrong    — coral tint bg + coral border
 *   disabled — same visual, pointer events off
 *
 * Typography: FONTS.display for the numeral (Fredoka/IBM Plex Arabic), Western digits.
 * Touch target: 72px height minimum, flex-stretch width.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
} from '@/sdk';
import { CORRECT_COLOR, WRONG_COLOR } from '../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NumberChoiceState = 'default' | 'selected' | 'correct' | 'wrong';

type NumberChoiceProps = {
  value: number;
  state: NumberChoiceState;
  onPress: () => void;
  disabled: boolean;
  accessibilityLabel: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EDGE = 5; // depth of the 3D bottom edge (matches PressableButton)

export function NumberChoice({
  value,
  state,
  onPress,
  disabled,
  accessibilityLabel,
}: NumberChoiceProps): React.JSX.Element {
  const pressTranslate = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  // Correct state: pop-scale + badge scale-in animation
  useEffect(() => {
    if (state === 'correct') {
      popScale.setValue(1);
      badgeScale.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(popScale, {
            toValue: 1.08,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(popScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
          }),
        ]),
        Animated.sequence([
          Animated.timing(badgeScale, {
            toValue: 1.25,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(badgeScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 25,
            bounciness: 6,
          }),
        ]),
      ]).start();
    } else {
      popScale.setValue(1);
      badgeScale.setValue(0);
    }
  }, [state, popScale, badgeScale]);

  const pressIn = () => {
    if (disabled || state !== 'default') return;
    Animated.spring(pressTranslate, {
      toValue: EDGE,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pressTranslate, {
      toValue: 0,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  // Determine colors based on state
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';

  const faceColor = isCorrect
    ? ACCENTS.green.tint
    : isWrong
    ? ACCENTS.coral.tint
    : COLORS.surface;

  const edgeColor = isCorrect
    ? ACCENTS.green.deep
    : isWrong
    ? ACCENTS.coral.deep
    : COLORS.line2;

  const borderColor = isCorrect
    ? CORRECT_COLOR
    : isWrong
    ? WRONG_COLOR
    : 'transparent';

  const numeralColor = isCorrect
    ? ACCENTS.green.deep
    : isWrong
    ? ACCENTS.coral.deep
    : COLORS.ink;

  return (
    <Animated.View style={{ transform: [{ scale: popScale }] }}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.socket,
          SHADOWS.sm,
          { backgroundColor: edgeColor },
        ]}
      >
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: faceColor,
              borderColor,
              transform: [{ translateY: pressTranslate }],
            },
          ]}
        >
          <Text style={[styles.numeral, { color: numeralColor }]}>
            {value}
          </Text>
          {/* Correct badge — "✓" in a green circle, top-right */}
          {isCorrect && (
            <Animated.View
              style={[styles.badge, { transform: [{ scale: badgeScale }] }]}
            >
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeCheck}>✓</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  socket: {
    minWidth: 72,
    borderRadius: BORDER_RADIUS.btn,
    paddingBottom: EDGE,
    flex: 1,
  },
  face: {
    borderRadius: BORDER_RADIUS.btn,
    minHeight: 72,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  numeral: {
    fontFamily: FONTS.displayBold,
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    end: -8, // logical end so the checkmark badge mirrors correctly in RTL
  },
  badgeCircle: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: CORRECT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeCheck: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.surface,
    lineHeight: 16,
  },
});
