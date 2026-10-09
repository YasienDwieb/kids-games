// Wraps a play screen: logs play time while it's showing and, once the
// parent-set daily limit is used up, swaps the game for a gentle break screen.
// A grown-up can grant 15 more minutes behind the parent gate.
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ParentGate, PressableButton } from '../components/common';
import {
  EXTRA_MINUTES,
  Mascot,
  grantExtraTime,
  overLimit,
  playtimeStore,
  settingsStore,
  usePlaytimeTracker,
  useTranslation,
  type Playtime,
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
  const [playtime, setPlaytime] = useState<Playtime | null>(null);
  const [limit, setLimit] = useState<number | null | undefined>(undefined);
  const [asking, setAsking] = useState(false);

  // Both stores load async; mounting the game against defaults would let an
  // over-limit child hear its sounds/tutorial before the break screen swaps in.
  useEffect(() => {
    let alive = true;
    void playtimeStore.get().then((v) => alive && setPlaytime(v));
    void settingsStore.get().then((s) => alive && setLimit(s.dailyLimitMin ?? null));
    const unsubP = playtimeStore.subscribe((v) => alive && setPlaytime(v));
    const unsubS = settingsStore.subscribe((s) => alive && setLimit(s.dailyLimitMin ?? null));
    return () => {
      alive = false;
      unsubP();
      unsubS();
    };
  }, []);

  const ready = playtime !== null && limit !== undefined;
  const blocked = ready && overLimit(playtime, limit);

  usePlaytimeTracker(ready && !blocked ? trackId : null);

  if (!ready) return <View style={styles.root} />;
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
