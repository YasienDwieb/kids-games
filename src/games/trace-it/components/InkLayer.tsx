import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ACCENTS, type AccentName } from '@/sdk';
import { INK_WIDTH } from '../constants';
import type { Glyph, Pt, Stroke } from '../types';
import { Polyline, everyNth } from './TrackLayer';

type InkProps = { stroke: Stroke; scale: number; color: string };

function StrokeInk({ stroke, scale, color }: InkProps) {
  const width = INK_WIDTH * scale;
  if (stroke.kind === 'dot') {
    return (
      <View
        style={[
          styles.dot,
          {
            left: stroke.at[0] * scale - width / 2,
            top: stroke.at[1] * scale - width / 2,
            width,
            height: width,
            borderRadius: width / 2,
            backgroundColor: color,
          },
        ]}
      />
    );
  }
  return <Polyline points={everyNth(stroke.points, 2)} scale={scale} thickness={width} color={color} />;
}

type DoneProps = { glyph: Glyph; count: number; scale: number; color: string };

/** Finished strokes only change when a stroke completes. */
const DoneInk = memo(function DoneInk({ glyph, count, scale, color }: DoneProps) {
  return (
    <>
      {glyph.strokes.slice(0, count).map((s, i) => (
        <StrokeInk key={i} stroke={s} scale={scale} color={color} />
      ))}
    </>
  );
});

// The current stroke is drawn in fixed chunks of CHUNK resampled points (every
// 2nd point, so 2 * CHUNK raw points each). Finished chunks are memoized; only
// the tail re-renders as the finger moves.
const CHUNK = 8;
const CHUNK_SPAN = CHUNK * 2;

type ChunkProps = { points: readonly Pt[]; k: number; scale: number; color: string };

const InkChunk = memo(function InkChunk({ points, k, scale, color }: ChunkProps) {
  // One point of overlap with the next chunk keeps the line continuous.
  const pts = everyNth(points.slice(k * CHUNK_SPAN, (k + 1) * CHUNK_SPAN + 1), 2);
  return <Polyline points={pts} scale={scale} thickness={INK_WIDTH * scale} color={color} />;
});

type InkLayerProps = {
  glyph: Glyph;
  stroke: number;
  progress: number;
  done: boolean;
  scale: number;
  accent: AccentName;
};

/** The child's ink: finished strokes plus the current stroke up to `progress`. */
export function InkLayer({ glyph, stroke, progress, done, scale, accent }: InkLayerProps) {
  const color = ACCENTS[accent].base;
  const current = done ? null : glyph.strokes[stroke];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <DoneInk glyph={glyph} count={done ? glyph.strokes.length : stroke} scale={scale} color={color} />
      {current?.kind === 'path' && progress > 0 ? (
        <CurrentInk points={current.points} progress={progress} scale={scale} color={color} />
      ) : null}
    </View>
  );
}

function CurrentInk({ points, progress, scale, color }: { points: readonly Pt[]; progress: number; scale: number; color: string }) {
  const full = Math.floor(progress / CHUNK_SPAN);
  const tail = everyNth(points.slice(full * CHUNK_SPAN, progress + 1), 2);
  return (
    <>
      {Array.from({ length: full }, (_, k) => (
        <InkChunk key={k} points={points} k={k} scale={scale} color={color} />
      ))}
      {tail.length > 1 ? (
        <Polyline points={tail} scale={scale} thickness={INK_WIDTH * scale} color={color} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute' },
});
