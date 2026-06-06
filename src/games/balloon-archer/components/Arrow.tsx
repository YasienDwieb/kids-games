import { StyleSheet, View } from 'react-native';
import { ARROW_COLOR, PHYSICS } from '../constants';

type Props = { x: number; y: number; angle: number };

// (x, y) is the arrow tip; the shaft is drawn behind it along the flight angle.
export function Arrow({ x, y, angle }: Props) {
  const len = PHYSICS.arrowLength;
  const cx = x - (Math.cos(angle) * len) / 2;
  const cy = y - (Math.sin(angle) * len) / 2;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        { left: cx - len / 2, top: cy - 4, width: len, transform: [{ rotate: `${angle}rad` }] },
      ]}
    >
      <View style={styles.shaft} />
      <View style={styles.head} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', height: 8, flexDirection: 'row', alignItems: 'center' },
  shaft: { flex: 1, height: 4, borderRadius: 2, backgroundColor: ARROW_COLOR },
  head: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: ARROW_COLOR,
  },
});
