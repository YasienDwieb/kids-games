/**
 * FitColumn — fits a sub-mode's content to the available height on any device.
 *
 * It measures the REAL available height and the content's NATURAL height, then
 * applies a single uniform `scale` transform so the whole unit shrinks to fit
 * when it's too tall. Ratio is preserved and nothing clips. When the content
 * already fits, scale stays 1 and it's centered with a small top/bottom margin.
 *
 * Deliberately does NOT force the column to a measured height (no minHeight):
 * forcing a height is fragile when the available-height measurement isn't
 * pixel-perfect (system bars / insets on a real device) and can push the bottom
 * row off-screen. Measuring the content's natural height and scaling it is
 * robust — the content never claims more room than it actually needs.
 *
 * Why a transform: RN transforms don't affect layout, so the content's onLayout
 * always reports its real (unscaled) height — no measure/scale feedback loop.
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SPACING } from '@/sdk';

// Margin kept above and below the unit so the bottom row never touches the edge.
const PAD = SPACING.sm;

type FitColumnProps = {
  children: React.ReactNode;
  /** Style for the inner (measured, scaled) content column. */
  contentStyle?: StyleProp<ViewStyle>;
};

export function FitColumn({ children, contentStyle }: FitColumnProps): React.JSX.Element {
  const [availRaw, setAvailRaw] = useState(0);
  const [content, setContent] = useState(0);

  // Usable height after the top/bottom margin.
  const avail = Math.max(0, availRaw - PAD * 2);
  // Only ever scale DOWN, and only when the content can't fit the usable height.
  const scale = avail > 0 && content > avail ? avail / content : 1;

  const onAvail = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setAvailRaw((p) => (Math.abs(p - h) < 0.5 ? p : h));
  };
  const onContent = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setContent((p) => (Math.abs(p - h) < 0.5 ? p : h));
  };

  return (
    <View style={styles.fill} onLayout={onAvail}>
      <View
        style={[styles.content, contentStyle, { transform: [{ scale }] }]}
        onLayout={onContent}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PAD,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
});
