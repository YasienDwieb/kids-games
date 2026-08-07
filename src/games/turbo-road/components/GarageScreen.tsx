import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
import { CARS, STAT_RANGE, THEME_ORDER, TRIMS } from '../constants';
import type { CarDef, GarageScreenProps, TrimDef } from '../types';

/* Width reserved at the header start so the SDK BackButton (64px circle,
   absolute top-start) never collides with the title. */
const BACK_CLEARANCE = TOUCH_TARGET.recommended + SPACING.sm;
/* Same clearance as a leading padding: the button sits SPACING.md in from the
   safe-area edge, so the title has to start past its far side. */
const BACK_PADDING = SPACING.md + BACK_CLEARANCE;

/** Map a car stat (≈0.9–1.15) onto a 0..1 bar fill. */
const statFill = (v: number): number =>
  Math.min(1, Math.max(0.08, (v - STAT_RANGE.min) / (STAT_RANGE.max - STAT_RANGE.min)));

/* Tiny labeled stat bar (Speed / Grip) for a car card. */
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.statTrack}>
        <View
          style={[styles.statFill, { width: `${statFill(value) * 100}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

export function GarageScreen({
  garage,
  trophies,
  onSelectCar,
  onUnlockCar,
  onSelectTrim,
  onDone,
}: GarageScreenProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const trim: TrimDef = TRIMS.find((tr) => tr.id === garage.trim) ?? TRIMS[0];
  const selectedCar: CarDef =
    CARS.find((c) => c.id === garage.selected) ?? CARS[0];

  /* Hero — selected car on its trim-tinted pedestal + the trim swatches. */
  const hero = (
    <View style={styles.heroZone}>
      <View
        style={[
          styles.pedestal,
          landscape && styles.pedestalLandscape,
          { backgroundColor: trim.tint, borderColor: trim.base },
        ]}
      >
        <Text style={[styles.heroEmoji, landscape && styles.heroEmojiLandscape]}>
          {selectedCar.emoji}
        </Text>
      </View>

      <View style={[styles.trimRow, landscape && styles.trimRowLandscape]}>
        {/* Landscape stacks the label above the swatches — the pane is too
            narrow to hold both on one line without clipping. */}
        <Text style={[styles.trimLabel, landscape && styles.trimLabelLandscape]}>
          {t('turbo-road:garage.trim')}
        </Text>
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
              style={[styles.swatchRing, isSelected && styles.swatchRingSelected]}
            >
              <View style={[styles.swatch, { backgroundColor: tr.base }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  /* Trophy shelf — one cup per completed 4-level tour. */
  const trophyShelf = (
    <View style={[styles.trophyShelf, landscape && styles.trophyShelfLandscape]}>
      <Text style={styles.trophyTitle}>{t('turbo-road:garage.trophies')}</Text>
      {trophies === 0 ? (
        <Text style={styles.trophyEmpty}>{t('turbo-road:garage.noTrophies')}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.trophyRow}>
            {Array.from({ length: trophies }, (_, i) => (
              <View key={i} style={styles.trophyItem}>
                <Text style={styles.trophyEmoji}>🏆</Text>
                <Text style={styles.trophyName} numberOfLines={1}>
                  {t(`turbo-road:cups.${THEME_ORDER[i % THEME_ORDER.length]}`)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  /* Collection grid — 2 car cards per row in portrait, 3 in landscape. */
  const grid = (
    <View style={[styles.grid, landscape && styles.gridLandscape]}>
      {CARS.map((car) => {
        const isSelected = car.id === garage.selected;
        const isOwned = garage.owned.includes(car.id);
        const canAfford = garage.coins >= car.price;

        return (
          <View
            key={car.id}
            style={[
              styles.card,
              landscape && styles.cardLandscape,
              isSelected && styles.cardSelected,
            ]}
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

                {/* Personality stats — what makes this car worth unlocking. */}
                <View style={styles.statsBlock}>
                  <StatBar
                    label={t('turbo-road:garage.stats.speed')}
                    value={car.stats.speed}
                    color={ACCENTS.coral.base}
                  />
                  <StatBar
                    label={t('turbo-road:garage.stats.grip')}
                    value={car.stats.grip}
                    color={COLORS.gold}
                  />
                </View>

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
  );

  const doneButton = (
    <PressableButton
      label={t('turbo-road:garage.done')}
      accent="coral"
      onPress={onDone}
    />
  );

  const coinsPill = (
    <View accessibilityLabel={t('turbo-road:a11y.coins')}>
      <HudPill>
        <Text style={hudTextStyle}>🪙 {garage.coins}</Text>
      </HudPill>
    </View>
  );

  /* Landscape: the car you drive and the CTA stay put on one side while the
     collection scrolls beside them — otherwise the grid is entirely below the
     fold on a short screen. */
  if (landscape) {
    return (
      <SafeContainer backgroundColor={COLORS.canvas} style={styles.safe}>
        <View style={styles.headerLandscape}>
          <Text style={styles.titleLandscape} numberOfLines={1}>
            {t('turbo-road:garage.title')}
          </Text>
          {coinsPill}
        </View>

        <View style={styles.panes}>
          <View style={styles.heroPane}>
            {hero}
            {doneButton}
          </View>

          <View style={styles.collectionPane}>
            {trophyShelf}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContentLandscape}
              showsVerticalScrollIndicator={false}
            >
              {grid}
            </ScrollView>
          </View>
        </View>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer backgroundColor={COLORS.canvas} style={styles.safe}>
      {/* Header — top-start corner left clear for the overlaid BackButton. */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.title} numberOfLines={1}>
          {t('turbo-road:garage.title')}
        </Text>
        <View style={[styles.headerSide, styles.headerEnd]}>{coinsPill}</View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hero}
        {trophyShelf}
        {grid}
      </ScrollView>

      {/* Done — pinned full-width CTA (safe-area handled by SafeContainer). */}
      <View style={styles.footer}>{doneButton}</View>
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

  /* ---------------- landscape two-pane ---------------- */
  headerLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    // Clears the overlaid BackButton in the start corner.
    paddingStart: BACK_PADDING,
    gap: SPACING.sm,
  },
  titleLandscape: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.ink,
  },
  panes: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  heroPane: {
    width: 210,
    justifyContent: 'space-evenly',
  },
  collectionPane: {
    flex: 1,
    gap: SPACING.sm,
  },
  scrollContentLandscape: {
    paddingBottom: SPACING.sm,
  },
  pedestalLandscape: {
    width: 176,
    height: 104,
    alignSelf: 'center',
  },
  heroEmojiLandscape: {
    fontSize: 62,
    lineHeight: 74,
  },
  trophyShelfLandscape: {
    marginTop: 0,
  },
  gridLandscape: {
    marginTop: 0,
    columnGap: SPACING.sm,
    rowGap: SPACING.sm,
    justifyContent: 'flex-start',
  },
  cardLandscape: {
    // 3 per row: (100% - 2 gaps) / 3, expressed as a percentage that leaves
    // room for the two SPACING.sm column gaps.
    width: '31.8%',
    minHeight: 0,
    paddingVertical: SPACING.sm,
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
  trimRowLandscape: {
    alignSelf: 'stretch',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  trimLabel: {
    fontFamily: FONTS.bodyExtra,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.inkSoft,
  },
  // Full width so the four swatches wrap onto their own line beneath it.
  trimLabelLandscape: {
    width: '100%',
    textAlign: 'center',
    marginBottom: SPACING.xs,
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
  trophyShelf: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.surface2,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  trophyTitle: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: COLORS.inkSoft,
  },
  trophyEmpty: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkFaint,
  },
  trophyRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  trophyItem: {
    alignItems: 'center',
    width: 72,
  },
  trophyEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  trophyName: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    color: COLORS.inkSoft,
  },
  statsBlock: {
    alignSelf: 'stretch',
    gap: 3,
    marginTop: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statLabel: {
    width: 52,
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    color: COLORS.inkSoft,
  },
  statTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.line,
    overflow: 'hidden',
  },
  statFill: {
    height: 5,
    borderRadius: 3,
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
