/**
 * Echo — Board component.
 *
 * Renders a 2×2 pad grid with a center HUB badge and sequence progress DOTS.
 * The `direction: 'ltr'` pin keeps pad positions in fixed LTR coordinates
 * (spatial layout, not reading-order) — matches the SortPuzzle drag surface
 * convention.
 *
 * Visual modes driven by `phase`:
 *   'watch'  — pads are dimmed/desaturated except the active one (lit)
 *   'input'  — pads are lifted / fully tappable
 *   'idle'   — pads are lifted on the start screen
 *
 * Hub badge:
 *   idle  → 🔊
 *   watch → 🎵
 *   input → "2/4" (inputIndex / sequenceLength, Fredoka bold)
 *
 * Progress dots (shown during watch + input only):
 *   on   — currently playing / completed-so-far during watch (blue glow)
 *   done — tapped correctly during input (green)
 *   next — next to tap during input (white + green ring)
 *   rest — upcoming (faint)
 */

import { Animated, StyleSheet, Text, View } from 'react-native';
import { useRef, useEffect } from 'react';
import { ACCENTS, COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/sdk';
import { Pad, type PadPhase } from './Pad';
import type { PadId } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BoardProps = {
  /** Number of active pads (3 or 4). */
  padCount: number;
  /** Set of pad ids that are currently lit. */
  litPads: ReadonlySet<PadId>;
  /** litMs for the Pad animation. */
  litMs: number;
  /** When true, all pads reject touch events (during playback / win). */
  disabled: boolean;
  /** Board-level phase — drives pad visual mode + hub + dots. */
  phase: PadPhase;
  /**
   * During input phase: how many pads the player has tapped so far (0-based).
   * Also used during watch to light the nth progress dot.
   */
  inputIndex: number;
  /** Total sequence length (used for hub "2/4" text + dot count). */
  sequenceLength: number;
  /** Called with the tapped pad id. */
  onPadPress: (padId: PadId) => void;
  /** Per-pad accessibility labels (index = padId). */
  padLabels: ReadonlyArray<string>;
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const PAD_SIZE = 130;
const PAD_GAP = 18; // matches mockup 18px gap
const HUB_SIZE = 78;

// ---------------------------------------------------------------------------
// Dot component
// ---------------------------------------------------------------------------

type DotState = 'on' | 'done' | 'next' | 'rest';

function ProgressDot({ state }: { state: DotState }): React.JSX.Element {
  const dotStyle = (() => {
    switch (state) {
      case 'on':
        return {
          backgroundColor: ACCENTS.blue.base,
          shadowColor: ACCENTS.blue.base,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 6,
          elevation: 4,
        };
      case 'done':
        return { backgroundColor: ACCENTS.green.base };
      case 'next':
        return {
          backgroundColor: COLORS.surface,
          borderWidth: 3,
          borderColor: ACCENTS.green.base,
        };
      case 'rest':
      default:
        // Faint hairline token (ink @ ~14%) for upcoming sequence positions.
        return { backgroundColor: COLORS.line2 };
    }
  })();

  return <View style={[styles.dot, dotStyle]} />;
}

// ---------------------------------------------------------------------------
// Hub badge
// ---------------------------------------------------------------------------

function HubBadge({
  phase,
  inputIndex,
  sequenceLength,
}: {
  phase: PadPhase;
  inputIndex: number;
  sequenceLength: number;
}): React.JSX.Element {
  let content: React.ReactNode;

  if (phase === 'input' && sequenceLength > 0) {
    // Show "2/4" progress text
    content = (
      <Text style={styles.hubProgress}>
        {inputIndex}/{sequenceLength}
      </Text>
    );
  } else if (phase === 'watch') {
    content = <Text style={styles.hubEmoji}>🎵</Text>;
  } else {
    content = <Text style={styles.hubEmoji}>🔊</Text>;
  }

  return <View style={styles.hub}>{content}</View>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Board({
  padCount,
  litPads,
  litMs,
  disabled,
  phase,
  inputIndex,
  sequenceLength,
  onPadPress,
  padLabels,
}: BoardProps) {
  const activePads: PadId[] = Array.from({ length: padCount }, (_, i) => i);
  const showDots = phase === 'watch' || phase === 'input';

  // Build dot states based on phase + progress
  const dotStates: DotState[] = Array.from({ length: sequenceLength }, (_, i) => {
    if (phase === 'watch') {
      // During watch: dot i is 'on' if it's the one currently playing
      const activeLit = litPads.size > 0;
      if (activeLit && i === inputIndex) return 'on';
      return 'rest';
    }
    // During input: dots before inputIndex are 'done', at inputIndex is 'next', after are 'rest'
    if (i < inputIndex) return 'done';
    if (i === inputIndex) return 'next';
    return 'rest';
  });

  // ---- Board-level dim during watch/playback phase ----
  // A subtle dark overlay recedes the whole stage so the single active pad
  // (which scales + glows above it) pops visually — mirrors the soft
  // radial vignette in the echo_watch_1.html mockup (.phone::after).
  // The lit pad renders last inside the grid (highest paint order) and its
  // elevated glow ring (elevation 20, scale 1.18) naturally breaks through
  // this gentle overlay.  Max opacity ~0.18 keeps it tasteful.
  const boardDimOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(boardDimOpacity, {
      toValue: phase === 'watch' ? 0.18 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [phase, boardDimOpacity]);

  return (
    // direction:'ltr' pins the grid to a fixed LTR coordinate system so pad
    // positions do NOT mirror under RTL — they are spatial, not reading-order.
    <View style={styles.wrapper}>
      {/* Grid layer — pads + hub */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {activePads.map((padId) => (
            <Pad
              key={padId}
              padId={padId}
              size={PAD_SIZE}
              lit={litPads.has(padId)}
              litMs={litMs}
              disabled={disabled}
              phase={phase}
              onPress={onPadPress}
              accessibilityLabel={padLabels[padId] ?? String(padId + 1)}
            />
          ))}
          {/* Center hub — absolutely centered over the 2x2 grid */}
          <HubBadge phase={phase} inputIndex={inputIndex} sequenceLength={sequenceLength} />
        </View>

        {/*
         * Board-level dim overlay — sits ABOVE the dimmed pads (rendered after
         * the grid) but below the active lit pad's glow ring which has a much
         * higher elevation.  pointerEvents="none" so touches still reach pads.
         */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.boardDimOverlay, { opacity: boardDimOpacity }]}
          pointerEvents="none"
        />
      </View>

      {/* Sequence progress dots below the board */}
      {showDots && sequenceLength > 0 && (
        <View style={styles.dotsRow}>
          {dotStates.map((state, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <ProgressDot key={i} state={state} />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const GRID_W = PAD_SIZE * 2 + PAD_GAP;
const GRID_H = PAD_SIZE * 2 + PAD_GAP;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  // Wraps the grid so the board dim overlay can fill exactly this area.
  gridContainer: {
    width: GRID_W,
    height: GRID_H,
    position: 'relative',
  },
  grid: {
    // Coordinate-pinned: do NOT let RTL mirror the pad positions.
    direction: 'ltr',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: PAD_GAP,
    width: GRID_W,
    position: 'relative',
  },
  // Subtle ink veil over the board during watch/playback phase.
  // The active pad's glow ring (elevation 20) naturally rises above this.
  boardDimOverlay: {
    backgroundColor: COLORS.ink,
    borderRadius: BORDER_RADIUS.tile,
    zIndex: 4,
  },
  // Center hub: absolutely centered over the 2×2 grid
  hub: {
    position: 'absolute',
    // Center in the grid: account for gap — center of grid = half of GRID_W
    left: (GRID_W - HUB_SIZE) / 2,
    // Vertical center = (full grid height - hub size) / 2
    // Full grid height = PAD_SIZE * 2 + PAD_GAP (two rows + one gap)
    top: (PAD_SIZE * 2 + PAD_GAP - HUB_SIZE) / 2,
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: HUB_SIZE / 2,
    backgroundColor: COLORS.canvas,
    borderWidth: 3,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  hubEmoji: {
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md * 1.1,
  },
  hubProgress: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.ink,
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
});
