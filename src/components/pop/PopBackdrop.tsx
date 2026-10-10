import { StyleSheet, View } from 'react-native';

type PopBackdropProps = {
  color: string;
  /** Stripe colour — a shade a little off the base. */
  stripe: string;
};

/**
 * Full-bleed colour with two diagonal "speed stripes" — the Pop Quest screen
 * background. Purely decorative and touch-transparent.
 */
export function PopBackdrop({ color, stripe }: PopBackdropProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color, overflow: 'hidden' }]} pointerEvents="none">
      <View style={[styles.stripe, styles.wide, { backgroundColor: stripe }]} />
      <View style={[styles.stripe, styles.thin, { backgroundColor: stripe }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: { position: 'absolute', top: -200, bottom: -200, transform: [{ rotate: '24deg' }] },
  wide: { start: '58%', width: 90 },
  thin: { start: '76%', width: 34 },
});
