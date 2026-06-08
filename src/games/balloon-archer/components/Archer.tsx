import { I18nManager, StyleSheet, Text, View } from 'react-native';

type Props = { x: number; y: number; drawing: boolean };

// The 🏹 glyph is drawn aiming up-right (~45°); rotate it so the whole bow
// points horizontally right — the direction the arrow actually flies.
const BOW_AIM_ROTATION = '45deg';

// Under RTL the playfield is mirrored, so the archer sits on the visual right
// and arrows visually travel right→left. Flip the bow horizontally so it points
// toward the balloons (visual-left) instead of off the screen edge. The
// underlying physics/coordinates are unchanged — this is purely the glyph's
// facing direction.
const BOW_FLIP = I18nManager.isRTL ? -1 : 1;

// The bow sits at the current lane height and pops slightly when drawn.
export function Archer({ x, y, drawing }: Props) {
  const size = 60;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        { left: x - size / 2, top: y - size / 2, width: size, height: size },
        {
          transform: [
            { scaleX: BOW_FLIP },
            { rotate: BOW_AIM_ROTATION },
            { scale: drawing ? 1.12 : 1 },
          ],
        },
      ]}
    >
      <Text style={styles.bow}>🏹</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bow: { fontSize: 46 },
});
