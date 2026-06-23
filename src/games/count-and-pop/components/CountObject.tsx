/**
 * CountObject — a tappable emoji tile for the countThisMany mode.
 *
 * States:
 *   default  — pulsing/tappable emoji on a surface card (press compresses 3px)
 *   popped   — scale-up + opacity-fade burst animation, then dashed border + ✓
 *
 * Animation (RN Animated only, NO Reanimated):
 *   On pop: Animated.parallel(scale 1→1.42, opacity 1→0) over 200/220ms.
 *   After fade: static "popped" slot with dashed border + faint check.
 *   Sparkle ring: separate scale + opacity anim (0.5→1.5, 1→0) during pop.
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
  EmojiImage,
  FONTS,
  SHADOWS,
  SPACING,
} from '@/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CountObjectProps = {
  emoji: string;
  popped: boolean;
  onPop: () => void;
  disabled: boolean;
  accessibilityLabel: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CountObject({
  emoji,
  popped,
  onPop,
  disabled,
  accessibilityLabel,
}: CountObjectProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const ringScaleAnim = useRef(new Animated.Value(0.5)).current;
  const ringOpacityAnim = useRef(new Animated.Value(0)).current;
  // Press compress anim (translateY on face, just like PressableButton)
  const pressTranslate = useRef(new Animated.Value(0)).current;

  // Trigger pop burst when `popped` transitions to true
  const prevPopped = useRef(false);
  useEffect(() => {
    if (popped && !prevPopped.current) {
      prevPopped.current = true;
      // Ring: fade in immediately, expand + fade out
      ringOpacityAnim.setValue(1);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.42,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(ringScaleAnim, {
          toValue: 1.5,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacityAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!popped) {
      prevPopped.current = false;
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      ringScaleAnim.setValue(0.5);
      ringOpacityAnim.setValue(0);
    }
  }, [popped, scaleAnim, opacityAnim, ringScaleAnim, ringOpacityAnim]);

  const pressIn = () => {
    if (disabled || popped) return;
    Animated.spring(pressTranslate, {
      toValue: 3,
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

  // Popped state: show dashed slot with a check mark
  if (popped) {
    return (
      <View
        style={styles.tileWrapper}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: true, disabled: true }}
      >
        {/* Sparkle ring — expands + fades during the pop animation */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sparkleRing,
            {
              transform: [{ scale: ringScaleAnim }],
              opacity: ringOpacityAnim,
            },
          ]}
        />
        {/* Burst emoji tile: scale up + fade out */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tile,
            styles.tilePopping,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <EmojiImage emoji={emoji} size={36} />
        </Animated.View>
        {/* Popped slot: dashed border + check */}
        <View style={[styles.tile, styles.tileDone]}>
          <Text style={styles.check}>✓</Text>
        </View>
      </View>
    );
  }

  // Live state: tappable emoji tile
  return (
    <Pressable
      onPress={disabled ? undefined : onPop}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: false }}
      style={styles.tileWrapper}
    >
      <Animated.View
        style={[
          styles.tile,
          SHADOWS.sm,
          { transform: [{ translateY: pressTranslate }] },
        ]}
      >
        <EmojiImage emoji={emoji} size={36} />
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const TILE_SIZE = 72; // meets 72px minimum touch target requirement

const styles = StyleSheet.create({
  tileWrapper: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: BORDER_RADIUS.soft,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePopping: {
    // Pink tint bg during pop animation (matches mockup)
    backgroundColor: ACCENTS.pink.tint,
    zIndex: 2,
  },
  tileDone: {
    backgroundColor: ACCENTS.green.tint,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: ACCENTS.green.base,
    // Reset shadow — no shadow on popped tiles per mockup
    shadowOpacity: 0,
    elevation: 0,
  },
  emoji: {
    fontSize: 36,
    lineHeight: 40,
    fontFamily: FONTS.display,
  },
  check: {
    fontSize: 28,
    color: ACCENTS.green.base,
    fontFamily: FONTS.displayBold,
    lineHeight: 32,
  },
  // Sparkle ring — a circular border that expands + fades
  sparkleRing: {
    position: 'absolute',
    width: TILE_SIZE + SPACING.md,
    height: TILE_SIZE + SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 3,
    borderColor: ACCENTS.pink.base,
    zIndex: 3,
  },
});
