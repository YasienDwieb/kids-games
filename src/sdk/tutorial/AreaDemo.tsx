import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DemoHand, type DemoPoint } from './DemoHand';

/**
 * DemoHand that sizes itself to its parent: taps a spot (`at`, as fractions of
 * the parent; the centre by default), or sweeps side to side along the bottom.
 * Drop it inside whatever it should point at.
 */
export function AreaDemo({
  mode = 'tap',
  at = { x: 0.5, y: 0.5 },
}: {
  mode?: 'tap' | 'sweep';
  at?: DemoPoint;
}) {
  const [points, setPoints] = useState<DemoPoint[]>([]);
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setPoints(
          mode === 'tap'
            ? [{ x: w * at.x, y: h * at.y }]
            : [
                { x: w * 0.3, y: h * 0.85 },
                { x: w * 0.7, y: h * 0.85 },
              ],
        );
      }}
    >
      {points.length > 0 ? <DemoHand mode={mode === 'tap' ? 'tap' : 'drag'} points={points} /> : null}
    </View>
  );
}
