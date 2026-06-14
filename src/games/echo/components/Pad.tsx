/**
 * Echo — Pad component.
 *
 * A single tappable pad that renders a shape icon and supports three visual
 * modes driven by `lit`, `phase`, and `disabled`:
 *
 *   ACTIVE (lit=true)     — scale 1.18, white ring + colored glow halo.
 *                           Fast on-edge (~70ms), hold litMs, ~130ms off.
 *                           Dramatic blink — the core playback cue.
 *   DIMMED (watch phase,  — desaturated + darkened face (opacity 0.38,
 *           not active)     saturation approx via tinted overlay), flat shadow.
 *   LIFTED (input/idle)   — full color, chunky bottom shadow + top highlight
 *                           stripe so it reads as physically pressable.
 *
 * Accessibility: role="button", localized label, accessibilityState.disabled.
 * RTL-safe: no absolute left/right (uses start/end inside icon renderers).
 * Tokens only — no raw hex values outside constants.ts.
 */

import { useRef, useEffect } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { BORDER_RADIUS, COLORS } from '@/sdk';
import type { PadId } from '../types';
import { PAD_COLORS, PAD_SHAPES, type PadShape } from '../constants';

// ---------------------------------------------------------------------------
// Local color constant
// ---------------------------------------------------------------------------

// Translucent-white sheen on the top of a lifted pad (the "pressable" highlight).
// Pure white at 30% — there is no token equivalent (COLORS has no translucent
// white); kept as a documented constant in the same style as the SDK's own
// rgba tokens (COLORS.overlay / COLORS.shadow are defined this way).
const TOP_HIGHLIGHT_COLOR = 'rgba(255,255,255,0.30)';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Board-level phase passed down so each pad knows its visual mode. */
export type PadPhase = 'watch' | 'input' | 'idle';

type PadProps = {
  /** 0-based pad index — drives color + shape from PAD_COLORS / PAD_SHAPES. */
  padId: PadId;
  /** Size of the pad face in pixels (square). */
  size: number;
  /** Whether this pad is currently "lit" (active blink). */
  lit: boolean;
  /** Duration of the light-up hold (ms). */
  litMs: number;
  /** When true, the pad rejects touch events (during playback / win). */
  disabled: boolean;
  /** Board phase — drives DIMMED vs LIFTED appearance. */
  phase: PadPhase;
  /** Called when the player taps this pad. */
  onPress: (padId: PadId) => void;
  /** Localized accessibility label. */
  accessibilityLabel: string;
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** How many px the "socket" shadow extends below the face. */
const PAD_EDGE = 6;

/** Icon size relative to pad face size. */
const ICON_RATIO = 64 / 149; // ≈ 0.43 — matches mockup 64px icon on ~149px pad

// ---------------------------------------------------------------------------
// Icon renderers (no SVG — View-primitive approximations)
// ---------------------------------------------------------------------------

function StarIcon({ size, color }: { size: number; color: string }): React.JSX.Element {
  // Two overlapping rounded squares: one straight, one rotated 45°
  const sq = Math.round(size * 0.55);
  const shared = {
    position: 'absolute' as const,
    width: sq,
    height: sq,
    borderRadius: Math.round(sq * 0.15),
    backgroundColor: color,
  };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={shared} />
      <View style={[shared, { transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
}

function HeartIcon({ size, color }: { size: number; color: string }): React.JSX.Element {
  const lobeR = Math.round(size * 0.28);
  const pointSide = Math.round(size * 0.52);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Bottom diamond point */}
      <View
        style={{
          position: 'absolute',
          width: pointSide,
          height: pointSide,
          backgroundColor: color,
          borderRadius: 5,
          bottom: Math.round(size * 0.03),
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Left lobe */}
      <View
        style={{
          position: 'absolute',
          width: lobeR * 2,
          height: lobeR * 2,
          borderRadius: lobeR,
          backgroundColor: color,
          top: Math.round(size * 0.08),
          start: Math.round(size * 0.06),
        }}
      />
      {/* Right lobe */}
      <View
        style={{
          position: 'absolute',
          width: lobeR * 2,
          height: lobeR * 2,
          borderRadius: lobeR,
          backgroundColor: color,
          top: Math.round(size * 0.08),
          end: Math.round(size * 0.06),
        }}
      />
    </View>
  );
}

function CircleIcon({ size, color }: { size: number; color: string }): React.JSX.Element {
  const r = Math.round(size * 0.46);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function SquareIcon({ size, color }: { size: number; color: string }): React.JSX.Element {
  const side = Math.round(size * 0.7);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: side,
          height: side,
          borderRadius: Math.round(side * 0.16),
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function PadIcon({ shape, size }: { shape: PadShape; size: number }): React.JSX.Element {
  const color = COLORS.surface; // white icon on colored pad
  switch (shape) {
    case 'star':
      return <StarIcon size={size} color={color} />;
    case 'heart':
      return <HeartIcon size={size} color={color} />;
    case 'circle':
      return <CircleIcon size={size} color={color} />;
    case 'square':
      return <SquareIcon size={size} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Pad({ padId, size, lit, litMs, disabled, phase, onPress, accessibilityLabel }: PadProps) {
  const colors = PAD_COLORS[padId];
  const shape = PAD_SHAPES[padId];
  const iconSize = Math.round(size * ICON_RATIO * 2.0); // scale to ~43% of pad

  // ---------------------------------------------------------------------------
  // Animated values
  // ---------------------------------------------------------------------------

  // Face scale: 1 → 1.18 when lit (active blink)
  const scale = useRef(new Animated.Value(1)).current;

  // White ring + colored glow halo opacity: 0 → 1 when lit
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Dim overlay opacity: for DIMMED state (watch phase, not lit)
  // 0 = full color, 0.62 = desaturated/darkened effect
  const dimOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Icon glow scale: subtle grow when lit (1 → 1.15)
  const iconScale = useRef(new Animated.Value(1)).current;

  // ---- Lit animation (active blink) ----
  useEffect(() => {
    if (lit) {
      // Fast on-edge: ~70ms to reach peak, hold for litMs, then engine sets lit=false
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1.15,
          duration: 70,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Off-edge: ~130ms fade out
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [lit, scale, glowOpacity, iconScale]);

  // ---- Dim overlay animation (watch phase = dimmed when not lit) ----
  useEffect(() => {
    const shouldDim = phase === 'watch' && !lit;
    Animated.timing(dimOverlayOpacity, {
      toValue: shouldDim ? 0.62 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [phase, lit, dimOverlayOpacity]);

  // ---------------------------------------------------------------------------
  // Shadow style — varies by visual mode
  // ---------------------------------------------------------------------------

  const isLifted = phase === 'input' || phase === 'idle';
  const shadowStyle = isLifted ? styles.shadowLifted : styles.shadowFlat;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Pressable
      onPress={disabled ? undefined : () => onPress(padId)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.socket,
        shadowStyle,
        {
          width: size,
          height: size + PAD_EDGE,
          borderRadius: BORDER_RADIUS.tile,
          backgroundColor: colors.deep,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      {/* --- Animated face (scale on blink) --- */}
      <Animated.View
        style={[
          styles.face,
          {
            width: size,
            height: size,
            borderRadius: BORDER_RADIUS.tile,
            backgroundColor: colors.base,
            transform: [{ scale }],
          },
        ]}
      >
        {/* Top highlight stripe (lifted mode) — white gradient fade */}
        {isLifted && <View style={[styles.topHighlight, { borderRadius: BORDER_RADIUS.tile }]} />}

        {/* Pad shape icon (centered) */}
        <Animated.View
          style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}
          pointerEvents="none"
        >
          <PadIcon shape={shape} size={iconSize} />
        </Animated.View>

        {/* Dim overlay — dark tint for DIMMED (watch) state */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.dimOverlay,
            {
              borderRadius: BORDER_RADIUS.tile,
              opacity: dimOverlayOpacity,
            },
          ]}
          pointerEvents="none"
        />
      </Animated.View>

      {/* --- White ring + colored glow halo (active blink only) --- */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 14,
            height: size + 14,
            borderRadius: BORDER_RADIUS.tile + 7,
            borderColor: COLORS.surface,
            shadowColor: colors.base,
            opacity: glowOpacity,
          },
        ]}
        pointerEvents="none"
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  socket: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'visible',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 6,
    start: 6,
    end: 6,
    height: '26%',
    backgroundColor: TOP_HIGHLIGHT_COLOR,
    zIndex: 1,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dimOverlay: {
    backgroundColor: COLORS.ink,
    zIndex: 3,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  // Lifted shadow — chunky bottom edge for pressable feel (input/idle)
  shadowLifted: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 10,
  },
  // Flat shadow — minimal depth (watch phase, other pads dimmed)
  shadowFlat: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  // White ring glow around lit pad
  glowRing: {
    position: 'absolute',
    top: -7,
    left: -7,
    borderWidth: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 20,
    backgroundColor: 'transparent',
  },
});
