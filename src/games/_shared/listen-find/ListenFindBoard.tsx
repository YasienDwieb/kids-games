/**
 * ListenFindBoard — the shared "listen, then tap the matching tile" board.
 *
 * Landscape-native two-column layout (app is globally landscape):
 *   ┌───────────────────────┬──────────────────────────────┐
 *   │   tappable hero pic    │  Which … is it? (instruction)│
 *   │   + 🔊 replay badge     │  [ tile ] [ tile ] [ tile ]  │
 *   └───────────────────────┴──────────────────────────────┘
 *
 * The board owns LAYOUT + the choice tiles only. The `hero` node is supplied by
 * each game (a word picture for letters, a count cluster for numbers); the
 * board wraps it in a Pressable that calls `onReplay`, with a small speaker
 * badge as the listen affordance.
 *
 * RTL:
 *   - Columns are a plain flex row (logical), so they mirror under Arabic.
 *   - Choice row: standard flex row, NO direction pin — logical indices are
 *     position-independent; correctIndex is never adjusted for visual position.
 *   - Glyphs are authored DATA, rendered literally. Badge/inset uses logical
 *     `end` so it mirrors.
 */

import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
  type AccentName,
} from '@/sdk';
import type { FindItem } from './types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ListenFindBoardProps = {
  /** The hero visual (game-supplied: word picture / count cluster). */
  hero: React.ReactNode;
  /** The instruction line (already localized). */
  instruction: string;
  /** The round's choices (includes the target). */
  choices: readonly FindItem[];
  /** 0-based index of the correct choice. */
  correctIndex: number;
  /** Index the player tapped (null = unanswered). */
  selectedIndex: number | null;
  /** Called when a choice tile is tapped. */
  onPick: (index: number) => void;
  /** Re-speak the target (host owns the speech). */
  onReplay: () => void;
  /** Ignore taps during the post-answer cooldown / overlay. */
  disabled?: boolean;
  /** Accent family for the hero surface + speaker badge. */
  accent?: AccentName;
  /** Root background; pass 'transparent' in guided mode so the backdrop shows. */
  background?: string;
  /**
   * a11y label for a choice tile, given the whole choice item. Glyph games read
   * `item.glyph`; image games (which have no glyph) derive the label from
   * `item.id` or keep it generic.
   */
  choiceLabel: (item: FindItem) => string;
};

type TileState = 'default' | 'correct' | 'wrong';

const EDGE = 6; // depth of the 3D bottom edge

// ---------------------------------------------------------------------------
// ChoiceTile — one chunky tappable glyph (ported from letter-land HearAndFind)
// ---------------------------------------------------------------------------

function ChoiceTile({
  item,
  state,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityState,
}: {
  item: FindItem;
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

  useEffect(() => {
    if (isCorrect) {
      popScale.setValue(1);
      badgeScale.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(popScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
          Animated.spring(popScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
        ]),
        Animated.sequence([
          Animated.timing(badgeScale, { toValue: 1.25, duration: 180, useNativeDriver: true }),
          Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 6 }),
        ]),
      ]).start();
    } else {
      popScale.setValue(1);
      badgeScale.setValue(0);
    }
  }, [isCorrect, popScale, badgeScale]);

  const pressIn = () => {
    if (disabled || state !== 'default') return;
    Animated.spring(pressTranslate, { toValue: EDGE, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };

  const pressOut = () => {
    Animated.spring(pressTranslate, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };

  const faceColor = isCorrect ? ACCENTS.green.base : isWrong ? ACCENTS.coral.base : COLORS.surface;
  const edgeColor = isCorrect ? ACCENTS.green.deep : isWrong ? ACCENTS.coral.deep : COLORS.line2;
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
          style={[styles.face, { backgroundColor: faceColor, transform: [{ translateY: pressTranslate }] }]}
        >
          {/* Image face (animal art) when the choice carries an image; otherwise
              the literal glyph. Decorative within the labeled Pressable, so the
              image opts out of a11y to avoid a double announcement. */}
          {item.image !== undefined ? (
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="contain"
              accessible={false}
            />
          ) : (
            <Text style={[styles.glyph, { color: glyphColor }]}>{item.glyph}</Text>
          )}
          {isCorrect && (
            <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
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
// ListenFindBoard
// ---------------------------------------------------------------------------

export function ListenFindBoard({
  hero,
  instruction,
  choices,
  correctIndex,
  selectedIndex,
  onPick,
  onReplay,
  disabled = false,
  accent = 'blue',
  background = COLORS.canvas,
  choiceLabel,
}: ListenFindBoardProps): React.JSX.Element {
  const answered = selectedIndex !== null;

  const tileState = (idx: number): TileState => {
    if (selectedIndex === null) return 'default';
    if (idx === correctIndex) return 'correct';
    if (idx === selectedIndex) return 'wrong';
    return 'default';
  };

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {/* Left column — tappable hero picture + speaker badge (the replay). */}
      <View style={styles.heroCol}>
        <Pressable
          onPress={disabled ? undefined : onReplay}
          disabled={disabled}
          accessibilityRole="button"
          style={[styles.heroPress, SHADOWS.md, { backgroundColor: ACCENTS[accent].tint }]}
        >
          {hero}
          <View style={[styles.speakerBadge, { backgroundColor: ACCENTS[accent].base }]}>
            <Text style={styles.speakerGlyph}>🔊</Text>
          </View>
        </Pressable>
      </View>

      {/* Right column — instruction + choice row. */}
      <View style={styles.choiceCol}>
        <Text style={styles.instruction}>{instruction}</Text>
        <View style={styles.row}>
          {choices.map((choice, idx) => {
            const state = tileState(idx);
            return (
              <ChoiceTile
                key={choice.id}
                item={choice}
                state={state}
                onPress={() => onPick(idx)}
                disabled={disabled || answered}
                accessibilityLabel={choiceLabel(choice)}
                accessibilityState={{ disabled: disabled || answered, selected: state === 'correct' }}
              />
            );
          })}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.canvas,
  },

  // Hero column
  heroCol: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroPress: {
    aspectRatio: 1,
    width: '82%',
    maxWidth: 260,
    borderRadius: BORDER_RADIUS.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  speakerBadge: {
    position: 'absolute',
    bottom: -10,
    end: -10,
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  speakerGlyph: { fontSize: 26 },

  // Choice column
  choiceCol: { flex: 1.2, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  instruction: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: COLORS.ink,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: SPACING.md,
    width: '100%',
    maxWidth: 520,
  },

  // Choice tile (ported)
  tileWrap: { flex: 1, maxWidth: 150 },
  socket: { borderRadius: BORDER_RADIUS.card, paddingBottom: EDGE },
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
  // Image face (animal art) — same footprint as a glyph so the row stays uniform.
  image: { width: 64, height: 64 },
  badge: { position: 'absolute', top: -12, end: -8 },
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
