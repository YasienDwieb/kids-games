// My backpack: bronze / silver / gold per subject, from stars across the
// subject's units, plus how many "I learned" certificates were collected.
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';
import { AppBar } from '../../components/common';
import { PopBackdrop, ProgressBar } from '../../components/pop';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING } from '../../constants';
import { useTranslation } from '@/sdk';
import {
  BADGES,
  SUBJECTS,
  SUBJECT_META,
  badgeTarget,
  badgesEarned,
  starsOf,
  subjectStars,
  useSchool,
  useSchoolProgress,
} from '../../school';
import { BadgeDot } from './parts';

type Props = NativeStackScreenProps<RootStackParamList, 'SchoolBackpack'>;

export function SchoolBackpackScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const school = useSchool();
  const progress = useSchoolProgress();

  return (
    <View style={styles.flex}>
      <PopBackdrop color={POP.bubblegum} stripe={ACCENTS.pink.base} />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <AppBar title={t('school.backpack')} titleColor={COLORS.surface} onBack={() => navigation.goBack()} />
        <View style={[styles.panel, SHADOWS.lg]}>
          {SUBJECTS.map((subject) => {
            const units = school.units(subject);
            const a = ACCENTS[SUBJECT_META[subject].accent];
            const { have, total } = subjectStars(units, progress);
            const earned = badgesEarned(units, progress);
            const nextBadge = BADGES.find((b) => !earned.includes(b));
            const target = nextBadge ? badgeTarget(nextBadge, total) : total;
            const certs = units.reduce((n, u) => n + u.lessons.filter((l) => starsOf(l.id, progress) > 0).length, 0);
            return (
              <View key={subject} style={[styles.col, { backgroundColor: a.tint }]}>
                <Text style={styles.name}>{t(`school.subjects.${subject}`)}</Text>
                <View style={styles.badges}>
                  {BADGES.map((b) => {
                    const on = earned.includes(b);
                    return (
                      <View
                        key={b}
                        accessible
                        accessibilityLabel={t(on ? 'school.badges.earned' : 'school.badges.notYet', { badge: t(`school.badges.${b}`) })}
                      >
                        <BadgeDot badge={b} size={50} earned={on} />
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.toNext}>
                  {nextBadge
                    ? t('school.badges.toNext', { n: have, total: target, badge: t(`school.badges.${nextBadge}`) })
                    : t('school.badges.all')}
                </Text>
                <ProgressBar value={target ? have / target : 1} color={a.base} height={12} style={styles.bar} />
                <Text style={styles.certs}>{t('school.badges.certs', { n: certs })}</Text>
              </View>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    margin: SPACING.md,
    marginTop: 0,
    padding: 14,
    borderRadius: 24,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  name: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.ink },
  badges: { flexDirection: 'row', gap: 6, direction: 'ltr' },
  toNext: { fontFamily: FONTS.bodyExtra, fontSize: 13, color: COLORS.ink, textAlign: 'center' },
  bar: { alignSelf: 'stretch' },
  certs: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.inkSoft },
});
