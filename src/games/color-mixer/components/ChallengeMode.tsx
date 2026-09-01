import { useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  COLORS as TOKENS,
  EmojiImage,
  FONTS,
  BORDER_RADIUS,
  IconButton,
  Star,
  useTranslation,
} from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { COLORS } from '../constants';
import { closeness } from '../utils';
import type { Challenge } from '../types';

type ChallengeModeProps = {
  currentChallenge: Challenge;
  currentMixHex: string | null;
  /** Live 0–3 score against the target, so progress is visible before finishing. */
  stars: number;
  /** Landscape packs the target, meter and hint into one short strip. */
  landscape: boolean;
  onBack: () => void;
};

/**
 * The challenge chrome above the mixing zone: what to make, how close you are, a hint.
 *
 * Landscape is a single ~76dp strip rather than the portrait column — the left panel is
 * only ~393dp tall on a phone, and the portrait stack (~230dp) pushed the mixing zone and
 * its action buttons off the bottom of the screen entirely.
 *
 * Success detection and the celebration live in the parent, so the overlay can cover the
 * whole game rather than just this strip.
 */
export function ChallengeMode({
  currentChallenge,
  currentMixHex,
  stars,
  landscape,
  onBack,
}: ChallengeModeProps) {
  const { t } = useTranslation();
  const [showHint, setShowHint] = useState(false);
  const targetHex = COLORS[currentChallenge.targetColor].hex;
  const meter = currentMixHex ? closeness(currentMixHex, targetHex) : 0;
  const targetName = t(`color-mixer:colors.${currentChallenge.targetColor}`);

  const meterLabel = (m: number): string => {
    if (m >= 1) return t('color-mixer:challenge.meter.perfect');
    if (m >= 0.85) return t('color-mixer:challenge.meter.soClose');
    if (m >= 0.6) return t('color-mixer:challenge.meter.gettingWarmer');
    return t('color-mixer:challenge.meter.keepMixing');
  };

  const backButton = (
    <IconButton
      glyph={I18nManager.isRTL ? '→' : '←'}
      onPress={onBack}
      accessibilityLabel={t('color-mixer:challenge.backLabel')}
      size={40}
      glyphSize={18}
    />
  );

  const hintControl = currentChallenge.hint ? (
    showHint ? (
      <View style={styles.hintBox}>
        <EmojiImage emoji="💡" size={16} />
        <Text style={styles.hintText} numberOfLines={landscape ? 2 : undefined}>
          {t(`color-mixer:challengeHints.${currentChallenge.id}`)}
        </Text>
      </View>
    ) : (
      <Pressable
        onPress={() => setShowHint(true)}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.hintButton}
      >
        <EmojiImage emoji="💡" size={16} />
        <Text style={styles.hintButtonText}>{t('color-mixer:challenge.needHint')}</Text>
      </Pressable>
    )
  ) : null;

  const meterBlock = currentMixHex ? (
    <View style={landscape ? styles.meterAreaLandscape : styles.meterArea}>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.round(meter * 100)}%` }]} />
      </View>
      <View style={styles.meterFooter}>
        <View style={styles.starRow}>
          {[1, 2, 3].map((n) => (
            <Star key={n} size={14} filled={n <= stars} />
          ))}
        </View>
        <Text style={styles.meterLabel} numberOfLines={1}>
          {meterLabel(meter)}
        </Text>
      </View>
    </View>
  ) : null;

  if (landscape) {
    return (
      <View style={styles.strip}>
        {backButton}
        <ColorBlob color={targetHex} size={44} showShine pulsing />
        <View style={styles.stripLabels}>
          <Text style={styles.stripPrompt} numberOfLines={1}>
            {t('color-mixer:challenge.makeThisColor')}
          </Text>
          <Text style={styles.stripName} numberOfLines={1}>
            {targetName}
          </Text>
        </View>
        {meterBlock}
        {hintControl}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>{backButton}</View>

      <View style={styles.targetArea}>
        <Text style={styles.prompt}>{t('color-mixer:challenge.makeThisColor')}</Text>
        <View style={styles.targetBlob}>
          <ColorBlob color={targetHex} size={80} showShine pulsing />
        </View>
        <Text style={styles.targetName}>{targetName}</Text>
      </View>

      {hintControl}
      {meterBlock}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Landscape strip ──
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  stripLabels: {
    flexShrink: 1,
  },
  stripPrompt: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: TOKENS.inkSoft,
  },
  stripName: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: TOKENS.ink,
  },

  // ── Portrait column ──
  container: {
    alignItems: 'center',
    paddingTop: 8,
  },
  header: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  targetArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  prompt: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: TOKENS.inkSoft,
    marginBottom: 12,
  },
  targetBlob: {
    marginBottom: 8,
  },
  targetName: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: TOKENS.ink,
  },

  // ── Shared ──
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  hintButtonText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: TOKENS.inkSoft,
  },
  hintBox: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: TOKENS.surface2,
    borderRadius: BORDER_RADIUS.soft,
  },
  hintText: {
    flexShrink: 1,
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: TOKENS.inkSoft,
  },
  meterArea: {
    width: '70%',
    alignItems: 'center',
  },
  meterAreaLandscape: {
    flex: 1,
    minWidth: 80,
  },
  meterTrack: {
    width: '100%',
    height: 10,
    backgroundColor: TOKENS.line2,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: TOKENS.brand,
    borderRadius: BORDER_RADIUS.pill,
  },
  meterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  starRow: {
    flexDirection: 'row',
    gap: 1,
  },
  meterLabel: {
    flexShrink: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: TOKENS.inkSoft,
  },
});
