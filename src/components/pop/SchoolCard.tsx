import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS } from '../../constants';
import { EmojiImage } from '../common/EmojiImage';
import { bob, useLoop } from './motion';

type SchoolCardProps = {
  width: number;
  height: number;
  /** Shows the NEW flag (nothing played in School yet). */
  fresh?: boolean;
  onPress: () => void;
};

/** Home's School tile: a tall grape card next to the PLAY NOW card. */
export function SchoolCard({ width, height, fresh = false, onPress }: SchoolCardProps) {
  const { t } = useTranslation();
  const float = useLoop(1800);
  const icon = Math.round(Math.max(44, Math.min(84, height * 0.32)));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('school.home.a11y')}
      style={({ pressed }) => [styles.card, { width, height }, pressed ? styles.pressed : SHADOWS.lg]}
    >
      {fresh ? (
        <View style={styles.flag}>
          <Text style={styles.flagText}>{t('school.home.new')}</Text>
        </View>
      ) : null}
      <View style={styles.stage}>
        <Animated.View style={[styles.iconBox, { width: icon * 1.35, height: icon * 1.35 }, bob(float, 6)]}>
          <EmojiImage emoji="🎒" size={icon} />
        </Animated.View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {t('school.home.tile')}
      </Text>
      <Text style={styles.sub} numberOfLines={2}>
        {t('school.home.sub')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 26,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.grape,
    gap: 4,
  },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    borderRadius: 26,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.surface },
  sub: { fontFamily: FONTS.bodyExtra, fontSize: 13, color: COLORS.surface },
  flag: {
    position: 'absolute',
    top: -12,
    end: 14,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
    transform: [{ rotate: '6deg' }],
  },
  flagText: { fontFamily: FONTS.display, fontSize: 13, color: ACCENTS.purple.deep },
});
