import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, SHADOWS, BORDER_RADIUS } from '../../constants';
import { PressableButton } from './PressableButton';

// Operands stay in the 6-9 range: trivial for an adult, out of reach for the
// 2-10 year olds this gate exists to stop.
const MIN = 6;
const MAX = 9;

function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export type Challenge = { a: number; b: number; answer: number; choices: number[] };

/** Exported for tests: a product plus two plausible, distinct, non-negative decoys. */
export function makeChallenge(): Challenge {
  const a = randInt(MIN, MAX);
  const b = randInt(MIN, MAX);
  const answer = a * b;
  const choices = new Set<number>([answer]);
  while (choices.size < 3) {
    // Near misses (off by a factor of one operand, or a digit slip) look
    // plausible, so the gate can't be beaten by picking the odd one out.
    const delta = [a, b, -a, -b, 10, -10][randInt(0, 5)];
    const candidate = answer + delta;
    if (candidate > 0 && candidate !== answer) choices.add(candidate);
  }
  return {
    a,
    b,
    answer,
    choices: [...choices].sort(() => Math.random() - 0.5),
  };
}

type ParentGateProps = {
  onPass: () => void;
};

/**
 * Blocks the child from reaching Settings, where language switching, the age
 * filter and journey reset all live. Without it any toddler can flip the whole
 * app to another language or silently hide games from their own home screen.
 */
export function ParentGate({ onPass }: ParentGateProps) {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState(false);
  // Re-rolled on every wrong answer so the gate can't be brute-forced by tapping.
  const challenge = useMemo(() => makeChallenge(), [round]);

  const choose = (value: number) => {
    if (value === challenge.answer) {
      onPass();
      return;
    }
    setWrong(true);
    setRound((r) => r + 1);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.card, SHADOWS.md]}>
        <Text style={styles.title}>{t('settings.gate.title')}</Text>

        {/* Equations read left-to-right in Arabic too, so pin the row. */}
        <View style={styles.equation}>
          <Text style={styles.equationText}>
            {challenge.a} × {challenge.b} = ?
          </Text>
        </View>

        <View style={styles.choices}>
          {challenge.choices.map((choice) => (
            <PressableButton
              key={choice}
              label={String(choice)}
              accent="purple"
              onPress={() => choose(choice)}
              style={styles.choice}
            />
          ))}
        </View>

        <Text style={[styles.hint, !wrong && styles.hintHidden]}>
          {t('settings.gate.wrong')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.tile,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 20,
    color: COLORS.ink,
    textAlign: 'center',
  },
  equation: {
    direction: 'ltr',
  },
  equationText: {
    fontFamily: FONTS.display,
    fontSize: 34,
    color: COLORS.ink,
    writingDirection: 'ltr',
  },
  choices: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  choice: {
    minWidth: 86,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: 'center',
  },
  // Reserved so the card doesn't jump in height when the hint appears.
  hintHidden: {
    opacity: 0,
  },
});
