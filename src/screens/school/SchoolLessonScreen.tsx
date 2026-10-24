// One lesson, the book's way: Learn (the buddy explains, tap to hear) →
// Practise (a few rounds; soft mistakes through the shared hint ladder) →
// I learned (a certificate with the checklist and stars).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import { EmojiImage, Icon, IconButton, PressableButton } from '../../components/common';
import { PopBackdrop, Sunburst, bob, pulse, useLoop } from '../../components/pop';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING, fontForLang, fontForText } from '../../constants';
import {
  CelebrationProvider,
  Mascot,
  MascotHelper,
  useCelebrate,
  useHintLadder,
  useSound,
  useSpeech,
  useTranslation,
} from '@/sdk';
import {
  SUBJECT_META,
  findLesson,
  finishLesson,
  shuffleRound,
  useAppLang,
  type Lesson,
  type Round,
  type Unit,
} from '../../school';
import { StarRow, VisualArt } from './parts';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolLesson'>;
type Phase = 'learn' | 'practise' | 'learned';

export function SchoolLessonScreen(props: Props) {
  return (
    <CelebrationProvider>
      <LessonPlayer {...props} />
    </CelebrationProvider>
  );
}

function LessonPlayer({ navigation, route }: Props) {
  const { t } = useTranslation();
  const lang = useAppLang();
  const found = findLesson(lang, route.params.lessonId);
  if (!found) {
    return (
      <SafeAreaView style={styles.flex}>
        <Text style={styles.missing}>{t('player.notFound')}</Text>
      </SafeAreaView>
    );
  }
  return <LessonView key={found.lesson.id} unit={found.unit} lesson={found.lesson} navigation={navigation} />;
}

function LessonView({ unit, lesson, navigation }: { unit: Unit; lesson: Lesson; navigation: Props['navigation'] }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>(lesson.learn ? 'learn' : 'practise');
  const [run, setRun] = useState(0); // bumps on "Play again"
  const [result, setResult] = useState<{ stars: number; gained: number } | null>(null);
  const accent = ACCENTS[SUBJECT_META[unit.subject].accent];
  const nextLesson = unit.lessons[unit.lessons.indexOf(lesson) + 1];

  const steps: { id: Phase; label: string }[] = [
    ...(lesson.learn ? [{ id: 'learn' as const, label: t('school.steps.learn') }] : []),
    { id: 'practise', label: t('school.steps.practise') },
    { id: 'learned', label: t('school.steps.learned') },
  ];

  return (
    <View style={styles.flex}>
      <PopBackdrop color={COLORS.canvas} stripe={COLORS.canvas2} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.bar}>
          <IconButton onPress={() => navigation.goBack()} accessibilityLabel={t('school.toPath')}>
            <Icon name="chevron-back" size={26} />
          </IconButton>
          <View style={[styles.subjectPill, { backgroundColor: accent.base }]}>
            <Text style={[styles.subjectText, { fontFamily: fontForText(lesson.title) }]} numberOfLines={1}>
              {/* Isolate the title so its punctuation keeps its own direction. */}
              {t(`school.subjects.${unit.subject}`)} · {`\u2068${lesson.title}\u2069`}
            </Text>
          </View>
          <View style={styles.flex} />
          <View style={[styles.steps, SHADOWS.sm]} accessibilityRole="tablist">
            {steps.map((s, i) => {
              const at = steps.findIndex((x) => x.id === phase);
              const on = s.id === phase;
              return (
                <View
                  key={s.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={[styles.step, on && styles.stepOn, i < at && { backgroundColor: accent.tint }]}
                >
                  <Text style={[styles.stepText, on && styles.stepTextOn]}>
                    {i < at ? '✓ ' : ''}
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {phase === 'learn' && lesson.learn ? (
          <LearnStep unit={unit} lesson={lesson} onNext={() => setPhase('practise')} />
        ) : phase === 'practise' ? (
          <PractiseStep
            key={run}
            unit={unit}
            lesson={lesson}
            onDone={async (misses) => {
              setResult(await finishLesson(unit.subject, lesson, misses));
              setPhase('learned');
            }}
          />
        ) : (
          <LearnedStep
            unit={unit}
            lesson={lesson}
            stars={result?.stars ?? 1}
            gained={result?.gained ?? 0}
            onAgain={() => {
              setRun((n) => n + 1);
              setPhase('practise');
            }}
            onNext={() =>
              nextLesson
                ? navigation.replace('SchoolLesson', { lessonId: nextLesson.id })
                : navigation.goBack()
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// --- Learn -------------------------------------------------------------------

function LearnStep({ unit, lesson, onNext }: { unit: Unit; lesson: Lesson; onNext: () => void }) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const learn = lesson.learn!;
  const ring = useLoop(1200);
  const go = useLoop(1100);
  const font = fontForLang(unit.lang, 'display');
  const dir = unit.lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    void speak(learn.explain, { language: unit.lang });
  }, [learn.explain, speak, unit.lang]);

  const say = (text: string) => void speak(text, { language: unit.lang });

  return (
    <View style={[styles.learn, { direction: dir }]}>
      {/* The big focus card */}
      <View style={[styles.focusCard, SHADOWS.md]}>
        <Text style={[styles.caption, { fontFamily: fontForLang(unit.lang, 'bodyExtra') }]}>{learn.caption}</Text>
        <Pressable
          onPress={() => say(learn.focusSay)}
          accessibilityRole="button"
          accessibilityLabel={learn.focusSay}
          style={[styles.focus, { backgroundColor: ACCENTS[SUBJECT_META[unit.subject].accent].tint }]}
        >
          <VisualArt visual={learn.focus} size={108} />
        </Pressable>
        <Animated.View style={pulse(ring, 0.05)}>
          <PressableButton accent="green" onPress={() => say(learn.focusSay)} accessibilityLabel={t('school.listen')}>
            <View style={styles.listenRow}>
              <Icon name="volume-high" size={20} />
              <Text style={[styles.listenText, { fontFamily: font }]} numberOfLines={1}>
                {learn.focusSay}
              </Text>
            </View>
          </PressableButton>
        </Animated.View>
        {learn.forms ? (
          <View style={styles.forms}>
            {learn.forms.map((f) => (
              <Text key={f} style={[styles.form, { fontFamily: fontForText(f) }]}>
                {f}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {/* Words / things to count */}
      <ScrollView style={styles.flex} contentContainerStyle={styles.wordsCol}>
        {learn.group ? (
          <View style={[styles.groupCard, SHADOWS.sm]}>
            <VisualArt visual={{ kind: 'group', emoji: learn.group.emoji, n: learn.group.n }} size={150} />
          </View>
        ) : null}
        <View style={styles.words}>
          {learn.words.map((w, i) => (
            <Pressable
              key={`${w.emoji}-${i}`}
              onPress={() => say(w.text)}
              accessibilityRole="button"
              accessibilityLabel={w.text}
              style={({ pressed }) => [styles.word, pressed ? styles.pressed : SHADOWS.sm]}
            >
              <EmojiImage emoji={w.emoji} size={46} />
              <Text style={[styles.wordText, { fontFamily: font }]} numberOfLines={1} adjustsFontSizeToFit>
                {w.mark ? (
                  <>
                    <Text style={styles.wordMark}>{w.text.slice(0, w.mark)}</Text>
                    {w.text.slice(w.mark)}
                  </>
                ) : (
                  w.text
                )}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* The buddy explains */}
      <View style={styles.explain}>
        <Pressable onPress={() => say(learn.explain)} accessibilityRole="button" style={[styles.explainBubble, SHADOWS.sm]}>
          <Text style={[styles.explainText, { fontFamily: font, writingDirection: dir }]}>{learn.explain}</Text>
        </Pressable>
        <Mascot pose="point" size={120} pointTo={dir === 'rtl' ? 'right' : 'left'} />
        <Animated.View style={pulse(go, 0.05)}>
          <PressableButton label={t('school.practiseCta')} accent="green" onPress={onNext} />
        </Animated.View>
      </View>
    </View>
  );
}

// --- Practise ------------------------------------------------------------------

function PractiseStep({ unit, lesson, onDone }: { unit: Unit; lesson: Lesson; onDone: (misses: number) => void }) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const { play } = useSound();
  const celebrate = useCelebrate();
  const rounds = useMemo<Round[]>(() => lesson.rounds.map((r) => shuffleRound(r)), [lesson]);
  const [i, setI] = useState(0);
  const ladder = useHintLadder(i);
  const totalMisses = useRef(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [board, setBoard] = useState({ w: 0, h: 0 });
  const glow = useLoop(900);
  const focused = useIsFocused();
  const r = rounds[i];
  const font = fontForLang(unit.lang, 'display');

  const ask = useCallback(() => void speak(r.say ?? r.prompt, { language: unit.lang }), [r, speak, unit.lang]);
  useEffect(() => {
    if (focused) ask();
  }, [ask, focused]);

  const tap = async (k: number) => {
    if (locked) return;
    if (k === r.answer) {
      setLocked(true);
      setWrong(null);
      play('sfx.success');
      await celebrate('small');
      if (i + 1 >= rounds.length) {
        onDone(totalMisses.current);
      } else {
        setI(i + 1);
        setLocked(false);
      }
    } else {
      totalMisses.current += 1;
      setWrong(k);
      play('sfx.wrong');
      ladder.miss();
    }
  };

  const n = r.options.length;
  // Fit the tiles to the board both ways (a count panel above takes height).
  const tile = Math.max(64, Math.min(130, (board.w - (n - 1) * 14) / n, board.h - 12));
  const highlight = ladder.step === 'highlight' || ladder.step === 'reveal';

  return (
    <View style={styles.practise}>
      <View style={[styles.dots, SHADOWS.sm]} accessible accessibilityLabel={t('school.roundOf', { n: i + 1, total: rounds.length })}>
        {rounds.map((_, k) => (
          <View key={k} style={[styles.roundDot, k < i && styles.roundDone, k === i && styles.roundNow]} />
        ))}
      </View>

      <Pressable onPress={ask} accessibilityRole="button" style={[styles.prompt, SHADOWS.md]}>
        <View style={styles.speaker}>
          <Icon name="volume-high" size={20} />
        </View>
        <Text style={[styles.promptText, { fontFamily: font, writingDirection: unit.lang === 'ar' ? 'rtl' : 'ltr' }]}>
          {r.prompt}
        </Text>
      </Pressable>

      {r.show ? (
        <View style={[styles.showCard, SHADOWS.sm]}>
          <VisualArt visual={r.show} size={r.show.kind === 'group' ? 170 : 90} />
        </View>
      ) : null}

      <View style={styles.board} onLayout={(e: LayoutChangeEvent) => setBoard({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {r.options.map((o, k) => {
          const isAnswer = k === r.answer;
          const glowing = highlight && isAnswer;
          return (
            <Animated.View key={`${i}-${k}`} style={glowing ? pulse(glow, 0.08) : null}>
              <Pressable
                onPress={() => tap(k)}
                accessibilityRole="button"
                accessibilityLabel={o.kind === 'text' ? o.text : o.kind === 'emoji' ? o.emoji : String(k + 1)}
                style={({ pressed }) => [
                  styles.option,
                  { width: tile, height: tile },
                  glowing ? styles.optionGlow : wrong === k ? styles.optionWrong : SHADOWS.md,
                  ladder.step === 'reveal' && !isAnswer && styles.optionFaded,
                  pressed && styles.pressed,
                ]}
              >
                <VisualArt visual={o} size={tile} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Hidden once solved: the 3D buddy cheers the win instead. */}
      <MascotHelper pose={ladder.step && !locked ? (ladder.step === 'retry' ? 'encourage' : 'point') : null} size={110} />
    </View>
  );
}

// --- I learned -----------------------------------------------------------------

function LearnedStep({
  unit,
  lesson,
  stars,
  gained,
  onAgain,
  onNext,
}: {
  unit: Unit;
  lesson: Lesson;
  stars: number;
  gained: number;
  onAgain: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const celebrate = useCelebrate();
  const float = useLoop(1000);
  useEffect(() => {
    void celebrate('big', { praise: true });
  }, [celebrate]);
  const what = lesson.learn?.caption ?? lesson.title;
  return (
    <View style={styles.learned}>
      <View style={styles.burst} pointerEvents="none">
        <Sunburst color={ACCENTS[SUBJECT_META[unit.subject].accent].tint} size={900} />
      </View>
      <View style={[styles.cert, SHADOWS.lg]}>
        <View style={styles.certHead}>
          <View style={styles.seal}>
            <VisualArt visual={lesson.learn?.focus ?? { kind: 'text', text: lesson.stop }} size={54} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.certKicker}>{t('school.certificate')}</Text>
            <Text style={[styles.certTitle, { fontFamily: fontForText(what) }]} numberOfLines={2}>
              {t('school.learnedTitle', { what })}
            </Text>
          </View>
        </View>
        <View style={styles.certStars}>
          <StarRow n={stars} size={34} />
          {gained > 0 ? <Text style={styles.gained}>{t('school.newStars', { n: gained })}</Text> : null}
        </View>
        <View style={styles.checks}>
          {lesson.checks.map((c) => (
            <Text key={c} style={styles.check}>
              ✓ {t(`school.check.${c}`)}
            </Text>
          ))}
        </View>
        <View style={styles.certRow}>
          <PressableButton label={t('school.again')} variant="ghost" onPress={onAgain} />
          <PressableButton label={t('school.next')} accent="green" onPress={onNext} />
        </View>
      </View>
      <Animated.View style={[styles.cheer, bob(float, 14)]} pointerEvents="none">
        <Mascot pose="cheer" size={170} bob={false} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  missing: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, textAlign: 'center', padding: 40 },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  bar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingTop: SPACING.xs },
  subjectPill: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    maxWidth: 320,
  },
  subjectText: { fontSize: 15, color: COLORS.ink },
  steps: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  step: { height: 32, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 999 },
  stepOn: { backgroundColor: COLORS.ink },
  stepText: { fontFamily: FONTS.bodyExtra, fontSize: 13, color: COLORS.inkSoft },
  stepTextOn: { color: COLORS.surface },

  // learn
  learn: { flex: 1, flexDirection: 'row', gap: SPACING.md, padding: SPACING.md },
  focusCard: {
    width: 230,
    padding: 10,
    gap: 6,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  caption: { fontSize: 14, color: COLORS.inkSoft },
  focus: {
    width: 124,
    height: 124,
    borderRadius: 30,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
  listenText: { fontSize: 18, color: COLORS.ink, maxWidth: 150 },
  forms: { flexDirection: 'row', gap: 8, direction: 'ltr' },
  form: {
    fontSize: 20,
    lineHeight: 30,
    color: COLORS.ink,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },
  wordsCol: { gap: 12, paddingBottom: 8 },
  groupCard: {
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  word: {
    width: 104,
    height: 104,
    padding: 6,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  wordText: { fontSize: 19, color: COLORS.ink },
  wordMark: { color: ACCENTS.green.deep },
  explain: { width: 210, alignItems: 'center', justifyContent: 'space-between' },
  explainBubble: {
    padding: 10,
    borderRadius: 16,
    borderBottomStartRadius: 4,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  explainText: { fontSize: 15, lineHeight: 22, color: POP.grape, textAlign: 'center' },

  // practise
  practise: { flex: 1, alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  dots: {
    position: 'absolute',
    top: SPACING.xs,
    end: SPACING.lg,
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  roundDot: { width: 16, height: 16, borderRadius: 8, borderWidth: OUTLINE.thin, borderColor: OUTLINE.color, backgroundColor: COLORS.surface },
  roundDone: { backgroundColor: ACCENTS.green.base },
  roundNow: { backgroundColor: POP.zap },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.xs,
  },
  speaker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.splash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: { fontSize: 24, color: COLORS.ink },
  showCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 22,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.blue.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: { flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  option: {
    borderRadius: 24,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionGlow: { backgroundColor: POP.zap, borderWidth: OUTLINE.thick },
  optionWrong: { backgroundColor: ACCENTS.coral.tint },
  optionFaded: { opacity: 0.35 },

  // learned
  learned: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.lg, overflow: 'hidden' },
  cert: {
    width: 460,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    gap: 8,
    borderRadius: 28,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  certHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seal: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certKicker: { fontFamily: FONTS.bodyExtra, fontSize: 13, color: COLORS.inkSoft },
  certTitle: { fontSize: 24, lineHeight: 32, color: COLORS.ink },
  certStars: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  gained: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, direction: 'ltr' },
  checks: {
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.green.tint,
  },
  check: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink },
  certRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  cheer: { width: 170, height: 170 },
  burst: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
