/**
 * AnimalTile — one chunky, tappable animal choice.
 *
 * Mirrors letter-land's LetterTile (the 3D socket/face tile) but renders the
 * animal's EMOJI instead of a glyph. Used by both round modes (hearName and
 * whichSound): the child taps the tile to pick that animal.
 *
 * Visual:
 *   - 3D socket (deep edge) + raised face, pressed in via translateY.
 *   - default → cream surface; correct → green; wrong → coral.
 *   - correct also pops the face and scales in a gold "✓" badge.
 *
 * RTL:
 *   - The badge inset uses logical `end` (not `right`) so it mirrors. The tile
 *     itself is position-independent — the choice row that lays out tiles is the
 *     one responsible for not direction-pinning.
 *   - The emoji is authored DATA, rendered literally (never translated).
 *
 * a11y:
 *   - accessibilityRole='button', a localized label, and accessibilityState
 *     { disabled, selected } (selected = the correct tile).
 *   - `revealName` controls whether the label names the animal. hearName rounds
 *     reveal it (default); whichSound rounds pass `revealName={false}` so the
 *     a11y label doesn't give away the answer (a generic "Pick this animal").
 */

import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  useTranslation,
} from '@/sdk';
import type { Animal } from '../types';
import { ANIMAL_IMAGES } from '../animalImages';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type AnimalTileState = 'default' | 'correct' | 'wrong';

type AnimalTileProps = {
  /** The animal this tile represents (carries id + emoji). */
  animal: Animal;
  /** Visual + a11y state of the tile. */
  state: AnimalTileState;
  /** Called when the tile is tapped. */
  onPress: () => void;
  /** Whether tapping should be ignored (post-answer cooldown / overlay). */
  disabled?: boolean;
  /**
   * Whether the a11y label may name the animal. Default `true` (hearName).
   * whichSound passes `false` so the label stays generic and never reveals the
   * answer by naming it.
   */
  revealName?: boolean;
};

// ---------------------------------------------------------------------------
// AnimalTile
// ---------------------------------------------------------------------------

const EDGE = 6; // depth of the 3D bottom edge

export function AnimalTile({
  animal,
  state,
  onPress,
  disabled = false,
  revealName = true,
}: AnimalTileProps): React.JSX.Element {
  const { t } = useTranslation();

  const pressTranslate = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';

  // Correct: pop-scale + badge scale-in.
  useEffect(() => {
    if (isCorrect) {
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
  }, [isCorrect, popScale, badgeScale]);

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

  const faceColor = isCorrect
    ? ACCENTS.green.base
    : isWrong
    ? ACCENTS.coral.base
    : COLORS.surface;

  const edgeColor = isCorrect
    ? ACCENTS.green.deep
    : isWrong
    ? ACCENTS.coral.deep
    : COLORS.line2;

  // hearName reveals the name; whichSound stays generic so the label never
  // gives away the correct answer.
  const label = revealName
    ? t('animal-safari:a11y.choiceTile', {
        name: t(`animal-safari:names.${animal.id}`),
      })
    : t('animal-safari:a11y.choiceTileGeneric');

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale: popScale }] }]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, selected: isCorrect }}
        style={[styles.socket, SHADOWS.md, { backgroundColor: edgeColor }]}
      >
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: faceColor,
              transform: [{ translateY: pressTranslate }],
            },
          ]}
        >
          {/* OpenMoji animal image. Decorative within the labeled Pressable
              button, so it opts out of a11y to avoid a double announcement. */}
          <Image
            source={ANIMAL_IMAGES[animal.id]}
            style={styles.image}
            resizeMode="contain"
            accessible={false}
          />
          {/* Correct badge — gold "✓" circle; logical `end` inset so it mirrors. */}
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
  tileWrap: {
    flex: 1,
    maxWidth: 140,
  },
  socket: {
    borderRadius: BORDER_RADIUS.card,
    paddingBottom: EDGE,
  },
  face: {
    borderRadius: BORDER_RADIUS.card,
    aspectRatio: 0.82,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  image: {
    width: 64,
    height: 64,
  },

  // Correct badge — gold circle, logical `end` inset.
  badge: {
    position: 'absolute',
    top: -12,
    end: -8,
  },
  badgeCircle: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  badgeCheck: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.surface,
    lineHeight: 22,
  },
});
