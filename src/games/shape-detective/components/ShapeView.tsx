/**
 * ShapeView — renders a single Shape (kind + color + size) using plain Views.
 *
 * No SVG dependency. Each kind is approximated with View + borderRadius / transforms:
 *   circle   → fully rounded square
 *   square   → plain rounded square
 *   triangle → zero-size view with borders (CSS triangle trick)
 *   star     → two overlapping rotated squares (asterisk / star shape)
 *   heart    → two rounded halves composed with transforms
 *   diamond  → square rotated 45°
 *
 * All colors + shadows come from SDK design tokens. Fully RTL-safe: no left/right.
 * accessibilityLabel encodes kind + size.
 */

import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SHADOWS, useTranslation } from '@/sdk';
import { SHAPE_SIZE_PX } from '../constants';
import type { Shape } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShapeViewProps = {
  shape: Shape;
  /** Override container style (e.g. for selected/pressed state). */
  style?: ViewStyle;
  /** Used by the parent to pass an accessibility label. */
  accessibilityLabel?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Darken a hex color by `amount` (0–1) for the shadow/edge color. */
function darken(hex: string, amount = 0.22): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return hex;
  const f = 1 - amount;
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ---------------------------------------------------------------------------
// Kind renderers
// ---------------------------------------------------------------------------

function CircleShape({ size, color }: { size: number; color: string }): React.JSX.Element {
  const r = size / 2;
  return (
    <View
      style={[
        styles.shapeBase,
        SHADOWS.sm,
        {
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: color,
          borderColor: darken(color),
          borderWidth: 2,
        },
      ]}
    />
  );
}

function SquareShape({ size, color }: { size: number; color: string }): React.JSX.Element {
  return (
    <View
      style={[
        styles.shapeBase,
        SHADOWS.sm,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.14),
          backgroundColor: color,
          borderColor: darken(color),
          borderWidth: 2,
        },
      ]}
    />
  );
}

/**
 * Triangle: CSS-trick using a zero-size view with transparent left/right borders
 * and a solid bottom border. Width × height ≈ equilateral triangle.
 * We wrap it in a clipping container sized to `size × size`.
 */
function TriangleShape({ size, color }: { size: number; color: string }): React.JSX.Element {
  const half = size / 2;
  const height = Math.round(size * 0.87); // ≈ equilateral height
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderBottomWidth: height,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
    </View>
  );
}

/**
 * Diamond: square rotated 45°. We place it in a container of size × size
 * so layout footprint matches the other shapes.
 */
function DiamondShape({ size, color }: { size: number; color: string }): React.JSX.Element {
  const inner = Math.round(size * 0.72);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={[
          SHADOWS.sm,
          {
            width: inner,
            height: inner,
            borderRadius: Math.round(inner * 0.1),
            backgroundColor: color,
            borderColor: darken(color),
            borderWidth: 2,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Star: two overlapping squares (one straight, one rotated 45°) — classic
 * CSS star approximation without SVG. Sized to fit inside `size × size`.
 */
function StarShape({ size, color }: { size: number; color: string }): React.JSX.Element {
  const sq = Math.round(size * 0.55);
  const shared: ViewStyle = {
    position: 'absolute',
    width: sq,
    height: sq,
    borderRadius: Math.round(sq * 0.12),
    backgroundColor: color,
    borderColor: darken(color),
    borderWidth: 1.5,
  };
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={shared} />
      <View style={[shared, { transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
}

/**
 * Heart: two rounded rectangles ("lobes") placed above a V-notch base.
 * Approximated with two circles + a rotated square, all same fill.
 */
function HeartShape({ size, color }: { size: number; color: string }): React.JSX.Element {
  // Heart built from two overlapping circles (top lobes) + a rotated square (bottom point).
  const lobeR = Math.round(size * 0.29);
  const pointSide = Math.round(size * 0.52);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Bottom diamond point */}
      <View
        style={{
          position: 'absolute',
          width: pointSide,
          height: pointSide,
          backgroundColor: color,
          borderRadius: 4,
          bottom: Math.round(size * 0.04),
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
          start: Math.round(size * 0.07),
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
          end: Math.round(size * 0.07),
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ShapeView({ shape, style, accessibilityLabel }: ShapeViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const px = SHAPE_SIZE_PX[shape.size];

  let inner: React.JSX.Element;
  switch (shape.kind) {
    case 'circle':
      inner = <CircleShape size={px} color={shape.color} />;
      break;
    case 'square':
      inner = <SquareShape size={px} color={shape.color} />;
      break;
    case 'triangle':
      inner = <TriangleShape size={px} color={shape.color} />;
      break;
    case 'diamond':
      inner = <DiamondShape size={px} color={shape.color} />;
      break;
    case 'star':
      inner = <StarShape size={px} color={shape.color} />;
      break;
    case 'heart':
      inner = <HeartShape size={px} color={shape.color} />;
      break;
  }

  // Bug #4: build label from translated kind/size so screen readers speak the
  // correct language rather than raw enum values (circle, large, etc.).
  const kindLabel = t(`shape-detective:shapes.kind.${shape.kind}`);
  const sizeLabel = t(`shape-detective:shapes.size.${shape.size}`);
  const label = accessibilityLabel ?? `${sizeLabel} ${kindLabel}`;

  return (
    <View
      style={[{ width: px, height: px, alignItems: 'center', justifyContent: 'center' }, style]}
      accessible
      accessibilityLabel={label}
    >
      {inner}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  shapeBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
