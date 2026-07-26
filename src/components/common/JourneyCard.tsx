import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ACCENTS, COLORS, FONTS, SHADOWS, BORDER_RADIUS, type AccentName } from '../../constants';
import { useTranslation } from 'react-i18next';
import { EmojiFrame } from './EmojiFrame';
import { PressableButton } from './PressableButton';

type JourneyCardProps = {
  total: number;
  savedStep: number;
  nextIcon?: string;
  nextName?: string;
  nextAccent?: AccentName;
  onContinue: () => void;
  onStartOver: () => void;
  onSetup: () => void;
  // Portrait: a shorter horizontal layout instead of the full-height column.
  compact?: boolean;
  style?: ViewStyle;
};

// The home "journey" surface: a persistent card that shows the guided journey's
// next step + progress, sitting beside the free-play games. Three states:
// empty (no games picked) · active (in progress) · done (all caught up).
export function JourneyCard({
  total,
  savedStep,
  nextIcon,
  nextName,
  nextAccent = 'purple',
  onContinue,
  onStartOver,
  onSetup,
  compact = false,
  style,
}: JourneyCardProps) {
  const { t } = useTranslation();
  const accent = ACCENTS[nextAccent];

  // --- Empty: prompt to set up a journey in Settings ---
  if (total === 0) {
    return (
      <Pressable
        onPress={onSetup}
        accessibilityRole="button"
        accessibilityLabel={t('flow.empty')}
        style={({ pressed }) => [
          styles.card,
          compact && styles.cardCompact,
          SHADOWS.md,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={styles.emptyBody}>
          <Text style={styles.emptyPlus}>＋</Text>
          <Text style={styles.emptyText}>{t('flow.empty')}</Text>
        </View>
      </Pressable>
    );
  }

  const done = savedStep >= total;
  const pct = Math.max(0, Math.min(1, total > 0 ? savedStep / total : 0));

  // --- Done: celebrate + offer a restart ---
  if (done) {
    return (
      <View style={[styles.card, compact && styles.cardCompact, SHADOWS.md, style]}>
        <View style={styles.doneBody}>
          <Text style={styles.doneEmoji}>🌟</Text>
          <Text style={styles.doneText}>{t('flow.allCaughtUp')}</Text>
        </View>
        <PressableButton
          label={t('flow.startOver')}
          accent="purple"
          onPress={onStartOver}
          style={styles.cta}
        />
      </View>
    );
  }

  // --- Active: next-up game + progress + continue ---
  // Bar only, no "14/80" fraction: a step count is a parent metric that means
  // nothing to a pre-reader. The filled bar carries the same signal wordlessly.
  const progress = (
    <View style={styles.progressWrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );

  const cta = (
    <PressableButton
      label={savedStep > 0 ? t('flow.continueShort') : t('flow.startShort')}
      accent="purple"
      onPress={onContinue}
      style={styles.cta}
    />
  );

  if (compact) {
    return (
      <View style={[styles.card, styles.cardCompact, SHADOWS.md, style]}>
        <View style={styles.compactRow}>
          {nextIcon ? (
            <EmojiFrame emoji={nextIcon} tint={accent.tint} size={56} fontSize={30} />
          ) : null}
          <View style={styles.compactMid}>
            {nextName ? (
              <Text style={styles.upNextName} numberOfLines={1}>
                {nextName}
              </Text>
            ) : null}
            {progress}
          </View>
          <View style={styles.compactCta}>{cta}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, SHADOWS.md, style]}>
      {/* Flexible middle: centers when it fits and scrolls when it doesn't, so the
          CTA never gets pushed off — and nothing is clipped on short screens or in
          Arabic, whose text runs taller than Latin. */}
      <ScrollView
        style={styles.middle}
        contentContainerStyle={styles.middleContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emoji beside the text (not stacked) so the card stays height-deterministic
            in both English and the taller-lined Arabic. Sized up from the compact
            variant: with the kicker, step count and game strip gone, the next-up
            game is the card's only subject. */}
        <View style={styles.hero}>
          {nextIcon ? (
            <EmojiFrame emoji={nextIcon} tint={accent.tint} size={72} fontSize={40} />
          ) : null}
          <View style={styles.heroText}>
            <Text style={styles.upNextLabel}>{t('flow.upNext')}</Text>
            {nextName ? (
              <Text style={styles.upNextName} numberOfLines={2}>
                {nextName}
              </Text>
            ) : null}
          </View>
        </View>
        {progress}
      </ScrollView>
      {cta}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.tile,
    padding: 16,
    gap: 12,
  },
  // Portrait: don't stretch to fill height; size to content.
  cardCompact: { flex: 0, padding: 14, gap: 10 },
  pressed: { transform: [{ scale: 0.98 }] },

  // Flexible, height-bounded middle (active, full): keeps the CTA pinned on short
  // landscape screens. Scrolls (never clips) if content is taller than the space —
  // e.g. Arabic, whose line metrics run taller than Latin.
  middle: { flex: 1 },
  middleContent: { flexGrow: 1, justifyContent: 'center', gap: 12 },

  // hero (active, full): emoji + text side by side
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroText: { flex: 1, gap: 2 },
  upNextLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkSoft,
  },
  upNextName: {
    fontFamily: FONTS.display,
    fontSize: 22,
    color: COLORS.ink,
  },

  // progress
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 6,
    backgroundColor: COLORS.brandTint,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: COLORS.brand },

  // CTA spans the card width; the flexible middle above keeps it pinned low.
  cta: { alignSelf: 'stretch' },

  // empty state
  emptyBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyPlus: { fontFamily: FONTS.display, fontSize: 34, color: COLORS.brand },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },

  // done state
  doneBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  doneEmoji: { fontSize: 44 },
  doneText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
    textAlign: 'center',
  },

  // compact (portrait)
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compactMid: { flex: 1, gap: 6 },
  compactCta: { width: 120 },
});
