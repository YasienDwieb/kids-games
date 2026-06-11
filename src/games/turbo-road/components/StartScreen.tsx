import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  Chip,
  COLORS,
  FONTS,
  HudPill,
  hudTextStyle,
  PressableButton,
  SHADOWS,
  SPACING,
  Star,
  useTranslation,
} from '@/sdk';
import { MISSION_LADDERS } from '../constants';
import type { Mission, StartScreenProps } from '../types';

/* ------------------------------------------------------------------ */
/* Road-trip map geometry — computed once at module load.              */
/* In RTL the PATH is mirrored by flipping x coordinates in JS; the    */
/* level digits are plain <Text> and therefore never mirror.           */
/* ------------------------------------------------------------------ */

type Pt = { x: number; y: number };

const MAP_W = 330;
const MAP_H = 210;

/** Winding path nodes, bottom-start → top-end (mockup map-svg). */
const NODES: Pt[] = [
  { x: 36, y: 178 },
  { x: 52, y: 122 },
  { x: 165, y: 98 },
  { x: 240, y: 74 },
  { x: 292, y: 32 },
];

const mirrorX = (x: number): number => (I18nManager.isRTL ? MAP_W - x : x);

/** Catmull-Rom interpolation between p1 and p2. */
function catmullRom(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number): number =>
    0.5 *
    (2 * b +
      (c - a) * t +
      (2 * a - 5 * b + 4 * c - d) * t2 +
      (3 * b - a - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

/** Dots sampled along the smooth curve through the 5 nodes. */
const PATH_DOTS: Pt[] = (() => {
  const dots: Pt[] = [];
  for (let i = 0; i < NODES.length - 1; i++) {
    const p0 = NODES[Math.max(0, i - 1)];
    const p1 = NODES[i];
    const p2 = NODES[i + 1];
    const p3 = NODES[Math.min(NODES.length - 1, i + 2)];
    const span = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(3, Math.round(span / 13));
    for (let s = 1; s < steps; s++) {
      dots.push(catmullRom(p0, p1, p2, p3, s / steps));
    }
  }
  return dots;
})();

const NODE_SIZE = { done: 24, current: 28, future: 20 } as const;
const RING_SIZE = 44;

/* One mission row: emoji · label · progress (or a chunky Claim button). */
function MissionRow({
  mission,
  onClaim,
}: {
  mission: Mission;
  onClaim: (id: number) => void;
}) {
  const { t } = useTranslation();
  const done = mission.progress >= mission.target;
  const ratio = Math.min(1, mission.progress / mission.target);

  return (
    <View style={styles.missionRow}>
      <Text style={styles.missionEmoji}>{MISSION_LADDERS[mission.type].emoji}</Text>
      <View style={styles.missionBody}>
        <Text style={styles.missionLabel} numberOfLines={1}>
          {t(`turbo-road:missions.types.${mission.type}`, { n: mission.target })}
        </Text>
        <View style={styles.missionTrack}>
          <View style={[styles.missionFill, { width: `${ratio * 100}%` }]} />
        </View>
      </View>
      {done ? (
        <PressableButton
          label={`${t('turbo-road:missions.claim')} 🪙${mission.reward}`}
          accent="coral"
          onPress={() => onClaim(mission.id)}
          style={styles.claimBtn}
          textStyle={styles.claimText}
        />
      ) : (
        <Text style={styles.missionCount}>
          {mission.progress}/{mission.target}
        </Text>
      )}
    </View>
  );
}

export function StartScreen({
  level,
  totalStars,
  theme,
  playerEmoji,
  trim,
  walletCoins,
  control,
  missions,
  onClaimMission,
  onControlChange,
  onRace,
  onGarage,
}: StartScreenProps) {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.3] });

  // 5-node window around the current level (clamped so level 1 starts at 1).
  const firstLevel = Math.max(1, level - 2);
  const nodeLevels = [0, 1, 2, 3, 4].map((i) => firstLevel + i);
  const currentIdx = nodeLevels.indexOf(level);
  const currentNode = NODES[currentIdx];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Top row — start corner stays clear for the SDK BackButton. */}
      <View style={styles.topRow}>
        <View accessible accessibilityLabel={t('turbo-road:a11y.coins')}>
          <HudPill>
            <Text style={hudTextStyle}>🪙 {walletCoins}</Text>
          </HudPill>
        </View>
      </View>

      <Text style={styles.title}>{t('turbo-road:start.title')}</Text>

      <View style={styles.chipsRow}>
        <View style={[styles.chip, styles.levelChip]}>
          <Text style={[styles.chipText, styles.levelChipText]}>
            {t('turbo-road:start.level', { n: level })}
          </Text>
        </View>
        <View style={[styles.chip, styles.themeChip]}>
          <Text style={styles.chipText}>
            {theme.chipEmoji} {t(`turbo-road:themes.${theme.id}`)}
          </Text>
        </View>
      </View>

      {/* Road-trip map */}
      <View style={styles.mapWrap}>
        <View style={styles.map} accessibilityLabel={t('turbo-road:start.mapLabel')}>
          {PATH_DOTS.map((d, i) => (
            <View
              key={i}
              style={[styles.pathDot, { left: mirrorX(d.x) - 2, top: d.y - 2 }]}
            />
          ))}

          <Animated.View
            style={[
              styles.pulseRing,
              {
                left: mirrorX(currentNode.x) - RING_SIZE / 2,
                top: currentNode.y - RING_SIZE / 2,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          {NODES.map((p, i) => {
            const n = nodeLevels[i];
            const status = n < level ? 'done' : n === level ? 'current' : 'future';
            const size = NODE_SIZE[status];
            return (
              <View
                key={n}
                style={[
                  styles.node,
                  status === 'future' ? styles.nodeFuture : styles.nodeDone,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    left: mirrorX(p.x) - size / 2,
                    top: p.y - size / 2,
                  },
                ]}
              >
                {/* Plain <Text>: digits stay Western and never mirror. */}
                <Text
                  style={[
                    styles.nodeDigit,
                    status === 'future' && styles.nodeDigitFuture,
                  ]}
                >
                  {n}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Selected car on its trim pedestal + total stars */}
      <View style={styles.heroZone}>
        <View
          style={[
            styles.pedestal,
            SHADOWS.md,
            { backgroundColor: trim.tint, borderColor: trim.base },
          ]}
        >
          <Text style={styles.car}>{playerEmoji}</Text>
        </View>
        <View accessible accessibilityLabel={t('turbo-road:a11y.stars')}>
          <HudPill>
            <Star size={18} />
            <Text style={hudTextStyle}>{totalStars}</Text>
          </HudPill>
        </View>
      </View>

      {/* Missions — the come-back-tomorrow layer. */}
      {missions.length > 0 && (
        <View style={styles.missionsCard}>
          <Text style={styles.missionsTitle}>{t('turbo-road:missions.title')}</Text>
          {missions.map((m) => (
            <MissionRow key={m.id} mission={m} onClaim={onClaimMission} />
          ))}
        </View>
      )}

      {/* Steering mode — finger-follow (default) or tilt-the-phone. */}
      <View style={styles.controlsRow}>
        <Text style={styles.controlsLabel}>{t('turbo-road:controls.label')}</Text>
        <Chip
          label={`🖐️ ${t('turbo-road:controls.drag')}`}
          active={control === 'drag'}
          onPress={() => onControlChange('drag')}
        />
        <Chip
          label={`📱 ${t('turbo-road:controls.tilt')}`}
          active={control === 'tilt'}
          onPress={() => onControlChange('tilt')}
        />
      </View>

      <View style={styles.buttons}>
        <PressableButton
          label={t('turbo-road:start.race')}
          accent="coral"
          onPress={onRace}
          textStyle={styles.raceText}
        />
        <PressableButton
          label={t('turbo-road:start.garage')}
          variant="ghost"
          onPress={onGarage}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  // flexGrow keeps the portrait layout identical (map zone stretches);
  // in landscape the content scrolls instead of clipping.
  scrollContent: {
    flexGrow: 1,
  },
  missionsCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.card,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  missionsTitle: {
    fontFamily: FONTS.display,
    fontSize: 15,
    color: COLORS.inkSoft,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minHeight: 40,
  },
  missionEmoji: { fontSize: 20 },
  missionBody: { flex: 1, gap: 4 },
  missionLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.ink,
  },
  missionTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.line,
    overflow: 'hidden',
  },
  missionFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENTS.coral.base,
  },
  missionCount: {
    fontFamily: FONTS.display,
    fontSize: 13,
    color: COLORS.inkSoft,
  },
  claimBtn: { minWidth: 0 },
  claimText: { fontSize: 13 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
  },
  controlsLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 14,
    color: COLORS.inkSoft,
    marginEnd: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    minHeight: 56,
  },
  title: {
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.ink,
    marginTop: SPACING.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelChip: {
    backgroundColor: ACCENTS.coral.tint,
  },
  themeChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line2,
  },
  chipText: {
    fontFamily: FONTS.display,
    fontSize: 14,
    color: COLORS.ink,
  },
  levelChipText: {
    color: ACCENTS.coral.deep,
  },
  mapWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MAP_H,
  },
  map: {
    width: MAP_W,
    height: MAP_H,
    maxWidth: '100%',
  },
  pathDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.inkFaint,
  },
  pulseRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 3,
    borderColor: ACCENTS.coral.base,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: {
    backgroundColor: ACCENTS.coral.base,
  },
  nodeFuture: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.line2,
  },
  nodeDigit: {
    fontFamily: FONTS.display,
    fontSize: 12,
    color: COLORS.surface,
  },
  nodeDigitFuture: {
    color: COLORS.inkFaint,
  },
  heroZone: {
    alignItems: 'center',
    gap: SPACING.sm + SPACING.xs,
  },
  pedestal: {
    width: 200,
    height: 168,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  car: {
    fontSize: 96,
    lineHeight: 112,
  },
  buttons: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  raceText: {
    fontSize: 24,
  },
});
