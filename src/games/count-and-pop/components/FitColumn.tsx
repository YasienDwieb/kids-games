/**
 * FitColumn — fits its content to the available height on any device.
 *
 * Problem it solves: in landscape the game's content area is short, and a
 * sub-mode's prompt + visual + choice row can be taller than that area, so the
 * bottom (the answer row) clips off-screen. Per-device pixel budgets are
 * brittle; this measures the REAL available height and the content's natural
 * height, then applies a single uniform `scale` transform so the whole unit
 * shrinks to fit — preserving every component's aspect ratio and keeping the
 * layout identical, just smaller. On tall-enough screens scale stays 1 (no-op).
 *
 * Why a transform: RN transforms don't affect layout, so the content's
 * onLayout always reports its natural (unscaled) height — no measure/scale
 * feedback loop. The outer view reports the available height. Content is
 * vertically centered, so the scaled unit sits centered with no clipping.
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type FitColumnProps = {
  children: React.ReactNode;
  /** Style for the inner (measured, scaled) content column. */
  contentStyle?: StyleProp<ViewStyle>;
};

export function FitColumn({ children, contentStyle }: FitColumnProps): React.JSX.Element {
  const [avail, setAvail] = useState(0);
  const [content, setContent] = useState(0);

  // Only ever scale DOWN; never enlarge past the natural size.
  const scale = avail > 0 && content > avail ? avail / content : 1;

  const onAvail = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setAvail((p) => (Math.abs(p - h) < 0.5 ? p : h));
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
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
});
