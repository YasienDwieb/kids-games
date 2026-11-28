import { useEffect, useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmojiImage } from '@/components/common/EmojiImage';
import { Icon } from '@/components/common/Icon';
import { PressableButton } from '@/components/common/PressableButton';
import { Sunburst } from './Sunburst';
import { ACCENTS, COLORS, POP } from '@/constants/colors';
import { BORDER_RADIUS, OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import type { OccasionId } from '@/sdk/content/types';
import { BuddyFigure } from '@/sdk/mascot/BuddyFigure';
import { outfitById } from '@/sdk/player/outfits';
import { wear } from '@/sdk/player/outfitStore';

/** How long the card stays up before it closes by itself. */
const CARD_MS = 4500;

/**
 * The occasion's wardrobe gift, shown once on Home the first time the child
 * opens the app during the occasion: buddy cheering, the item, a try-it-on
 * button. Closes by itself; the item stays in the wardrobe either way.
 */
export function OccasionGift({
  occasion,
  outfit,
  onClose,
  onTryOn,
}: {
  occasion: OccasionId;
  outfit: string;
  onClose: () => void;
  /** After wearing it, e.g. open the wardrobe. */
  onTryOn?: () => void;
}) {
  const { t } = useTranslation();
  const enter = useMemo(() => new Animated.Value(0), []);
  const item = outfitById(outfit);

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
    const timer = setTimeout(onClose, CARD_MS);
    return () => clearTimeout(timer);
  }, [enter, onClose]);

  if (!item) return null;
  const label = t('occasion.gift', {
    occasion: t(`occasion.names.${occasion}`),
    item: t(`wardrobe.items.${item.id}`),
  });

  const tryOn = () => {
    void wear(item.slot, item.id);
    onClose();
    onTryOn?.();
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: enter }]}>
      <View style={styles.burst} pointerEvents="none">
        <Sunburst color={ACCENTS.purple.base} size={1400} />
      </View>
      {/* Tapping anywhere else closes it early. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} />
      <View style={styles.middle}>
        <BuddyFigure size={180} mood="cheer" />
        <View style={[styles.card, SHADOWS.md]} accessible accessibilityLabel={label}>
          <EmojiImage emoji={item.emoji} size={64} />
        </View>
      </View>
      <PressableButton accessibilityLabel={t('occasion.tryOn')} color={ACCENTS.green.base} onPress={tryOn}>
        <Icon name="shirt" size={30} />
      </PressableButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: POP.grape,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
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
