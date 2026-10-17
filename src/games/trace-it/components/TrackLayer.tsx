import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ACCENTS, OUTLINE, type AccentName } from '@/sdk';
import { TRACK_WIDTH } from '../constants';
import type { Glyph, Pt } from '../types';
import { segmentsFor } from '../utils/segments';

/** Every `n`th point, always keeping the last one (resampled paths are dense). */
export function everyNth(points: readonly Pt[], n: number): Pt[] {
  const out = points.filter((_, i) => i % n === 0);
  const last = points[points.length - 1];
  if (last && out[out.length - 1] !== last) out.push(last);
  return out;
}

type PolylineProps = { points: readonly Pt[]; scale: number; thickness: number; color: string };

/** A round-capped, round-joined polyline drawn as rotated bars plus discs. */
export function Polyline({ points, scale, thickness, color }: PolylineProps) {
  const r = thickness / 2;
  return (
    <>
      {segmentsFor(points, scale, thickness).map((s, i) => (
        <View
          key={`s${i}`}
          style={[
            styles.abs,
            {
              left: s.left,
              top: s.top,
              width: s.length,
              height: s.thickness,
              backgroundColor: color,
              transform: [{ rotate: `${s.angle}deg` }],
            },
          ]}
        />
      ))}
      {points.map((p, i) => (
        <View
          key={`d${i}`}
          style={[
            styles.abs,
            {
              left: p[0] * scale - r,
              top: p[1] * scale - r,
              width: thickness,
              height: thickness,
              borderRadius: r,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </>
  );
}

type TrackLayerProps = { glyph: Glyph; scale: number; solo: boolean; accent: AccentName };

/** The static outlined "road" every path stroke runs along. */
export const TrackLayer = memo(function TrackLayer({ glyph, scale, solo, accent }: TrackLayerProps) {
  const paths = glyph.strokes.flatMap((s) => (s.kind === 'path' ? [everyNth(s.points, 2)] : []));
  const width = TRACK_WIDTH * scale;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, solo && styles.solo]}>
      {/* All outlines first, then all fills, so crossing strokes read as one road. */}
      {paths.map((pts, i) => (
        <Polyline key={`o${i}`} points={pts} scale={scale} thickness={width + 2 * OUTLINE.base} color={OUTLINE.color} />
      ))}
      {paths.map((pts, i) => (
        <Polyline key={`f${i}`} points={pts} scale={scale} thickness={width} color={ACCENTS[accent].tint} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  solo: { opacity: 0.35 },
});
