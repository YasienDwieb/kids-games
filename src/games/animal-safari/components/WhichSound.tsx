/**
 * WhichSound — the "play the sound, then tap the animal that makes it" round.
 *
 * Layout (mirrors letter-land/HearAndFind):
 *   ┌──────────────────────────────┐
 *   │ LISTEN… label                │
 *   │ ◉ big hero "play sound" button  ← onPress = onReplay → host plays SFX
 *   │ Tap to hear it again         │
 *   │ Which animal makes this sound?│  ← instruction
 *   │ [ tile ] [ tile ] [ tile ]   │  ← 3 big animal (emoji) tiles
 *   └──────────────────────────────┘
 *
 * The host owns the audio (useSound) + advance logic; this component only
 * calls onReplay (re-play the clip) and onPick(index).
 *
 * The choice tiles are the shared <AnimalTile> (see ./AnimalTile), rendered
 * with revealName={false}: the a11y label stays generic so it never names —
 * and thus never gives away — the animal the sound belongs to.
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
import type { WhichSoundRound } from '../types';
import { AnimalTile } from './AnimalTile';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type WhichSoundProps = {
  /** The round to render (target + choices + correctIndex). */
  round: WhichSoundRound;
  /** Re-play the target animal's sound (host owns the audio). */
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

export function WhichSound({
  round,
  onReplay,
  onPick,
  selectedIndex,
  disabled = false,
}: WhichSoundProps): React.JSX.Element {
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
      {/* Hero "play sound" button — the listening moment is the star. */}
      <View style={styles.hero}>
        <Text style={styles.listenLabel}>
          {t('animal-safari:whichSound.listen')}
        </Text>
        <IconButton
          glyph="🔊"
          onPress={onReplay}
          disabled={disabled}
          accessibilityLabel={t('animal-safari:a11y.replaySound')}
          size={landscape ? 116 : 148}
          glyphSize={landscape ? 56 : 70}
          style={styles.speaker}
        />
        <Text style={styles.tapAgain}>
          {t('animal-safari:whichSound.tapAgain')}
        </Text>
      </View>

      {/* Instruction */}
      <Text style={styles.which}>{t('animal-safari:whichSound.which')}</Text>

      {/* Choice row — no direction pin: equal-weight options, safe to mirror. */}
      <View style={[styles.row, landscape && styles.rowLandscape]}>
        {choices.map((choice, idx) => (
          <AnimalTile
            key={choice.id}
            animal={choice}
            state={getTileState(idx)}
            onPress={() => onPick(idx)}
            disabled={disabled || answered}
            // Deliberate divergence from hearName: keep the a11y label generic so
            // it never names the animal and gives away the answer to the sound.
            revealName={false}
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
