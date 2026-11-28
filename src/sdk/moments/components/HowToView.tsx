import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';
import { BORDER_RADIUS, OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { useSound } from '@/sdk/audio/useSound';
import { useSpeech } from '@/sdk/speech/useSpeech';
import { useChoiceHints } from '@/sdk/feedback/useChoiceHints';
import { HintPulse } from '@/sdk/feedback/HintPulse';
import type { HowToMoment, HowToStep } from '../types';

/** Three choices: the right next step and two others from the same how-to, in a stable shuffle. */
export function choicesFor(all: readonly HowToStep[], next: HowToStep, seed: number): HowToStep[] {
  const others = all.filter((s) => s !== next);
  const start = others.length ? seed % others.length : 0;
  const picked = [others[start], others[(start + 1) % others.length]].filter(
    (s, i, a): s is HowToStep => s !== undefined && a.indexOf(s) === i,
  );
  const out = [...picked];
  out.splice(seed % (out.length + 1), 0, next);
  return out;
}

/**
 * "Tap the next step": the steps done so far in a strip, three pictures to
 * choose from, the next step voiced as the prompt. Wrong picks walk the shared
 * hint ladder (retry, highlight, reveal). Calls `onDone(misses)` after the last step.
 */
export function HowToView({
  moment,
  before,
  steps,
  onDone,
  size,
}: {
  moment: HowToMoment;
  before: HowToStep[];
  steps: HowToStep[];
  onDone: (misses: number) => void;
  size: number;
}) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const { play } = useSound();
  const [placed, setPlaced] = useState(0);
  const [misses, setMisses] = useState(0);
  const hints = useChoiceHints(placed);
  const next = steps[placed];
  const choices = useMemo(
    () => (next ? choicesFor(moment.steps, next, before.length + placed) : []),
    [moment.steps, next, before.length, placed],
  );
  const correctIndex = next ? choices.indexOf(next) : -1;

  useEffect(() => {
    if (next) void speak(t(`moments:${next.phraseKey}`));
  }, [next, speak, t]);

  const pick = (i: number) => {
    if (!next) return;
    if (i === correctIndex) {
      play('sfx.success');
      const placedNow = placed + 1;
      setPlaced(placedNow);
      if (placedNow === steps.length) onDone(misses);
      return;
    }
    play('sfx.wrong');
    setMisses((m) => m + 1);
    hints.miss(correctIndex)();
  };

  const done = [...before, ...steps.slice(0, placed)];
  const thumb = Math.round(size * 0.32);
  const choice = Math.round(size * 0.6);

  return (
    <View style={styles.root}>
      <View style={styles.strip}>
        {done.map((s, i) => (
          <View key={i} style={[styles.tile, styles.doneTile]}>
            <Image source={s.image} style={{ width: thumb, height: thumb }} resizeMode="contain" />
          </View>
        ))}
      </View>
      <View style={styles.choices}>
        {choices.map((s, i) => {
          const highlight = hints.hintIndex === i || (hints.revealCorrect && i === correctIndex);
          return (
            <HintPulse key={`${placed}-${i}`} active={highlight}>
              <Pressable
                onPress={() => pick(i)}
                accessibilityRole="button"
                accessibilityLabel={t(`moments:${s.phraseKey}`)}
                style={({ pressed }) => [styles.tile, SHADOWS.md, highlight && styles.hint, pressed && styles.pressed]}
                testID={i === correctIndex ? 'howto-correct' : 'howto-wrong'}
              >
                <Image source={s.image} style={{ width: choice, height: choice }} resizeMode="contain" />
              </Pressable>
            </HintPulse>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  strip: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, minHeight: 40 },
  choices: { flexDirection: 'row', gap: SPACING.lg },
  tile: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  doneTile: { opacity: 0.85 },
  hint: { borderColor: COLORS.accent.green.deep, borderWidth: OUTLINE.thick },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
});
