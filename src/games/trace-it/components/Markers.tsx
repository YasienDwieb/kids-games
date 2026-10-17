import { Animated, StyleSheet, View } from 'react-native';
import { ACCENTS, COLORS, OUTLINE, useLoop, type AccentName, type HintStep } from '@/sdk';
import { TRACK_WIDTH } from '../constants';
import type { Glyph, Pt } from '../types';

// The arrow sits this many resampled points ahead of the start dot.
const ARROW_AHEAD = 6;

type MarkersProps = {
  glyph: Glyph;
  stroke: number;
  progress: number;
  done: boolean;
  scale: number;
  guided: boolean;
  hint: HintStep | null;
  accent: AccentName;
};

/**
 * Where to start and which way to go — for the current stroke only (several
 * strokes can share a start point). Dot targets appear once every path is done.
 */
export function Markers({ glyph, stroke, progress, done, scale, guided, hint, accent }: MarkersProps) {
  const bounce = useLoop(700, { enabled: !done && hint === 'retry' });
  const throb = useLoop(800, { enabled: !done && guided && hint === 'highlight' });
  if (done) return null;
  const current = glyph.strokes[stroke];
  const colors = ACCENTS[accent];
  const dotSize = TRACK_WIDTH * scale * 0.8;
  const hop = { transform: [{ translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -dotSize * 0.5] }) }] };

  const at = (p: Pt, size: number) => ({
    left: p[0] * scale - size / 2,
    top: p[1] * scale - size / 2,
    width: size,
    height: size,
  });

  if (current.kind === 'dot') {
    const ghost = TRACK_WIDTH * scale;
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {glyph.strokes.map((s, i) =>
          s.kind === 'dot' && i >= stroke ? (
            <Animated.View
              key={i}
              style={[
                styles.ghost,
                at(s.at, ghost),
                { borderRadius: ghost / 2, borderColor: colors.deep, backgroundColor: colors.tint },
                i === stroke && hop,
              ]}
            />
          ) : null,
        )}
      </View>
    );
  }

  const pts = current.points;
  const start = pts[Math.min(progress, pts.length - 1)];
  const ahead = pts[Math.min(progress + ARROW_AHEAD, pts.length - 1)];
  const angle = (Math.atan2(ahead[1] - start[1], ahead[0] - start[0]) * 180) / Math.PI;
  const arrow = TRACK_WIDTH * scale * 0.6;
  const throbStyle = { transform: [{ scale: throb.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {guided && ahead !== start ? (
        <View style={[styles.abs, at(ahead, arrow), { transform: [{ rotate: `${angle}deg` }] }]}>
          <Animated.View
            style={[
              styles.arrow,
              {
                borderTopWidth: arrow / 2,
                borderBottomWidth: arrow / 2,
                borderLeftWidth: arrow,
                borderLeftColor: COLORS.ink,
              },
              throbStyle,
            ]}
          />
        </View>
      ) : null}
      <Animated.View
        style={[
          styles.start,
          at(start, dotSize),
          { borderRadius: dotSize / 2, backgroundColor: colors.deep },
          hop,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 0, height: 0, borderTopColor: 'transparent', borderBottomColor: 'transparent' },
  start: { position: 'absolute', borderWidth: OUTLINE.thin, borderColor: OUTLINE.color },
  ghost: { position: 'absolute', borderWidth: OUTLINE.thin, borderStyle: 'dashed' },
});
