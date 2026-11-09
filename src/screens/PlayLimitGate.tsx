// Wraps a play screen: logs play time while it's showing and, once the
// parent-set daily limit is used up, swaps the game for a gentle break screen.
// A grown-up can grant 15 more minutes behind the parent gate.
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Icon, ParentGate, PressableButton, type IconName } from '../components/common';
import { useLoop } from '../components/pop';
import {
  EXTRA_MINUTES,
  BuddyFigure,
  grantExtraTime,
  overLimit,
  playtimeStore,
  settingsStore,
  usePlaytimeTracker,
  useTranslation,
  useBuddy,
  useBuddyLabel,
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

const STRETCHES: { key: string; color: string; icon: IconName }[] = [
  { key: 'break.stretch1', color: ACCENTS.green.base, icon: 'arrow-up' },
  { key: 'break.stretch2', color: POP.zap, icon: 'arrow-down' },
  { key: 'break.stretch3', color: POP.splash, icon: 'leaf' },
];

/** A calm night scene: the buddy dozing, battery low, three stretches. */
function Recharge({ onHome, onGrownUp }: { onHome: () => void; onGrownUp: () => void }) {
  const { t } = useTranslation();
  const buddy = useBuddy();
  const buddyName = useBuddyLabel();
  const drain = useLoop(6000);
  const breathe = useLoop(4000);
  return (
    <View style={[styles.root, styles.night]}>
      <View style={styles.moon} />
      <View style={styles.moonBite} />
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
        </View>

        <Animated.View
          style={{ transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }] }}
        >
          <BuddyFigure size={190} mood="encourage" />
        </Animated.View>

        <View
          style={[styles.stretchCard, SHADOWS.md]}
          accessible
          accessibilityLabel={`${t(`buddy.${buddy}.rest`, { name: buddyName })} ${STRETCHES.map((s) => t(s.key)).join(', ')}`}
        >
          {STRETCHES.map((s) => (
            <View key={s.key} style={[styles.stretchIcon, { backgroundColor: s.color }]}>
              <Icon name={s.icon} size={30} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <PressableButton accessibilityLabel={t('break.home')} color={POP.zap} onPress={onHome}>
          <Icon name="home" size={30} />
        </PressableButton>
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
  stretchCard: {
    gap: 8,
    padding: 14,
    borderRadius: 22,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  stretchIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: SPACING.md },
});
