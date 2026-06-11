import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  HudPill,
  PressableButton,
  SafeContainer,
  SHADOWS,
  SPACING,
  TOUCH_TARGET,
  hudTextStyle,
  useTranslation,
} from '@/sdk';
import { CARS, TRIMS } from '../constants';
import type { CarDef, GarageScreenProps, TrimDef } from '../types';

/* Width reserved at the header start so the SDK BackButton (64px circle,
   absolute top-start) never collides with the title. */
const BACK_CLEARANCE = TOUCH_TARGET.recommended + SPACING.sm;

export function GarageScreen({
  garage,
  onSelectCar,
  onUnlockCar,
  onSelectTrim,
  onDone,
}: GarageScreenProps) {
  const { t } = useTranslation();

  const trim: TrimDef = TRIMS.find((tr) => tr.id === garage.trim) ?? TRIMS[0];
  const selectedCar: CarDef =
    CARS.find((c) => c.id === garage.selected) ?? CARS[0];

  return (
    <SafeContainer backgroundColor={COLORS.canvas} style={styles.safe}>
      {/* Header — top-start corner left clear for the overlaid BackButton. */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.title} numberOfLines={1}>
          {t('turbo-road:garage.title')}
        </Text>
        <View
          style={[styles.headerSide, styles.headerEnd]}
          accessibilityLabel={t('turbo-road:a11y.coins')}
        >
          <HudPill>
            <Text style={hudTextStyle}>🪙 {garage.coins}</Text>
          </HudPill>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — selected car on its trim-tinted pedestal. */}
        <View style={styles.heroZone}>
          <View
            style={[
              styles.pedestal,
              { backgroundColor: trim.tint, borderColor: trim.base },
            ]}
          >
            <Text style={styles.heroEmoji}>{selectedCar.emoji}</Text>
          </View>

          {/* Trim swatches */}
          <View style={styles.trimRow}>
            <Text style={styles.trimLabel}>{t('turbo-road:garage.trim')}</Text>
            {TRIMS.map((tr) => {
              const isSelected = tr.id === garage.trim;
              return (
                <Pressable
                  key={tr.id}
                  onPress={() => onSelectTrim(tr.id)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={t(`turbo-road:trims.${tr.id}`)}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.swatchRing,
                    isSelected && styles.swatchRingSelected,
                  ]}
                >
                  <View
                    style={[styles.swatch, { backgroundColor: tr.base }]}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Collection grid — 2 columns of car cards. */}
        <View style={styles.grid}>
          {CARS.map((car) => {
            const isSelected = car.id === garage.selected;
            const isOwned = garage.owned.includes(car.id);
            const canAfford = garage.coins >= car.price;

            return (
              <View
                key={car.id}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                {!isOwned && (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockBadgeText}>🔒</Text>
                  </View>
                )}

                <Text
                  style={[styles.cardEmoji, !isOwned && styles.cardEmojiLocked]}
                >
                  {car.emoji}
                </Text>
                <Text
                  style={[styles.cardName, !isOwned && styles.cardNameLocked]}
                  numberOfLines={1}
                >
                  {t(`turbo-road:cars.${car.id}`)}
                </Text>

                {isSelected && (
                  <View style={styles.selectedChip}>
                    <Text style={styles.selectedChipText}>
                      {t('turbo-road:garage.selected')}
                    </Text>
                  </View>
                )}

                {isOwned && !isSelected && (
                  <PressableButton
                    label={t('turbo-road:garage.select')}
                    variant="ghost"
                    onPress={() => onSelectCar(car.id)}
                    style={styles.cardButton}
                    textStyle={styles.cardButtonText}
                  />
                )}

                {!isOwned && (
                  <>
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>🪙 {car.price}</Text>
                    </View>
                    <PressableButton
                      label={t('turbo-road:garage.unlock')}
                      accent="coral"
                      color={canAfford ? undefined : COLORS.disabled}
                      disabled={!canAfford}
                      onPress={() => onUnlockCar(car.id)}
                      style={styles.cardButton}
                      textStyle={
                        canAfford
                          ? styles.cardButtonText
                          : styles.unlockTextDisabled
                      }
                    />
                  </>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Done — pinned full-width CTA (safe-area handled by SafeContainer). */}
      <View style={styles.footer}>
        <PressableButton
          label={t('turbo-road:garage.done')}
          accent="coral"
          onPress={onDone}
        />
      </View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  safe: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.recommended,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  headerSide: {
    flex: 1,
    minWidth: BACK_CLEARANCE,
  },
  headerEnd: {
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.ink,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  heroZone: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  pedestal: {
    width: 190,
    height: 148,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  heroEmoji: {
    fontSize: 96,
    lineHeight: 112,
    textAlign: 'center',
  },
  trimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  trimLabel: {
    fontFamily: FONTS.bodyExtra,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.inkSoft,
  },
  swatchRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRingSelected: {
    borderColor: COLORS.ink,
    transform: [{ scale: 1.1 }],
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...SHADOWS.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING.md,
    marginTop: SPACING.lg,
  },
  card: {
    width: '48%',
    minHeight: TOUCH_TARGET.recommended * 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 3,
    borderColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  cardSelected: {
    borderColor: ACCENTS.coral.base,
  },
  lockBadge: {
    position: 'absolute',
    top: SPACING.sm,
    end: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgeText: {
    fontSize: 13,
  },
  cardEmoji: {
    fontSize: 52,
    lineHeight: 62,
  },
  cardEmojiLocked: {
    opacity: 0.4,
  },
  cardName: {
    fontFamily: FONTS.display,
    fontSize: 17,
    color: COLORS.ink,
    marginTop: SPACING.xs,
  },
  cardNameLocked: {
    color: COLORS.inkSoft,
  },
  selectedChip: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: ACCENTS.coral.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  selectedChipText: {
    fontFamily: FONTS.display,
    fontSize: 12,
    color: ACCENTS.coral.deep,
  },
  pricePill: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.line2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  pricePillText: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: COLORS.ink,
  },
  cardButton: {
    alignSelf: 'stretch',
    marginTop: SPACING.sm,
  },
  cardButtonText: {
    fontSize: 15,
  },
  unlockTextDisabled: {
    fontSize: 15,
    color: COLORS.inkFaint,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
});
