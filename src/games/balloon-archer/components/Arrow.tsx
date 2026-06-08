import { I18nManager, StyleSheet, View } from 'react-native';
import { ARROW_COLOR, PHYSICS } from '../constants';

type Props = { x: number; y: number; angle: number };

// Under RTL the playfield is mirrored, so the arrow visually flies right→left.
// The arrow is drawn as [shaft][►head] in a row; RTL auto-mirrors the row order
// but NOT the border-triangle head, leaving it pointing backward. Mirror the
// whole arrow with scaleX:-1 (outermost transform) so head + flight align. World
// coordinates/physics are unchanged — this only flips the rendered glyph facing.
const ARROW_FLIP = I18nManager.isRTL ? -1 : 1;

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
        {
          left: cx - len / 2,
          top: cy - 4,
          width: len,
          transform: [{ scaleX: ARROW_FLIP }, { rotate: `${angle}rad` }],
        },
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
