// Wraps a play screen: logs play time while it's showing and, once the
// parent-set daily limit is used up, swaps the game for a gentle break screen.
// A grown-up can grant 15 more minutes behind the parent gate.
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ParentGate, PressableButton } from '../components/common';
import {
  EXTRA_MINUTES,
  Mascot,
  grantExtraTime,
  overLimit,
  usePlaytime,
  usePlaytimeTracker,
  useSettings,
  useTranslation,
} from '@/sdk';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';

type Props = {
  /** Play-time bucket: a game id, or 'journey' for guided mode. */
  trackId: string;
  onHome: () => void;
  children: ReactNode;
};

export function PlayLimitGate({ trackId, onHome, children }: Props) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const playtime = usePlaytime();
  const [asking, setAsking] = useState(false);
  const blocked = overLimit(playtime, settings.dailyLimitMin);

  usePlaytimeTracker(blocked ? null : trackId);

  if (!blocked) return <>{children}</>;

  if (asking) {
    return (
      <View style={styles.root}>
        <ParentGate
          onPass={() => {
            setAsking(false);
            void grantExtraTime();
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, styles.center]}>
      <Mascot pose="encourage" size={150} />
      <Text style={styles.title}>{t('break.title')}</Text>
      <Text style={styles.body}>{t('break.body')}</Text>
      <View style={styles.row}>
        <PressableButton label={t('break.home')} accent="purple" onPress={onHome} />
        <PressableButton
          label={t('break.grownUp', { n: EXTRA_MINUTES })}
          variant="ghost"
          onPress={() => setAsking(true)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  center: { alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.lg },
  title: { fontFamily: FONTS.displayBold, fontSize: FONT_SIZES.lg, color: COLORS.ink, textAlign: 'center' },
  body: { fontFamily: FONTS.body, fontSize: 18, color: COLORS.inkSoft, textAlign: 'center' },
  row: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
});
