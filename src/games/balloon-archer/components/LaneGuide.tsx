import { StyleSheet, View } from 'react-native';
import { GUIDE_COLOR } from '../constants';

type Props = { x: number; y: number; width: number };

// Dashed horizontal line showing where a loosed arrow will travel (the lane).
export function LaneGuide({ x, y, width }: Props) {
  const start = x + 24;
  const span = Math.max(0, width - start - 16);
  const count = Math.floor(span / 16);
  return (
    <View pointerEvents="none" style={[styles.root, { left: start, top: y - 1, width: span }]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.dash} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', height: 2, flexDirection: 'row', alignItems: 'center' },
  dash: { width: 8, height: 2, marginRight: 8, borderRadius: 1, backgroundColor: GUIDE_COLOR },
});
