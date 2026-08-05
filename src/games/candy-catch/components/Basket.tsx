import { StyleSheet, View } from 'react-native';
import { COLORS } from '@/sdk';
import { BASKET_HEIGHT, BASKET_WIDTH } from '../constants';

const WOOD = '#D89A5B';
const WOOD_DEEP = '#8A5A2E';
const WOOD_LIGHT = '#F0BC7E';

/** Glossy woven picnic basket, built from layered Views (no assets). */
export function Basket() {
  return (
    <View style={[styles.root, { width: BASKET_WIDTH, height: BASKET_HEIGHT }]}>
      {/* woven handle */}
      <View style={styles.handle} />
      {/* top rim (ellipse) */}
      <View style={styles.rim} />
      {/* woven body */}
      <View style={styles.body}>
        {/* horizontal weave bands */}
        <View style={styles.band} />
        <View style={[styles.band, styles.band2]} />
        {/* gloss */}
        <View style={styles.gloss} />
      </View>
      {/* dark opening */}
      <View style={styles.opening} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  handle: {
    position: 'absolute',
    left: BASKET_WIDTH / 2 - 30,
    top: -16,
    width: 60,
    height: 44,
    borderWidth: 8,
    borderBottomWidth: 0,
    borderColor: '#C88A48',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
  },
  rim: {
    position: 'absolute',
    left: 4,
    top: 8,
    width: BASKET_WIDTH - 8,
    height: 40,
    borderRadius: (BASKET_WIDTH - 8) / 2,
    backgroundColor: WOOD_LIGHT,
    borderWidth: 3,
    borderColor: WOOD_DEEP,
  },
  body: {
    position: 'absolute',
    left: 8,
    top: 30,
    width: BASKET_WIDTH - 16,
    height: 44,
    borderRadius: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: WOOD,
    borderWidth: 3,
    borderColor: WOOD_DEEP,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    height: 4,
    backgroundColor: 'rgba(138,90,46,0.35)',
  },
  band2: { top: 24, backgroundColor: 'rgba(255,255,255,0.18)' },
  gloss: {
    position: 'absolute',
    left: 10,
    top: 4,
    width: 40,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  opening: {
    position: 'absolute',
    left: 12,
    top: 18,
    width: BASKET_WIDTH - 24,
    height: 24,
    borderRadius: (BASKET_WIDTH - 24) / 2,
    backgroundColor: COLORS.ink,
  },
});
