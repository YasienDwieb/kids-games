/**
 * HearName — the "listen to the animal's NAME, then tap the matching animal" round.
 *
 * Mirrors letter-land's HearAndFind layout, but the choices are animal EMOJI
 * tiles instead of letter glyphs:
 *   ┌──────────────────────────────┐
 *   │ LISTEN… label                │
 *   │ ◉ big hero speaker (IconButton)  ← onPress = onReplay → host speaks NAME
 *   │ Tap to hear it again         │
 *   │ Which animal is it?          │  ← instruction
 *   │ [ 🦁 ] [ 🐘 ] [ 🐸 ]          │  ← 3 big animal tiles from round.choices
 *   └──────────────────────────────┘
 *
 * The host owns speech (useSpeech) + advance logic; this component only calls
 * onReplay (re-speak the animal name) and onPick(index).
 *
 * The choice tiles are the shared <AnimalTile> (see ./AnimalTile). hearName
 * lets the tile name the animal in its a11y label (revealName defaults true).
 *
 * RTL:
 *   - Choice row: standard flex row, NO direction pin. Logical indices are
 *     position-independent; correctIndex is never adjusted for visual position.
 *   - Animal emoji are authored DATA, rendered literally (never translated).
 */

import { useWindowDimensions, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  IconButton,
  SPACING,
  useTranslation,
} from '@/sdk';
import type { Animal, HearNameRound } from '../types';
import { AnimalTile } from './AnimalTile';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type HearNameProps = {
  /** The round to render (target + choices + correctIndex). */
  round: HearNameRound;
  /** Re-speak the target animal name (host owns the speech). */
  onReplay: () => void;
  /** Called when a choice tile is tapped. */
  onPick: (index: number) => void;
  /** Index the player has tapped (null = not yet answered). */
  selectedIndex: number | null;
  /** Whether tapping should be ignored (post-answer cooldown / overlay). */
  disabled?: boolean;
};

type TileState = 'default' | 'correct' | 'wrong';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HearName({
  round,
  onReplay,
  onPick,
  selectedIndex,
  disabled = false,
}: HearNameProps): React.JSX.Element {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const { choices, correctIndex } = round;
  const answered = selectedIndex !== null;

  const getTileState = (idx: number): TileState => {
    if (selectedIndex === null) return 'default';
    if (idx === correctIndex) return 'correct';
    if (idx === selectedIndex) return 'wrong';
    return 'default';
  };

  return (
    <View style={[styles.root, landscape && styles.rootLandscape]}>
      {/* Hero speaker — the listening moment is the star. */}
      <View style={styles.hero}>
        <Text style={styles.listenLabel}>
          {t('animal-safari:hearName.listen')}
        </Text>
        <IconButton
          glyph="🔊"
          onPress={onReplay}
          disabled={disabled}
          accessibilityLabel={t('animal-safari:a11y.replay')}
          size={landscape ? 116 : 148}
          glyphSize={landscape ? 56 : 70}
          style={styles.speaker}
        />
        <Text style={styles.tapAgain}>{t('animal-safari:hearName.tapAgain')}</Text>
      </View>

      {/* Instruction */}
      <Text style={styles.which}>{t('animal-safari:hearName.which')}</Text>

      {/* Choice row — no direction pin: equal-weight options, safe to mirror. */}
      <View style={[styles.row, landscape && styles.rowLandscape]}>
        {choices.map((choice: Animal, idx: number) => (
          <AnimalTile
            key={choice.id}
            animal={choice}
            state={getTileState(idx)}
            onPress={() => onPick(idx)}
            disabled={disabled || answered}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.canvas,
  },
  // Landscape: distribute hero / instruction / choices evenly across the
  // shorter height — device-agnostic, no pixel budgets.
  rootLandscape: {
    justifyContent: 'space-evenly',
    gap: 0,
    paddingVertical: SPACING.xs,
    backgroundColor: 'transparent',
  },

  // Hero block
  hero: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  listenLabel: {
    fontFamily: FONTS.bodyExtra,
    fontSize: 13,
    letterSpacing: 0.8,
    color: COLORS.inkSoft,
  },
  speaker: {
    backgroundColor: ACCENTS.orange.base,
    borderRadius: BORDER_RADIUS.card,
  },
  tapAgain: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.inkSoft,
  },

  // Instruction
  which: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.ink,
    textAlign: 'center',
  },

  // Choice row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
    maxWidth: 420,
  },
  rowLandscape: {
    maxWidth: 720,
    justifyContent: 'space-evenly',
    flexGrow: 0,
    flexShrink: 0,
  },
});
