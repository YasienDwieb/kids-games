import { StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { EmojiImage } from '@/components/common/EmojiImage';
import type { DecorSpot, HomeDecor } from '@/sdk/occasion/themes';

type PopBackdropProps = {
  color: string;
  /** Stripe colour — a shade a little off the base. */
  stripe: string;
  /** Occasion pictures laid over the stripes (start/end follow RTL). */
  decor?: readonly HomeDecor[];
};

const INSET = 12;
const SPOTS: Record<DecorSpot, ViewStyle> = {
  'top-start': { top: INSET, start: INSET },
  'top-end': { top: INSET, end: INSET },
  'bottom-start': { bottom: INSET, start: INSET },
  'bottom-end': { bottom: INSET, end: INSET },
};

/**
 * Full-bleed colour with two diagonal "speed stripes" — the Pop Quest screen
 * background. Purely decorative and touch-transparent.
 */
export function PopBackdrop({ color, stripe, decor }: PopBackdropProps) {
  const { width, height } = useWindowDimensions();
  const short = Math.min(width, height);
  // Two pictures can share a spot; the second steps inward so they don't stack.
  const used = new Map<DecorSpot, number>();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color, overflow: 'hidden' }]} pointerEvents="none">
      <View style={[styles.stripe, styles.wide, { backgroundColor: stripe }]} />
      <View style={[styles.stripe, styles.thin, { backgroundColor: stripe }]} />
      {decor?.map((d, i) => {
        const size = Math.round(short * d.size);
        const n = used.get(d.spot) ?? 0;
        used.set(d.spot, n + 1);
        const shift = n * (size + INSET);
        const base = SPOTS[d.spot];
        const pos: ViewStyle = {
          ...base,
          ...(base.start !== undefined ? { start: INSET + shift } : null),
          ...(base.end !== undefined ? { end: INSET + shift } : null),
        };
        return (
          <View key={`${d.emoji}-${i}`} style={[styles.decor, pos]} testID="occasion-decor">
            <EmojiImage emoji={d.emoji} size={size} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: { position: 'absolute', top: -200, bottom: -200, transform: [{ rotate: '24deg' }] },
  wide: { start: '58%', width: 90 },
  thin: { start: '76%', width: 34 },
  decor: { position: 'absolute', opacity: 0.9 },
});
