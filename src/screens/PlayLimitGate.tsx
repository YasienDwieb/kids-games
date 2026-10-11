// Wraps a play screen: logs play time while it's showing and, once the
// parent-set daily limit is used up, swaps the game for a gentle break screen.
// A grown-up can grant 15 more minutes behind the parent gate.
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ParentGate, PressableButton } from '../components/common';
import { useLoop } from '../components/pop';
import {
  EXTRA_MINUTES,
  Lulu3D,
  grantExtraTime,
  overLimit,
  playtimeStore,
  settingsStore,
  usePlaytimeTracker,
  useTranslation,
  type Playtime,
} from '@/sdk';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING } from '../constants';

type Props = {
  /** Play-time bucket: a game id, or 'journey' for guided mode. */
  trackId: string;
  onHome: () => void;
  children: ReactNode;
};

export function PlayLimitGate({ trackId, onHome, children }: Props) {
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

  return <Recharge onHome={onHome} onGrownUp={() => setAsking(true)} />;
}

const STRETCHES = [
  { key: 'break.stretch1', color: ACCENTS.green.base },
  { key: 'break.stretch2', color: POP.zap },
  { key: 'break.stretch3', color: POP.splash },
];

/** "Recharge time!" — a calm night scene: Lulu dozing, her battery low, three stretches. */
function Recharge({ onHome, onGrownUp }: { onHome: () => void; onGrownUp: () => void }) {
  const { t } = useTranslation();
  const drain = useLoop(6000);
  const breathe = useLoop(4000);
  return (
    <View style={[styles.root, styles.night]}>
      <View style={styles.moon} />
      <View style={styles.moonBite} />
      <Text style={styles.title}>{t('break.title')}</Text>
      <Text style={styles.body}>{t('break.body')}</Text>

      <View style={styles.scene}>
        <View style={styles.battery} accessible accessibilityLabel={t('break.energy')}>
          <View style={styles.batteryCap} />
          <View style={[styles.batteryBody, SHADOWS.md]}>
            <Animated.View
              style={[
                styles.batteryFill,
                { transform: [{ scaleY: drain.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.2] }) }] },
              ]}
            />
          </View>
          <Text style={styles.energy}>{t('break.energy')}</Text>
        </View>

        <Animated.View
          style={{ transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }}
        >
          <Lulu3D size={190} mood="encourage" />
        </Animated.View>

        <View style={[styles.stretchCard, SHADOWS.md]}>
          <Text style={styles.stretchTitle}>{t('break.stretchTitle')}</Text>
          {STRETCHES.map((s, i) => (
            <View key={s.key} style={styles.stretchRow}>
              <View style={[styles.stretchNum, { backgroundColor: s.color }]}>
                <Text style={styles.stretchNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stretchText}>{t(s.key)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <PressableButton label={t('break.home')} color={POP.zap} onPress={onHome} />
        <PressableButton label={t('break.grownUp', { n: EXTRA_MINUTES })} variant="ghost" onPress={onGrownUp} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  night: {
    backgroundColor: POP.night,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    overflow: 'hidden',
  },
  moon: { position: 'absolute', top: 24, end: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: POP.zap },
  moonBite: { position: 'absolute', top: 14, end: 26, width: 56, height: 56, borderRadius: 28, backgroundColor: POP.night },
  title: {
    fontFamily: FONTS.display,
    fontSize: 36,
    color: COLORS.surface,
    textAlign: 'center',
    textShadowColor: OUTLINE.color,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0.1,
  },
  body: { fontFamily: FONTS.body, fontSize: 16, color: POP.nightSoft, textAlign: 'center', marginTop: -SPACING.sm },
  scene: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl },
  battery: { alignItems: 'center' },
  batteryCap: {
    width: 26,
    height: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: OUTLINE.base,
    borderBottomWidth: 0,
    borderColor: OUTLINE.color,
  },
  batteryBody: {
    width: 76,
    height: 130,
    borderRadius: 16,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    padding: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  // Scaled from the bottom: the fill is full height, anchored low.
  batteryFill: { height: '100%', borderRadius: 9, backgroundColor: POP.bubblegum, transformOrigin: 'bottom' },
  energy: { fontFamily: FONTS.display, fontSize: 16, color: COLORS.surface, marginTop: 6 },
  stretchCard: {
    width: 210,
    gap: 8,
    padding: 14,
    borderRadius: 22,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  stretchTitle: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, textAlign: 'left' },
  stretchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stretchNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stretchNumText: { fontFamily: FONTS.display, fontSize: 14, color: COLORS.ink },
  stretchText: { flex: 1, fontFamily: FONTS.bodyExtra, fontSize: 15, color: COLORS.ink, textAlign: 'left' },
  row: { flexDirection: 'row', gap: SPACING.md },
});
