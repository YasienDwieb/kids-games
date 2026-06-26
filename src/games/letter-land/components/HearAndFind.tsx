/**
 * HearAndFind — the "listen, then tap the matching letter" round.
 *
 * Layout (approved mockup: letter_land_hearfind_2.html):
 *   ┌──────────────────────────────┐
 *   │ LISTEN… label                │
 *   │ ◉ big hero speaker (IconButton)  ← onPress = onReplay → host speaks
 *   │ Tap to hear it again         │
 *   │ Which letter is it?          │  ← instruction
 *   │ [ tile ] [ tile ] [ tile ]   │  ← 3 big letter tiles from round.choices
 *   └──────────────────────────────┘
 *
 * The host owns speech + advance logic; this component only calls onReplay
 * (re-speak) and onPick(index).
 *
 * RTL:
 *   - Choice row: standard flex row, NO direction pin. Logical indices are
 *     position-independent; correctIndex is never adjusted for visual position.
 *   - Letter glyphs are authored DATA, rendered literally (never translated).
 *   - Correct badge inset uses logical `end`, not `right`, so it mirrors.
 *
 * a11y:
 *   - Each tile: accessibilityRole='button', localized label, and
 *     accessibilityState { disabled, selected } (selected = the correct tile).
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  IconButton,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import type { HearAndFindRound } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type HearAndFindProps = {
  /** The round to render (target + choices + correctIndex). */
  round: HearAndFindRound;
  /** Re-speak the target letter (host owns the speech). */
  onReplay: () => void;
  /** Called when a choice tile is tapped. */
  onPick: (index: number) => void;
  /** Index the player has tapped (null = not yet answered). */
  selectedIndex: number | null;
  /** Whether tapping should be ignored (post-answer cooldown / overlay). */
  disabled?: boolean;
};

type TileState = 'default' | 'correct' | 'wrong';

// ---------------------------------------------------------------------------
// LetterTile — one chunky tappable letter (mirrors NumberChoice pattern)
// ---------------------------------------------------------------------------

const EDGE = 6; // depth of the 3D bottom edge

function LetterTile({
  glyph,
  state,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityState,
}: {
  glyph: string;
  state: TileState;
  onPress: () => void;
  disabled: boolean;
  accessibilityLabel: string;
  accessibilityState: { disabled?: boolean; selected?: boolean };
}): React.JSX.Element {
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

  const glyphColor = isCorrect || isWrong ? COLORS.surface : COLORS.ink;

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale: popScale }] }]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
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
          <Text style={[styles.glyph, { color: glyphColor }]}>{glyph}</Text>
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
// Main component
// ---------------------------------------------------------------------------

export function HearAndFind({
  round,
  onReplay,
  onPick,
  selectedIndex,
  disabled = false,
}: HearAndFindProps): React.JSX.Element {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const { choices, correctIndex } = round;
  const answered = selectedIndex !== null;

  const getTileState = (idx: number): TileState => {
    if (selectedIndex === null) return 'default';
    if (idx === correctIndex) return 'correct';
    if (idx === selectedIndex) return 'wrong';
    return 'default';
  };

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Hero speaker — the listening moment is the star. */}
      <View style={styles.hero}>
        <Text style={styles.listenLabel}>{t('letter-land:hearFind.listen')}</Text>
        <IconButton
          glyph="🔊"
          onPress={onReplay}
          disabled={disabled}
          accessibilityLabel={t('letter-land:a11y.replay')}
          size={landscape ? 116 : 148}
          glyphSize={landscape ? 56 : 70}
          style={styles.speaker}
        />
        <Text style={styles.tapAgain}>{t('letter-land:hearFind.tapAgain')}</Text>
      </View>

      {/* Instruction */}
      <Text style={styles.which}>{t('letter-land:hearFind.which')}</Text>

      {/* Choice row — no direction pin: equal-weight options, safe to mirror. */}
      <View style={[styles.row, landscape && styles.rowLandscape]}>
        {choices.map((choice, idx) => {
          const state = getTileState(idx);
          return (
            <LetterTile
              key={choice.id}
              glyph={choice.glyph}
              state={state}
              onPress={() => onPick(idx)}
              disabled={disabled || answered}
              accessibilityLabel={t('letter-land:a11y.choiceTile', {
                glyph: choice.glyph,
              })}
              accessibilityState={{
                disabled: disabled || answered,
                selected: state === 'correct',
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.canvas,
  },
  // Landscape: distribute hero / instruction / choices evenly across the
  // shorter height — device-agnostic, no pixel budgets.
  rootLandscape: {
    justifyContent: 'space-evenly',
    gap: 0,
    paddingVertical: SPACING.xs,
    backgroundColor: 'transparent',
  },

  // Hero block
  hero: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  listenLabel: {
    fontFamily: FONTS.bodyExtra,
    fontSize: 13,
    letterSpacing: 0.8,
    color: COLORS.inkSoft,
  },
  speaker: {
    backgroundColor: ACCENTS.blue.base,
    borderRadius: BORDER_RADIUS.card,
  },
  tapAgain: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.inkSoft,
  },

  // Instruction
  which: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.ink,
    textAlign: 'center',
  },

  // Choice row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
    maxWidth: 420,
  },
  rowLandscape: {
    maxWidth: 720,
    justifyContent: 'space-evenly',
    flexGrow: 0,
    flexShrink: 0,
  },

  // Letter tile
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
  glyph: {
    fontFamily: FONTS.displayBold,
    fontSize: 60,
    lineHeight: 70,
    textAlign: 'center',
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
