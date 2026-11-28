import { StyleSheet, View } from 'react-native';
import { Garland } from '@/sdk/occasion/art/Garland';
import type { OccasionArt } from '@/sdk/occasion/art/ArtPiece';

type PopBackdropProps = {
  color: string;
  /** Stripe colour — a shade a little off the base. */
  stripe: string;
  /** Occasion string of lights hung across the top (Ramadan, Eid). */
  garland?: readonly OccasionArt[];
};

/**
 * Full-bleed colour with two diagonal "speed stripes" — the Pop Quest screen
 * background. Purely decorative and touch-transparent.
 */
export function PopBackdrop({ color, stripe, garland }: PopBackdropProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color, overflow: 'hidden' }]} pointerEvents="none">
      <View style={[styles.stripe, styles.wide, { backgroundColor: stripe }]} />
      <View style={[styles.stripe, styles.thin, { backgroundColor: stripe }]} />
      {garland ? <Garland items={garland} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: { position: 'absolute', top: -200, bottom: -200, transform: [{ rotate: '24deg' }] },
  wide: { start: '58%', width: 90 },
  thin: { start: '76%', width: 34 },
});
