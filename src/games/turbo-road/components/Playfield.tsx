import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import {
  BANK_MAX_DEG,
  DASH_GAP,
  DASH_LEN,
  DECOR_BANDS,
  DECOR_SPACING,
  ENTITY_EMOJI,
  PLAYER_Y_RATIO,
  ROAD_WIDTH_RATIO,
  VIEW_DIST,
} from '../constants';
import type { PlayfieldProps } from '../types';

/* Sky strip height as a ratio of the playfield height. */
const SKY_RATIO = 0.12;
const DASH_PERIOD = DASH_LEN + DASH_GAP;

/* The steering hint fades out shortly into the race. */
const HINT_UNTIL_PROGRESS = 0.05;

// Race playfield, built for 60 fps on real devices: every per-frame motion
// (world scroll, dashes, roadside, player, rivals) is an Animated transform
// on views that are rendered ONCE per layout/level — the race loop writes
// `anim.*` values and nothing re-renders. React only updates on sparse `ui`
// changes (countdown beats, coins, boost state, consumed entities).
export function Playfield({
  theme,
  level,
  ui,
  anim,
  playerEmoji,
  trim,
  onSteerTo,
}: PlayfieldProps) {
  const { t } = useTranslation();
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Geometry + callback refs so the (created-once) PanResponder closures
  // always read fresh values. Steering uses page coordinates against the
  // measured surface origin — locationX is unreliable during fast drags.
  const geom = useRef({ originX: 0, roadLeft: 0, laneW: 1 });
  const rootRef = useRef<View>(null);
  const steerRef = useRef(onSteerTo);
  steerRef.current = onSteerTo;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { originX, roadLeft, laneW } = geom.current;
        steerRef.current((e.nativeEvent.pageX - originX - roadLeft) / laneW - 0.5);
      },
      onPanResponderMove: (e) => {
        const { originX, roadLeft, laneW } = geom.current;
        steerRef.current((e.nativeEvent.pageX - originX - roadLeft) / laneW - 0.5);
      },
    }),
  ).current;

  const cloud1 = useRef(new Animated.Value(0)).current;
  const cloud2 = useRef(new Animated.Value(0)).current;
  const boostPulse = useRef(new Animated.Value(0)).current;

  // Ambient loops: clouds drift across the sky, boost pads pulse.
  useEffect(() => {
    if (size.w === 0) return;
    const drift1 = Animated.loop(
      Animated.timing(cloud1, {
        toValue: 1,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const drift2 = Animated.loop(
      Animated.timing(cloud2, {
        toValue: 1,
        duration: 38000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(boostPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(boostPulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    drift1.start();
    drift2.start();
    pulse.start();
    return () => {
      drift1.stop();
      drift2.stop();
      pulse.stop();
    };
  }, [size.w, cloud1, cloud2, boostPulse]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
    // Page origin of the playfield, for page-coordinate steering.
    rootRef.current?.measureInWindow((x) => {
      geom.current.originX = x;
    });
  };

  const W = size.w;
  const H = size.h;
  const skyH = H * SKY_RATIO;
  /** Pixels per world unit (playfield height ↔ VIEW_DIST). */
  const scale = H / VIEW_DIST;
  // Cap the road by height so landscape keeps sane lane proportions.
  const roadW = Math.min(W * ROAD_WIDTH_RATIO, H * 0.92);
  const roadLeft = (W - roadW) / 2;
  const laneW = roadW / 3;
  geom.current.roadLeft = roadLeft;
  geom.current.laneW = laneW;
  const playerY = PLAYER_Y_RATIO * H;

  /* ================= per-layout static pieces + interpolations =========== */

  const cloud1X = useMemo(
    () => cloud1.interpolate({ inputRange: [0, 1], outputRange: [-64, W + 64] }),
    [cloud1, W],
  );
  const cloud2X = useMemo(
    () => cloud2.interpolate({ inputRange: [0, 1], outputRange: [W + 48, -48] }),
    [cloud2, W],
  );
  const boostScale = useMemo(
    () => boostPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
    [boostPulse],
  );

  // World scroll: dist (world units) → px. Linear, extrapolates past the race.
  const worldShift = useMemo(
    () => anim.dist.interpolate({ inputRange: [0, VIEW_DIST], outputRange: [0, H] }),
    [anim.dist, H],
  );
  const dashShift = useMemo(
    () =>
      anim.dashPhase.interpolate({
        inputRange: [0, DASH_PERIOD],
        outputRange: [0, DASH_PERIOD * scale],
      }),
    [anim.dashPhase, scale],
  );
  const decorShift = useMemo(
    () =>
      anim.decorPhase.interpolate({
        inputRange: [0, DECOR_BANDS * DECOR_SPACING],
        outputRange: [0, DECOR_BANDS * DECOR_SPACING * scale],
      }),
    [anim.decorPhase, scale],
  );
  const playerShift = useMemo(
    () =>
      anim.playerLaneX.interpolate({
        inputRange: [0, 2],
        outputRange: [laneW * 0.5 - 34, laneW * 2.5 - 34],
      }),
    [anim.playerLaneX, laneW],
  );
  const shakeShift = useMemo(
    () => anim.shake.interpolate({ inputRange: [-1, 1], outputRange: [-laneW, laneW] }),
    [anim.shake, laneW],
  );
  const bankDeg = useMemo(
    () =>
      anim.bank.interpolate({
        inputRange: [-BANK_MAX_DEG, BANK_MAX_DEG],
        outputRange: [`-${BANK_MAX_DEG}deg`, `${BANK_MAX_DEG}deg`],
      }),
    [anim.bank],
  );
  const rivalTransforms = useMemo(
    () =>
      anim.rivals.map((r) => ({
        x: r.laneX.interpolate({
          inputRange: [0, 2],
          outputRange: [laneW * 0.5 - 28, laneW * 2.5 - 28],
        }),
        y: r.gap.interpolate({ inputRange: [0, VIEW_DIST], outputRange: [0, -H] }),
      })),
    [anim.rivals, laneW, H],
  );

  // Repeating dash strip (rendered once): translated by dashShift, the
  // pattern is identical after each DASH_PERIOD so the wrap is seamless.
  const dashYs = useMemo(() => {
    if (H === 0) return [];
    const periodPx = DASH_PERIOD * scale;
    const count = Math.ceil(H / periodPx) + 2;
    return Array.from({ length: count }, (_, k) => (k - 1) * periodPx);
  }, [H, scale]);

  // Repeating roadside strip (rendered once): DECOR_BANDS-periodic pattern.
  const decorBands = useMemo(() => {
    if (H === 0) return [];
    const bandPx = DECOR_SPACING * scale;
    const count = DECOR_BANDS + Math.ceil(H / bandPx) + 1;
    const len = theme.decorations.length;
    return Array.from({ length: count }, (_, k) => ({
      y: H - k * bandPx,
      emoji: theme.decorations[k % len],
      leftSide: k % 2 === 0,
      big: k % 3 === 0,
    }));
  }, [H, scale, theme]);

  // Entities render ONCE per level at fixed world positions inside the
  // scrolling world layer; consumed ones are hidden via the sparse ui state.
  const consumedSet = useMemo(() => new Set(ui.consumedIds), [ui.consumedIds]);
  const finishTop = playerY - level.raceLength * scale - 16;

  const finishCols = useMemo(
    () => (roadW > 0 ? Array.from({ length: Math.ceil(roadW / 8) }, (_, i) => i) : []),
    [roadW],
  );

  if (H === 0) {
    return (
      <View
        ref={rootRef}
        style={[styles.root, { backgroundColor: theme.ground }]}
        onLayout={onLayout}
      />
    );
  }

  return (
    <View
      ref={rootRef}
      style={[styles.root, { backgroundColor: theme.ground }]}
      onLayout={onLayout}
    >
      {/* ---- roadside strip (one transform per frame) ---- */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: decorShift }] }]}
        pointerEvents="none"
      >
        {decorBands.map((b, k) => (
          <View key={k}>
            <Text
              style={[
                styles.decor,
                b.big ? styles.decorBig : styles.decorSmall,
                b.leftSide ? styles.onLeft : styles.onRight,
                { top: b.y - 16 },
              ]}
            >
              {b.emoji}
            </Text>
            <View
              style={[
                styles.patch,
                { backgroundColor: theme.groundPatch },
                b.leftSide ? styles.onRight : styles.onLeft,
                { top: b.y + 24 },
              ]}
            />
          </View>
        ))}
      </Animated.View>

      {/* ---- road ---- */}
      <View
        style={[
          styles.road,
          { left: roadLeft, width: roadW, backgroundColor: theme.road, borderColor: theme.dash },
        ]}
        pointerEvents="none"
      >
        {/* lane separators: static dash strips, scrolled by one transform */}
        {[laneW - 4, laneW * 2 - 4].map((x, sepIdx) => (
          <View key={sepIdx} style={[styles.sep, { left: x }]}>
            <Animated.View
              style={[StyleSheet.absoluteFill, { transform: [{ translateY: dashShift }] }]}
            >
              {dashYs.map((y, i) => (
                <View
                  key={i}
                  style={[
                    styles.dash,
                    {
                      top: y,
                      height: DASH_LEN * scale,
                      backgroundColor: sepIdx === 0 ? theme.dash : COLORS.gold,
                    },
                  ]}
                />
              ))}
            </Animated.View>
          </View>
        ))}

        {/* world layer: all level entities + the finish line, fixed world
            positions, scrolled by a single transform */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: worldShift }] }]}
        >
          {/* checkered finish line at dist = raceLength */}
          <View style={[styles.finish, { top: finishTop }]}>
            {[0, 1].map((row) => (
              <View key={row} style={styles.finishRow}>
                {finishCols.map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.finishCell,
                      { backgroundColor: (i + row) % 2 === 0 ? COLORS.ink : theme.dash },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>

          {level.entities.map((e) => {
            if (consumedSet.has(e.id)) return null;
            const x = laneW * (e.lane + 0.5);
            const y = playerY - e.dist * scale;
            if (e.kind === 'boost') {
              return (
                <Animated.View
                  key={e.id}
                  style={[
                    styles.boostPad,
                    { left: x - 24, top: y - 28, transform: [{ scale: boostScale }] },
                  ]}
                >
                  <Text style={styles.boostGlyph}>⚡</Text>
                </Animated.View>
              );
            }
            return (
              <View key={e.id} style={[styles.entityBox, { left: x - 24, top: y - 24 }]}>
                <Text style={e.kind === 'coin' ? styles.coin : styles.obstacle}>
                  {ENTITY_EMOJI[e.kind]}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* rivals: their own lane/gap channels (they glide, never teleport) */}
        {level.rivals.map((r, i) => {
          const tr = rivalTransforms[i];
          if (!tr) return null;
          return (
            <Animated.View
              key={r.id}
              style={[
                styles.rivalBox,
                {
                  top: playerY - 28,
                  transform: [{ translateX: tr.x }, { translateY: tr.y }],
                },
              ]}
            >
              <Text style={styles.rivalCar}>{r.emoji}</Text>
            </Animated.View>
          );
        })}

        {/* player car: spring-followed laneX + impact shake + banking */}
        <Animated.View
          style={[
            styles.playerBox,
            { top: playerY - 34 },
            {
              transform: [
                { translateX: playerShift },
                { translateX: shakeShift },
                { rotate: bankDeg },
              ],
            },
            ui.slowActive && styles.playerSlow,
          ]}
        >
          <View
            style={[
              styles.playerGlow,
              { backgroundColor: trim.tint, borderColor: trim.base },
              ui.boostActive && { backgroundColor: trim.base, borderColor: COLORS.gold },
            ]}
          />
          {ui.boostActive && (
            <>
              <View style={[styles.streak, styles.streakLeft, { backgroundColor: trim.base }]} />
              <View style={[styles.streak, styles.streakRight, { backgroundColor: trim.base }]} />
            </>
          )}
          <Text style={styles.playerCar}>{playerEmoji}</Text>
        </Animated.View>
      </View>

      {/* ---- sky strip (covers the horizon: items emerge from beneath it) ---- */}
      <View
        style={[styles.sky, { height: skyH, backgroundColor: theme.sky }]}
        pointerEvents="none"
      >
        <Text style={styles.sun}>☀️</Text>
        <Animated.Text style={[styles.cloud, styles.cloud1, { transform: [{ translateX: cloud1X }] }]}>
          ☁️
        </Animated.Text>
        <Animated.Text style={[styles.cloud, styles.cloud2, { transform: [{ translateX: cloud2X }] }]}>
          ☁️
        </Animated.Text>
      </View>

      {/* ---- countdown ---- */}
      {ui.countdown !== undefined && (
        <View style={styles.countWrap} pointerEvents="none">
          <View style={styles.countBubble}>
            <Text style={styles.countText}>
              {ui.countdown === 'go' ? t('turbo-road:countdown.go') : ui.countdown}
            </Text>
          </View>
        </View>
      )}

      {/* ---- steering: full-surface finger-follow drag layer ---- */}
      <View
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('turbo-road:a11y.steer')}
        {...pan.panHandlers}
      >
        {ui.progress < HINT_UNTIL_PROGRESS && (
          <View style={styles.hintWrap} pointerEvents="none">
            <Text style={styles.steerHint}>‹ 🖐️ ›</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pinned LTR so lane math / absolute coords never mirror under RTL.
  root: { flex: 1, overflow: 'hidden', direction: 'ltr' },

  /* roadside */
  decor: { position: 'absolute', lineHeight: 34 },
  decorBig: { fontSize: 30 },
  decorSmall: { fontSize: 22 },
  onLeft: { left: 10 },
  onRight: { right: 10 },
  patch: {
    position: 'absolute',
    width: 44,
    height: 24,
    borderRadius: BORDER_RADIUS.pill,
    opacity: 0.38,
  },

  /* road */
  road: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
  },
  sep: { position: 'absolute', top: 0, bottom: 0, width: 8, overflow: 'hidden' },
  dash: {
    position: 'absolute',
    left: 0,
    width: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  finish: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 16,
    opacity: 0.85,
    overflow: 'hidden',
  },
  finishRow: { flexDirection: 'row', height: 8 },
  finishCell: { width: 8, height: 8 },

  /* entities */
  entityBox: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coin: { fontSize: 24 },
  obstacle: { fontSize: 30 },
  boostPad: {
    position: 'absolute',
    width: 48,
    height: 56,
    borderRadius: BORDER_RADIUS.soft,
    backgroundColor: ACCENTS.coral.tint,
    borderWidth: 2,
    borderColor: ACCENTS.coral.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boostGlyph: { fontSize: 22 },

  /* cars (emoji face left → rotate 90° to face up) */
  rivalBox: {
    position: 'absolute',
    left: 0,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rivalCar: { fontSize: 40, transform: [{ rotate: '90deg' }] },
  playerBox: {
    position: 'absolute',
    left: 0,
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSlow: { opacity: 0.55 },
  playerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 3,
    ...SHADOWS.sm,
  },
  playerCar: { fontSize: 44, transform: [{ rotate: '90deg' }] },
  streak: {
    position: 'absolute',
    bottom: -10,
    width: 5,
    height: 18,
    borderRadius: 3,
    opacity: 0.85,
  },
  streakLeft: { left: 16 },
  streakRight: { right: 16 },

  /* sky */
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    overflow: 'hidden',
  },
  sun: { position: 'absolute', top: 8, right: 36, fontSize: 32 },
  cloud: { position: 'absolute', left: 0 },
  cloud1: { top: 10, fontSize: 26, opacity: 0.95 },
  cloud2: { top: 38, fontSize: 20, opacity: 0.7 },

  /* countdown */
  countWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBubble: {
    minWidth: 140,
    height: 140,
    borderRadius: 70,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  countText: {
    fontFamily: FONTS.display,
    fontSize: 64,
    lineHeight: 76,
    color: COLORS.surface,
  },

  /* steering hint (shows only at the start of a race) */
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.xl,
    alignItems: 'center',
  },
  steerHint: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.ink,
    opacity: 0.3,
  },
});
