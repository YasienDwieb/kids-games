import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, OUTLINE, POP, SHADOWS } from '../../constants';
import { levelInfo } from '../../sdk/quests/levels';
import { ProgressBar } from './ProgressBar';

type LevelPillProps = {
  stars: number;
  onPress?: () => void;
  compact?: boolean;
};

/** Grape level badge + XP bar toward the next level. */
export function LevelPill({ stars, onPress, compact = false }: LevelPillProps) {
  const { t } = useTranslation();
  const info = levelInfo(stars);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={t('home.levelA11y', { n: info.level, left: info.span - info.into })}
      style={({ pressed }) => [styles.pill, pressed ? styles.pressed : SHADOWS.sm]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{info.level}</Text>
      </View>
      <ProgressBar value={info.progress} height={14} style={compact ? styles.barCompact : styles.bar} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 50,
    paddingStart: 3,
    paddingEnd: 14,
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.grape,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: FONTS.display, fontSize: 19, color: COLORS.surface },
  bar: { width: 90 },
  barCompact: { width: 56 },
});
