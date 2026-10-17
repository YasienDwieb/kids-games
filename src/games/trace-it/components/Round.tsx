/**
 * One character, start to finish: walks its RoundSteps (guided then solo passes)
 * on a TraceBoard, with the word pane on the end side. On the last step it
 * records stars, celebrates, shows the sticker, then calls `onFinished`.
 * Used by the standalone screen (`full`) and the guided flow (`guidedOnly`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  COLORS,
  FONTS,
  MascotHelper,
  SPACING,
  awardStars,
  useCelebrate,
  useFirstRun,
  useIdle,
  useSound,
  useSpeech,
  useTranslation,
} from '@/sdk';
import { blockComplete, roundSteps, type TraceChar } from '../catalog';
import { charStars, progressStore, recordStars } from '../progress';
import { TraceBoard } from './TraceBoard';
import { WinSticker } from './WinSticker';
import { WordPane } from './WordPane';

type RoundProps = {
  char: TraceChar;
  mode: 'full' | 'guidedOnly';
  onFinished: (stars: 1 | 2 | 3) => void;
};

const IDLE_MS = 6000;
const ACCENT = 'coral' as const;
// Start padding clears the bare-mode floating back button (56 wide, SPACING.md in).
const PAD_START = 56 + SPACING.md * 2;
const PAD_END = SPACING.lg;

export function Round({ char, mode, onFinished }: RoundProps) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const { play } = useSound();
  const celebrate = useCelebrate();
  const steps = useMemo(() => roundSteps(char, mode), [char, mode]);
  const [index, setIndex] = useState(0);
  const [dotsOnly, setDotsOnly] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sticker, setSticker] = useState(false);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const stepStars = useRef<(1 | 2 | 3)[]>([]);
  const finalStars = useRef<1 | 2 | 3>(3);

  const firstRun = useFirstRun('trace-it');
  const { idle, poke } = useIdle(IDLE_MS, !finished);
  const [firstStroke, setFirstStroke] = useState(true);

  const sayChar = useCallback(() => {
    const name = t(char.nameKey);
    void speak(char.word ? t('trace-it:speak.carrier', { name, word: t('letters:words.' + char.word) }) : name);
  }, [char, speak, t]);

  useEffect(() => {
    sayChar();
    // Speak once per character, not on every `t` identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char.id]);

  const endFirstRun = () => {
    if (!firstStroke) return;
    setFirstStroke(false);
    if (firstRun.status === 'show') firstRun.complete();
  };

  const finish = async (stars: 1 | 2 | 3) => {
    setFinished(true);
    finalStars.current = stars;
    play('win');
    sayChar();
    // Script follows the reading direction (read at call time, never at import).
    const script = I18nManager.isRTL ? 'arabic' : 'latin';
    const before = (await progressStore.get()).done;
    await recordStars(char.id, stars);
    const after = (await progressStore.get()).done;
    const big = !blockComplete(char.track, script, before) && blockComplete(char.track, script, after);
    void celebrate(big ? 'big' : 'small', { voice: false });
    void awardStars('trace-it', stars);
    setSticker(true);
  };

  const onDone = (stars: 1 | 2 | 3) => {
    endFirstRun();
    stepStars.current.push(stars);
    poke();
    if (index < steps.length - 1) {
      setDotsOnly(false);
      setIndex(index + 1);
      return;
    }
    void finish(charStars(stepStars.current));
  };

  const onStrokeDone = (next: 'path' | 'dot' | null) => {
    endFirstRun();
    if (next === 'dot') setDotsOnly(true);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
  };

  const step = steps[index];
  const inner = area.width - PAD_START - PAD_END;
  const side = Math.floor(Math.min(area.height * 0.9, inner * 0.55));
  const paneWidth = Math.max(0, inner - side - SPACING.md * 2);
  const instruction =
    char.track === 'warmup'
      ? t('trace-it:round.warmup')
      : dotsOnly
        ? t('trace-it:round.dots')
        : step.pass === 'guided'
          ? t('trace-it:round.guided')
          : t('trace-it:round.solo');
  const showDemo = !finished && ((firstStroke && firstRun.status === 'show') || idle);

  return (
    <View style={styles.root} onLayout={onLayout}>
      {side > 0 ? (
        <>
          <View style={[styles.boardPane, { width: side }]} accessibilityLabel={t('trace-it:a11y.board')}>
            <TraceBoard
              key={`${char.id}:${index}`}
              step={step}
              side={side}
              accent={ACCENT}
              showDemo={showDemo}
              onStrokeDone={onStrokeDone}
              onDone={onDone}
              onActivity={poke}
            />
          </View>
          <View style={styles.sidePane}>
            <Text style={styles.instruction}>{instruction}</Text>
            <WordPane char={char} width={paneWidth} onReplay={sayChar} />
          </View>
        </>
      ) : null}
      <MascotHelper pose={finished ? 'cheer' : null} side="end" size={100} />
      {sticker ? <WinSticker char={char} onDone={() => onFinished(finalStars.current)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingStart: PAD_START, paddingEnd: PAD_END },
  boardPane: { alignItems: 'center', justifyContent: 'center' },
  sidePane: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md },
  instruction: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.ink, textAlign: 'center' },
});
