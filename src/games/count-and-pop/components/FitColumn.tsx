/**
 * FitColumn — distributes a sub-mode's sections across the available height and
 * scales the whole unit down only when they can't all fit.
 *
 * Behaviour:
 *  - There's room → the inner column is stretched to the available height
 *    (minHeight) and uses `space-evenly`, so prompt / visual / choices are
 *    spread out with balanced gaps (no big void under the title, bottom row not
 *    jammed against the edge).
 *  - It's too tall → the natural content exceeds the available height, so a
 *    single uniform `scale` transform shrinks the whole unit to fit. Ratio is
 *    preserved and nothing clips.
 *
 * A small vertical padding keeps a consistent margin top and bottom in BOTH
 * cases, so the bottom row never touches the screen edge.
 *
 * Why a transform: RN transforms don't affect layout, so the content's onLayout
 * always reports its real (unscaled) height — no measure/scale feedback loop.
 * Device-agnostic: it reads the real area, no per-device pixel budgets.
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
  /** Style for the inner (measured, distributed, scaled) content column. */
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
        style={[
          styles.content,
          contentStyle,
          // minHeight stretches the column to the usable height when content is
          // short (so space-evenly has room to distribute); when content is
          // taller it grows past this and `scale` shrinks it.
          { minHeight: avail, transform: [{ scale }] },
        ]}
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
    justifyContent: 'space-evenly',
  },
});
