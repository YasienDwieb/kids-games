// School hub: pick a subject. Each card shows the unit the child is on, the
// subject's star progress and the badge earned so far.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import { AppBar, Icon } from '../../components/common';
import { PopBackdrop, ProgressBar } from '../../components/pop';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING, fontForText } from '../../constants';
import { Mascot, useTranslation } from '@/sdk';
import {
  SUBJECTS,
  SUBJECT_META,
  badgesEarned,
  currentUnitIndex,
  subjectStars,
  useSchool,
  useSchoolProgress,
  type Subject,
} from '../../school';
import { BadgeDot } from './parts';

type Props = NativeStackScreenProps<RootStackParamList, 'School'>;

export function SchoolHubScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const school = useSchool();
  const progress = useSchoolProgress();

  const card = (subject: Subject) => {
    const units = school.units(subject);
    const meta = SUBJECT_META[subject];
    const a = ACCENTS[meta.accent];
    if (units.length === 0) {
      return (
        <View key={subject} style={[styles.card, styles.cardLater]}>
          <View style={styles.glyphBox}>
            <Text style={[styles.glyph, { fontFamily: fontForText(meta.glyph) }]}>{meta.glyph}</Text>
          </View>
          <Text style={styles.name}>{t(`school.subjects.${subject}`)}</Text>
          <Text style={styles.meta}>{t('school.termSoon')}</Text>
        </View>
      );
    }
    const i = currentUnitIndex(units, progress);
    const unit = units[i];
    const { have, total } = subjectStars(units, progress);
    const badges = badgesEarned(units, progress);
    return (
      <Pressable
        key={subject}
        onPress={() => navigation.navigate('SchoolUnit', { subject })}
        accessibilityRole="button"
        accessibilityLabel={`${t(`school.subjects.${subject}`)}, ${t('school.unitOf', { n: i + 1, total: units.length })}, ${unit.title}`}
        style={({ pressed }) => [styles.card, { backgroundColor: a.base }, pressed ? styles.pressed : SHADOWS.lg]}
      >
        {badges.length > 0 ? (
          <View style={styles.badge}>
            <BadgeDot badge={badges[badges.length - 1]} size={38} />
          </View>
        ) : null}
        <View style={styles.glyphBox}>
          <Text style={[styles.glyph, { fontFamily: fontForText(meta.glyph) }]}>{meta.glyph}</Text>
        </View>
        <Text style={styles.name}>{t(`school.subjects.${subject}`)}</Text>
        <Text style={styles.meta}>{t('school.unitOf', { n: i + 1, total: units.length })}</Text>
        <Text style={[styles.unitTitle, { fontFamily: fontForText(unit.title, 'bodyExtra') }]} numberOfLines={1}>
          {unit.title}
        </Text>
        <ProgressBar value={total ? have / total : 0} color={POP.zap} height={12} style={styles.bar} />
      </Pressable>
    );
  };

  return (
    <View style={styles.flex}>
      <PopBackdrop color={POP.grape} stripe={ACCENTS.purple.base} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <AppBar
          title={t('school.title')}
          titleColor={COLORS.surface}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.barRight}>
              <View style={[styles.chip, { backgroundColor: POP.zap }]}>
                <Text style={styles.chipText}>{t(`school.level.${school.level}`)}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{t('school.term', { n: school.term })}</Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate('SchoolBackpack')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.backpack, pressed ? styles.pressed : SHADOWS.sm]}
              >
                <Icon name="briefcase" size={20} color={ACCENTS.pink.deep} />
                <Text style={styles.chipText}>{t('school.backpack')}</Text>
              </Pressable>
            </View>
          }
        />
        <View style={styles.body}>
          <View style={styles.buddy}>
            <View style={[styles.bubble, SHADOWS.sm]}>
              <Text style={styles.bubbleText}>{t('school.ask')}</Text>
            </View>
            <Mascot pose="point" size={130} />
          </View>
          <View style={styles.cards}>
            {SUBJECTS.map(card)}
            <View style={[styles.card, styles.cardLater]} accessible accessibilityLabel={`${t('school.subjects.discover')}, ${t('school.later')}`}>
              <View style={styles.glyphBox}>
                <Icon name="flask" size={44} color={ACCENTS.green.deep} />
              </View>
              <Text style={styles.name}>{t('school.subjects.discover')}</Text>
              <Text style={styles.meta}>{t('school.later')}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.follows}>{t('school.follows')}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  barRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  chip: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  chipText: { fontFamily: FONTS.display, fontSize: 15, color: COLORS.ink },
  backpack: {
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
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  body: { flex: 1, flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.md },
  buddy: { width: 150, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4 },
  bubble: {
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderBottomStartRadius: 4,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  bubbleText: { fontFamily: FONTS.display, fontSize: 15, color: POP.grape, textAlign: 'center' },
  cards: { flex: 1, flexDirection: 'row', gap: 14, paddingVertical: SPACING.sm },
  card: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderRadius: 26,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  cardLater: { backgroundColor: ACCENTS.purple.tint, borderStyle: 'dashed', justifyContent: 'center' },
  badge: { position: 'absolute', top: -12, end: -8 },
  glyphBox: {
    width: 86,
    height: 86,
    borderRadius: 24,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontFamily: FONTS.display, fontSize: 32, color: COLORS.ink, writingDirection: 'ltr' },
  name: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.ink },
  meta: { fontFamily: FONTS.bodyExtra, fontSize: 13, color: COLORS.ink, textAlign: 'center' },
  unitTitle: { fontFamily: FONTS.bodyExtra, fontSize: 13, color: COLORS.ink },
  bar: { alignSelf: 'stretch', marginTop: 'auto' },
  follows: {
    fontFamily: FONTS.bodyExtra,
    fontSize: 12,
    color: COLORS.surface,
    textAlign: 'center',
    paddingBottom: 4,
  },
});
