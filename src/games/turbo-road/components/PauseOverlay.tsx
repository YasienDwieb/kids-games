import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONTS,
  PressableButton,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import type { PauseOverlayProps } from '../types';

// Pause overlay — scrim + a small card with resume/exit. Purely
// presentational; the race world is frozen by the engine while it shows.
export function PauseOverlay({ onResume, onExit }: PauseOverlayProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  return (
    <View style={styles.scrim} onStartShouldSetResponder={() => true}>
      <View style={[styles.card, landscape && styles.cardLandscape]}>
        <Text style={[styles.glyph, landscape && styles.glyphLandscape]}>⏸️</Text>
        <Text style={styles.title}>{t('turbo-road:pause.title')}</Text>
        <View style={[styles.buttons, landscape && styles.buttonsLandscape]}>
          <PressableButton
            label={t('turbo-road:pause.resume')}
            accent="coral"
            onPress={onResume}
            style={landscape ? styles.buttonHalf : undefined}
          />
          <PressableButton
            label={t('turbo-road:pause.exit')}
            variant="ghost"
            onPress={onExit}
            style={landscape ? styles.buttonHalf : undefined}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  // Landscape is short: trim the padding and lay the two CTAs side by side so
  // the card never grows taller than the screen.
  cardLandscape: {
    maxWidth: 460,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  glyph: { fontSize: 56, lineHeight: 64 },
  glyphLandscape: { fontSize: 40, lineHeight: 48 },
  title: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.ink,
  },
  buttons: { alignSelf: 'stretch', gap: SPACING.sm + SPACING.xs, marginTop: SPACING.sm },
  buttonsLandscape: { flexDirection: 'row', marginTop: 0 },
  buttonHalf: { flex: 1 },
});
