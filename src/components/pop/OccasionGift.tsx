import { useEffect, useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sunburst } from './Sunburst';
import { ACCENTS, COLORS, POP } from '@/constants/colors';
import { BORDER_RADIUS, OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import type { OccasionId } from '@/sdk/content/types';
import { BuddyFigure } from '@/sdk/mascot/BuddyFigure';
import { ArtPiece } from '@/sdk/occasion/art/ArtPiece';
import type { OccasionTheme } from '@/sdk/occasion/themes';

/** How long the card stays up before it closes by itself. */
const CARD_MS = 4500;

/**
 * The occasion's gift, shown on Home the first time the child opens the app
 * during the occasion each year: the buddy cheering beside the companion (a
 * fanoos in Ramadan), which then stands beside the buddy for the rest of it.
 * Closes by itself or on a tap.
 */
export function OccasionGift({
  occasion,
  companion,
  onClose,
}: {
  occasion: OccasionId;
  companion: OccasionTheme['companion'];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const enter = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    const timer = setTimeout(onClose, CARD_MS);
    return () => clearTimeout(timer);
  }, [enter, onClose]);

  const label = t('occasion.gift', {
    occasion: t(`occasion.names.${occasion}`),
    item: t(`occasion.companions.${companion.id}`),
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: enter }]}>
      <View style={styles.burst} pointerEvents="none">
        <Sunburst color={ACCENTS.purple.base} size={1400} />
      </View>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={label}
      />
      <View style={styles.middle} pointerEvents="none">
        <BuddyFigure size={180} mood="cheer" companion={false} />
        <Animated.View
          style={[
            styles.card,
            SHADOWS.md,
            { transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
          ]}
        >
          <ArtPiece art={companion.art} size={120} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: POP.grape,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 50,
  },
  burst: { position: 'absolute', top: '50%', left: '50%', marginTop: -700, marginLeft: -700 },
  middle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  card: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
});
