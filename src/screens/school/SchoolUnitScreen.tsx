// A unit as a path of stops: the "Listen" story, one stop per lesson (in the
// book's order), the review, then the treasure chest. Arabic units run
// right-to-left whatever the app language; the yellow stop is always next.
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import { AppBar, Chip, EmojiImage, Icon, IconButton, PressableButton } from '../../components/common';
import { PopBackdrop, pulse, useLoop, wiggle } from '../../components/pop';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING, fontForLang, fontForText } from '../../constants';
import { Mascot, useSpeech, useTranslation } from '@/sdk';
import {
  CHEST_STARS,
  SUBJECT_META,
  currentUnitIndex,
  markIntroHeard,
  nextLessonIndex,
  openChest,
  starsOf,
  unitDone,
  unitStars,
  useSchool,
  useSchoolProgress,
  type Unit,
} from '../../school';
import { StarRow } from './parts';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolUnit'>;

const STOP = 58;
const NOW = 74;

const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);

export function SchoolUnitScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const school = useSchool();
  const progress = useSchoolProgress();
  const units = school.units(route.params.subject);
  const [unitId, setUnitId] = useState<string | undefined>(route.params.unitId);
  const unit: Unit | undefined = units.find((u) => u.id === unitId) ?? units[currentUnitIndex(units, progress)];
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [modal, setModal] = useState<'intro' | 'chest' | 'closed' | null>(null);
  const beat = useLoop(1100);
  const shake = useLoop(900);

  // First visit to a unit opens its story card.
  useEffect(() => {
    if (unit && !progress.intros.includes(unit.id) && modal === null) {
      setModal('intro');
      void speak(unit.intro.text, { lang: unit.lang });
    }
    // Only when the unit changes or progress first loads.
  }, [unit?.id, progress.intros.length]);

  const accent = ACCENTS[SUBJECT_META[route.params.subject].accent];

  const stops = useMemo(() => {
    if (!unit) return [];
    const n = unit.lessons.length + 2;
    const w = Math.max(0, box.w - NOW);
    const step = n > 1 ? w / (n - 1) : 0;
    const rows = [0.7, 0.3];
    return Array.from({ length: n }, (_, i) => ({
      x: NOW / 2 + i * step,
      y: box.h * rows[i % 2],
    }));
  }, [unit, box]);

  if (!unit) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: accent.base }]}>
        <AppBar title={t(`school.subjects.${route.params.subject}`)} onBack={() => navigation.goBack()} />
        <Text style={styles.empty}>{t('school.termSoon')}</Text>
      </SafeAreaView>
    );
  }

  const next = nextLessonIndex(unit, progress);
  const done = unitDone(unit, progress);
  const opened = progress.chests.includes(unit.id);
  const { have, total } = unitStars(unit, progress);
  const dir = unit.lang === 'ar' ? 'rtl' : 'ltr';
  const contentFont = fontForLang(unit.lang, 'bodyExtra');

  const tapChest = async () => {
    if (opened) return;
    if (!done) return setModal('closed');
    if (await openChest(unit)) setModal('chest');
  };

  const dots = stops.slice(1).flatMap((p, i) => {
    const a = stops[i];
    const lit = i === 0 ? progress.intros.includes(unit.id) : i - 1 < unit.lessons.length && starsOf(unit.lessons[i - 1].id, progress) > 0;
    return [0.25, 0.5, 0.75].map((k) => (
      <View
        key={`${i}-${k}`}
        style={[
          styles.dot,
          { start: a.x + (p.x - a.x) * k - 6, top: a.y + (p.y - a.y) * k - 6 },
          lit ? styles.dotLit : null,
        ]}
      />
    ));
  });

  const label = (text: string, i: number, under = true) => {
    const p = stops[i];
    if (!p) return null;
    return (
      <View
        key={`label-${i}`}
        style={[styles.labelWrap, { start: p.x - 60, top: under ? p.y + NOW / 2 + 2 : p.y - NOW / 2 - 26 }]}
        pointerEvents="none"
      >
        <Text style={[styles.label, { fontFamily: contentFont }]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    );
  };

  const stopView = (i: number) => {
    const p = stops[i];
    if (!p) return null;
    // intro
    if (i === 0) {
      const heard = progress.intros.includes(unit.id);
      return (
        <Pressable
          key="intro"
          onPress={() => {
            setModal('intro');
            void speak(unit.intro.text, { lang: unit.lang });
          }}
          accessibilityRole="button"
          accessibilityLabel={t('school.stop.intro')}
          style={[styles.stop, { start: p.x - STOP / 2, top: p.y - STOP / 2 }, heard ? styles.stopDone : styles.stopOpen, SHADOWS.sm]}
        >
          <EmojiImage emoji="📖" size={30} />
        </Pressable>
      );
    }
    // chest
    if (i === stops.length - 1) {
      return (
        <Animated.View
          key="chest"
          style={[styles.chestWrap, { start: p.x - 36, top: p.y - 36 }, done && !opened ? wiggle(shake, 6) : null]}
        >
          <Pressable
            onPress={tapChest}
            accessibilityRole="button"
            accessibilityLabel={done ? t('school.chest.title') : t('school.chest.closed')}
            style={[styles.chest, opened ? styles.chestOpen : null]}
          >
            <EmojiImage emoji={opened ? '🎉' : '🎁'} size={44} />
          </Pressable>
        </Animated.View>
      );
    }
    const lesson = unit.lessons[i - 1];
    const stars = starsOf(lesson.id, progress);
    const now = i - 1 === next;
    const locked = next >= 0 && i - 1 > next;
    const open = () => navigation.navigate('SchoolLesson', { lessonId: lesson.id });
    const glyph = isEmoji(lesson.stop) ? (
      <EmojiImage emoji={lesson.stop} size={now ? 34 : 28} />
    ) : (
      <Text style={[styles.glyph, { fontFamily: fontForText(lesson.stop), fontSize: now ? 30 : 24 }, locked && styles.glyphLocked]}>
        {lesson.stop}
      </Text>
    );
    if (now) {
      return (
        <Animated.View key={lesson.id} style={[styles.nowWrap, { start: p.x - NOW / 2, top: p.y - NOW / 2 }, pulse(beat, 0.08)]}>
          <Pressable
            onPress={open}
            accessibilityRole="button"
            accessibilityLabel={t('school.stop.play', { title: lesson.title })}
            style={[styles.now, SHADOWS.md]}
          >
            {glyph}
          </Pressable>
        </Animated.View>
      );
    }
    return (
      <Pressable
        key={lesson.id}
        onPress={open}
        disabled={locked}
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
        accessibilityLabel={
          locked ? t('school.stop.locked', { title: lesson.title }) : t('school.stop.done', { title: lesson.title, n: stars })
        }
        style={[
          styles.stop,
          { start: p.x - STOP / 2, top: p.y - STOP / 2 },
          locked ? [styles.stopLocked, { backgroundColor: accent.tint }] : [styles.stopDone, SHADOWS.sm],
        ]}
      >
        {glyph}
        {stars > 0 ? <StarRow n={stars} size={13} style={styles.stopStars} /> : null}
      </Pressable>
    );
  };

  // Buddy waits at the next stop (or by the chest once everything is done).
  const waitAt = next >= 0 ? next + 1 : stops.length - 1;
  const wp = stops[waitAt];
  const waitUp = waitAt % 2 === 0; // bottom-row stop: stand above it
  const buddy = wp ? (
    <View
      pointerEvents="none"
      style={[styles.buddy, { start: wp.x - 40, top: waitUp ? wp.y - NOW / 2 - 92 : wp.y + NOW / 2 + 18 }]}
    >
      <Mascot pose={done ? 'cheer' : 'wave'} size={80} />
    </View>
  ) : null;

  return (
    <View style={styles.flex}>
      <PopBackdrop color={accent.base} stripe={accent.deep} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <AppBar
          title={`${t(`school.subjects.${unit.subject}`)} · ${t('school.unitN', { n: unit.number })}`}
          onBack={() => navigation.goBack()}
          right={
            <View style={[styles.starsPill, SHADOWS.sm]} accessible accessibilityLabel={t('school.starsA11y', { n: have, total })}>
              <Text style={styles.starGlyph}>★</Text>
              <Text style={styles.starsText}>{t('school.stars', { n: have, total })}</Text>
            </View>
          }
        />
        <View style={styles.sub}>
          <Text style={[styles.unitTitle, { fontFamily: fontForLang(unit.lang, 'display') }]} numberOfLines={1}>
            {unit.title}
          </Text>
          {units.length > 1 ? (
            <View style={styles.unitChips}>
              {units.map((u) => (
                <Chip key={u.id} label={t('school.unitN', { n: u.number })} active={u.id === unit.id} onPress={() => setUnitId(u.id)} />
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={[styles.path, { direction: dir }]}
          onLayout={(e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {box.w > 0 ? (
            <>
              {dots}
              {stops.map((_, i) => stopView(i))}
              {label(t('school.stop.intro'), 0)}
              {unit.lessons.map((l, k) => label(l.title, k + 1, (k + 1) % 2 === 0))}
              {buddy}
            </>
          ) : null}
        </View>
      </SafeAreaView>

      {modal ? (
        <View style={styles.scrim}>
          <View style={[styles.card, SHADOWS.lg]}>
            {modal === 'intro' ? (
              <>
                <View style={styles.introEmojis}>
                  {unit.intro.emojis.map((e, i) => (
                    <EmojiImage key={`${e}-${i}`} emoji={e} size={52} />
                  ))}
                </View>
                <Text style={[styles.introText, { fontFamily: fontForLang(unit.lang, 'display'), writingDirection: dir }]}>
                  {unit.intro.text}
                </Text>
                <View style={styles.cardRow}>
                  <IconButton onPress={() => void speak(unit.intro.text, { lang: unit.lang })} accessibilityLabel={t('school.listen')}>
                    <Icon name="volume-high" size={22} />
                  </IconButton>
                  <PressableButton
                    label={t('school.intro.cta')}
                    accent="green"
                    onPress={() => {
                      void markIntroHeard(unit.id);
                      setModal(null);
                    }}
                  />
                </View>
              </>
            ) : modal === 'chest' ? (
              <>
                <EmojiImage emoji="🎉" size={72} />
                <Text style={styles.cardTitle}>{t('school.chest.title')}</Text>
                <Text style={styles.cardBody}>{t('school.chest.body', { n: CHEST_STARS })}</Text>
                <PressableButton label={t('school.chest.ok')} accent="orange" onPress={() => setModal(null)} />
              </>
            ) : (
              <>
                <EmojiImage emoji="🎁" size={64} />
                <Text style={styles.cardBody}>{t('school.chest.closed')}</Text>
                <PressableButton label={t('common.done')} accent="purple" onPress={() => setModal(null)} />
              </>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, textAlign: 'center', padding: 40 },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  starGlyph: { fontSize: 20, color: COLORS.gold },
  starsText: { fontFamily: FONTS.display, fontSize: 17, color: COLORS.ink, direction: 'ltr' },
  sub: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.lg, marginTop: -4 },
  unitTitle: { flex: 1, fontSize: 22, color: COLORS.ink },
  unitChips: { flexDirection: 'row', gap: 6 },
  path: { flex: 1, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotLit: { backgroundColor: POP.zap, borderWidth: OUTLINE.thin, borderColor: OUTLINE.color },
  stop: {
    position: 'absolute',
    width: STOP,
    height: STOP,
    borderRadius: STOP / 2,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDone: { backgroundColor: COLORS.surface },
  stopOpen: { backgroundColor: POP.zap },
  stopLocked: { borderStyle: 'dashed' },
  stopStars: { position: 'absolute', bottom: -14 },
  glyph: { color: COLORS.ink, textAlign: 'center' },
  glyphLocked: { color: COLORS.inkSoft },
  nowWrap: { position: 'absolute', width: NOW, height: NOW },
  now: {
    flex: 1,
    borderRadius: NOW / 2,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestWrap: { position: 'absolute', width: 72, height: 72 },
  chest: {
    flex: 1,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.orange.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestOpen: { backgroundColor: COLORS.surface },
  labelWrap: { position: 'absolute', width: 120, alignItems: 'center' },
  label: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    fontSize: 12,
    color: COLORS.ink,
    overflow: 'hidden',
  },
  buddy: { position: 'absolute', width: 80, height: 80 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  card: {
    maxWidth: 480,
    padding: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  introEmojis: { flexDirection: 'row', gap: 10 },
  introText: { fontSize: 20, lineHeight: 32, color: COLORS.ink, textAlign: 'center' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardTitle: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.ink },
  cardBody: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.inkSoft, textAlign: 'center' },
});
