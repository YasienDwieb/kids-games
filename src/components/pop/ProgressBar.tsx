import { StyleSheet, View, type ViewStyle } from 'react-native';
import { COLORS, OUTLINE, POP } from '../../constants';

type ProgressBarProps = {
  /** 0..1 */
  value: number;
  color?: string;
  height?: number;
  track?: string;
  style?: ViewStyle;
};

/** Ink-outlined progress bar. Fills from the reading start. */
export function ProgressBar({ value, color = POP.splash, height = 16, track = '#EAF7FD', style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }, style]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  fill: { height: '100%' },
});
