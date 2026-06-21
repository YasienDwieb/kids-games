/**
 * GroupCount — visual object-group display for makeN and addition rounds.
 *
 * makeN layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  [filled objects × have]  +  [empty slots × needed] │
 *   └──────────────────────────────────────────────────┘
 *   Left group: filled emoji tiles (green tint bg, swimming anim).
 *   Right group: empty dashed slots (faint, no emoji).
 *   Divider: "+" sign between the two groups.
 *
 * addition layout:
 *   ┌──────────────────────────────────────────────────┐
 *   │  [group A × a]  +  [group B × b]               │
 *   └──────────────────────────────────────────────────┘
 *   Left group: a emoji tiles (blue tint bg, swimming anim).
 *   Right group: b emoji tiles (orange tint bg, swimming anim).
 *   Divider: "+" sign between the two groups.
 *
 * RTL: flex row with no direction pin — both groups mirror naturally.
 * Neither group contains ordered/sequential content, so RTL mirroring is safe.
 * Absolute positioning is NOT used inside groups, so no direction:ltr pin needed.
 *
 * Animation: same SwimmingEmoji as HowMany (translateY 0→−7 loop, staggered).
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONTS,
  SHADOWS,
  SPACING,
} from '@/sdk';
import type { MakeNRound, AdditionRound } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GroupCountProps = {
  round: MakeNRound | AdditionRound;
};

// ---------------------------------------------------------------------------
// SwimmingEmoji — translateY loop with stagger delay (same as HowMany)
// ---------------------------------------------------------------------------

function SwimmingEmoji({
  emoji,
  delayMs,
}: {
  emoji: string;
  delayMs: number;
}): React.JSX.Element {
  const swimAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(swimAnim, {
          toValue: -7,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(swimAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [swimAnim, delayMs]);

  return (
    <Animated.View style={{ transform: [{ translateY: swimAnim }] }}>
      <Text style={emojiStyles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const emojiStyles = StyleSheet.create({
  emoji: {
    fontSize: 36,
    lineHeight: 42,
  },
});

// ---------------------------------------------------------------------------
// EmojiTile — a single filled object tile in a group
// ---------------------------------------------------------------------------

function EmojiTile({
  emoji,
  delayMs,
  tintColor,
  size,
}: {
  emoji: string;
  delayMs: number;
  tintColor: string;
  size: number;
}): React.JSX.Element {
  return (
    <View
      style={[
        tileStyles.tile,
        { width: size, height: size, backgroundColor: tintColor },
        SHADOWS.sm,
      ]}
    >
      <SwimmingEmoji emoji={emoji} delayMs={delayMs} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// EmptySlot — a dashed outline slot for the "needed" portion in makeN
// ---------------------------------------------------------------------------

function EmptySlot({ size }: { size: number }): React.JSX.Element {
  return <View style={[tileStyles.emptySlot, { width: size, height: size }]} />;
}

const TILE_SIZE = 56;
const LANDSCAPE_TILE_SIZE = 40;

const tileStyles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: BORDER_RADIUS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: BORDER_RADIUS.soft,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.inkFaint,
    backgroundColor: COLORS.canvas2,
  },
});

// ---------------------------------------------------------------------------
// ObjectGroup — renders count tiles (filled or empty) in a wrapping grid
// ---------------------------------------------------------------------------

function ObjectGroup({
  count,
  emoji,
  delayOffset,
  tintColor,
  tileSize,
  empty = false,
}: {
  count: number;
  emoji: string;
  delayOffset: number;
  tintColor: string;
  tileSize: number;
  empty?: boolean;
}): React.JSX.Element {
  return (
    <View style={groupStyles.group}>
      {Array.from({ length: count }, (_, i) =>
        empty ? (
          <EmptySlot key={i} size={tileSize} />
        ) : (
          <EmojiTile
            key={i}
            emoji={emoji}
            delayMs={(delayOffset + i) * 280}
            tintColor={tintColor}
            size={tileSize}
          />
        ),
      )}
    </View>
  );
}

const groupStyles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    flex: 1,
    minWidth: 60,
  },
});

// ---------------------------------------------------------------------------
// Divider — the "+" sign between groups
// ---------------------------------------------------------------------------

function PlusDivider(): React.JSX.Element {
  return (
    <View style={dividerStyles.wrapper}>
      <Text style={dividerStyles.plus}>+</Text>
    </View>
  );
}

const dividerStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  plus: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.inkSoft,
    lineHeight: FONT_SIZES.lg + 4,
  },
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GroupCount({ round }: GroupCountProps): React.JSX.Element {
  // Landscape (guided flow): widen the card so tiles sit in one short row
  // instead of wrapping tall — keeps the prompt+visual+choices within height.
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const tileSize = landscape ? LANDSCAPE_TILE_SIZE : TILE_SIZE;

  if (round.mode === 'makeN') {
    const needed = round.target - round.have;
    return (
      <View style={[styles.card, landscape && styles.cardLandscape, SHADOWS.md]}>
        <View style={styles.groupRow}>
          {/* Left: filled "have" objects — green tint */}
          <ObjectGroup
            count={round.have}
            emoji={round.objectEmoji}
            delayOffset={0}
            tintColor={ACCENTS.green.tint}
            tileSize={tileSize}
          />
          <PlusDivider />
          {/* Right: empty "needed" slots */}
          <ObjectGroup
            count={needed}
            emoji={round.objectEmoji}
            delayOffset={round.have}
            tintColor={COLORS.canvas2}
            tileSize={tileSize}
            empty
          />
        </View>
      </View>
    );
  }

  // addition: two filled groups, left=blue tint, right=orange tint
  return (
    <View style={[styles.card, landscape && styles.cardLandscape, SHADOWS.md]}>
      <View style={styles.groupRow}>
        {/* Left group: a objects — blue tint */}
        <ObjectGroup
          count={round.a}
          emoji={round.objectEmoji}
          delayOffset={0}
          tintColor={ACCENTS.blue.tint}
          tileSize={tileSize}
        />
        <PlusDivider />
        {/* Right group: b objects — orange tint */}
        <ObjectGroup
          count={round.b}
          emoji={round.objectEmoji}
          delayOffset={round.a}
          tintColor={ACCENTS.orange.tint}
          tileSize={tileSize}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.md,
  },
  // Landscape: wider card so each group's tiles fit on one row (shorter card).
  cardLandscape: {
    maxWidth: 680,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    flexWrap: 'nowrap',
  },
});
