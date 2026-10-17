import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ACCENTS, type AccentName } from '@/sdk';
import { INK_WIDTH } from '../constants';
import type { Glyph, Stroke } from '../types';
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
        <Polyline
          points={everyNth(current.points.slice(0, progress + 1), 2)}
          scale={scale}
          thickness={INK_WIDTH * scale}
          color={color}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute' },
});
