import { StyleSheet, View } from 'react-native';
import { ACCENTS, BORDER_RADIUS, COLORS, Icon, OUTLINE, PressableButton, SHADOWS, SPACING, useTranslation } from '@/sdk';
import type { PauseOverlayProps } from '../types';

// Pause — keep driving, or back to the map. Pictures only; the race world is
// frozen by the engine while it shows.
export function PauseOverlay({ onResume, onExit }: PauseOverlayProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.scrim} onStartShouldSetResponder={() => true}>
      <View style={[styles.card, SHADOWS.lg]}>
        <PressableButton accessibilityLabel={t('turbo-road:a11y.exit')} variant="ghost" onPress={onExit}>
          <View style={styles.face}>
            <Icon name="map" size={34} />
          </View>
        </PressableButton>
        <PressableButton accessibilityLabel={t('turbo-road:a11y.resume')} color={ACCENTS.green.base} onPress={onResume}>
          <View style={styles.face}>
            <Icon name="play" size={40} />
          </View>
        </PressableButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  face: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
});
