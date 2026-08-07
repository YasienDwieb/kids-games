/* Candy Catch — motion runs entirely on the UI thread.
 *
 * Shape of the thing:
 *   · Every moving quantity (basket, each falling item) is a reanimated shared
 *     value, mapped to a transform by useAnimatedStyle. None of it is React
 *     state, so a fall never waits on a render.
 *   · One worklet (`step`) integrates positions, spins the wobble and tests
 *     collisions each frame, via the SDK's useGameLoop.
 *   · The item views are a fixed pool, mounted once. Catching an item hides it
 *     and frees its slot; spawning reuses one. Nothing mounts mid-level, so no
 *     view creation or image decode lands in the middle of a fall.
 *   · React only hears about real events — a catch, a miss, a level end — via
 *     runOnJS. Never once per frame. */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { I18nManager, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  makeMutable,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  approach,
  clamp,
  FONTS,
  levelsFromGenerator,
  ResumePrompt,
  useGameLoop,
  useLevels,
  useSound,
  useTranslation,
} from '@/sdk';
import { Basket } from './components/Basket';
import { FallingItem } from './components/FallingItem';
import { Hud } from './components/Hud';
import { StartOverlay, WinOverlay, LoseOverlay } from './components/Overlays';
import {
  BASKET_FOLLOW,
  BASKET_HEIGHT,
  BASKET_TILT_MAX,
  BASKET_WIDTH,
  BOMB,
  CHILI,
  GOLD_ITEM,
  GOOD_ITEMS,
  ITEM_FADE_MS,
  ITEM_POOL,
  ITEM_SIZE,
  SLOT_COOLDOWN,
  buildLevel,
  type ItemKind,
} from './constants';

const MAX_LIVES = 3;
const SOUND_INTENTS = ['pop', 'success', 'powerup', 'hit', 'wrong', 'win', 'transition'];

/** Per-item animation channels. Written by the loop, read by useAnimatedStyle. */
type Slot = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rot: SharedValue<number>;
  alpha: SharedValue<number>;
  speed: SharedValue<number>;
  phase: SharedValue<number>;
  /** 1 while falling; 0 once caught, missed, or unused. */
  active: SharedValue<number>;
  /** Seconds before the slot may be respawned (lets the fade-out finish). */
  cooldown: SharedValue<number>;
  /** Identifies the current occupant, so a stale catch event can be ignored. */
  uid: SharedValue<number>;
};

type SlotContent = { uid: number; emoji: string; kind: ItemKind; points: number };

type Pop = { id: number; x: number; y: number; text: string; color: string };

let nextId = 1;

const makeSlot = (): Slot => ({
  x: makeMutable(0),
  y: makeMutable(-200),
  rot: makeMutable(0),
  alpha: makeMutable(0),
  speed: makeMutable(0),
  phase: makeMutable(0),
  active: makeMutable(0),
  cooldown: makeMutable(0),
  uid: makeMutable(0),
});

export default function CandyCatchGame() {
  const { play, prewarm } = useSound();
  const { t } = useTranslation();
  const source = useMemo(() => levelsFromGenerator(buildLevel), []);
  const { status, level, data, start, startOver, advance } = useLevels({
    gameId: 'candy-catch',
    source,
  });

  const [overlay, setOverlay] = useState<'start' | 'win' | 'lose' | 'none'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [pops, setPops] = useState<Pop[]>([]);
  const [contents, setContents] = useState<(SlotContent | null)[]>(() =>
    Array(ITEM_POOL).fill(null),
  );

  // Mirrors of state the JS-side event handlers read synchronously.
  const contentsRef = useRef<(SlotContent | null)[]>(Array(ITEM_POOL).fill(null));
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);

  // Animation channels — created once, never re-created.
  const slots = useMemo(() => Array.from({ length: ITEM_POOL }, makeSlot), []);
  const basketX = useSharedValue(0);
  const basketTarget = useSharedValue(0);
  const basketTilt = useSharedValue(0);
  const areaW = useSharedValue(0);
  const areaH = useSharedValue(0);
  const spawnAcc = useSharedValue(0);
  const spawnEvery = useSharedValue(data.spawnInterval);
  const fallSpeed = useSharedValue(data.fallSpeed);

  useEffect(() => {
    spawnEvery.value = data.spawnInterval;
    fallSpeed.value = data.fallSpeed;
  }, [data, spawnEvery, fallSpeed]);

  useEffect(() => {
    prewarm(SOUND_INTENTS);
  }, [prewarm]);

  const clearField = useCallback(() => {
    for (const s of slots) {
      s.active.value = 0;
      s.alpha.value = 0;
      s.cooldown.value = 0;
      s.y.value = -200;
    }
    contentsRef.current = Array(ITEM_POOL).fill(null);
    setContents(contentsRef.current);
    spawnAcc.value = 0;
  }, [slots, spawnAcc]);

  const resetLevel = useCallback(() => {
    clearField();
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    setScore(0);
    setLives(MAX_LIVES);
    setPops([]);
    basketX.value = areaW.value / 2 - BASKET_WIDTH / 2;
    basketTarget.value = basketX.value;
  }, [clearField, basketX, basketTarget, areaW]);

  useEffect(() => {
    resetLevel();
  }, [level, resetLevel]);

  const addPop = useCallback((x: number, y: number, text: string, color: string) => {
    const id = nextId++;
    setPops((p) => [...p, { id, x, y, text, color }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 850);
  }, []);

  /** Fill a free pool slot with a fresh item. Called ~once per spawn interval. */
  const spawn = useCallback(() => {
    const width = areaW.value;
    if (width <= 0) return;
    const index = slots.findIndex((s) => s.active.value === 0 && s.cooldown.value <= 0);
    if (index < 0) return; // pool saturated — skip this beat rather than grow

    const roll = Math.random();
    let kind: ItemKind;
    let emoji: string;
    let points = 0;
    if (roll < data.goldChance) {
      kind = 'gold';
      emoji = GOLD_ITEM.emoji;
      points = GOLD_ITEM.points;
    } else if (roll < data.goldChance + data.hazardChance) {
      const bomb = Math.random() < 0.5;
      kind = bomb ? 'bomb' : 'bad';
      emoji = bomb ? BOMB.emoji : CHILI.emoji;
    } else {
      kind = 'good';
      const g = GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
      emoji = g.emoji;
      points = g.points;
    }

    const uid = nextId++;
    const slot = slots[index];
    slot.x.value = 16 + Math.random() * Math.max(0, width - ITEM_SIZE - 32);
    slot.y.value = -ITEM_SIZE;
    slot.rot.value = 0;
    slot.alpha.value = 1;
    slot.speed.value = fallSpeed.value * (0.85 + Math.random() * 0.3);
    slot.phase.value = Math.random() * Math.PI * 2;
    slot.uid.value = uid;
    slot.active.value = 1;

    const next = contentsRef.current.slice();
    next[index] = { uid, emoji, kind, points };
    contentsRef.current = next;
    setContents(next);
  }, [slots, data, areaW, fallSpeed]);

  /** Retire a slot's occupant and let its view fade out. */
  const retire = useCallback(
    (index: number) => {
      const slot = slots[index];
      slot.alpha.value = withTiming(0, { duration: ITEM_FADE_MS });
      slot.cooldown.value = SLOT_COOLDOWN;
    },
    [slots],
  );

  const onCaught = useCallback(
    (index: number, uid: number) => {
      const item = contentsRef.current[index];
      if (!item || item.uid !== uid) return; // stale event — slot already reused
      retire(index);

      const slot = slots[index];
      const x = slot.x.value;
      const y = slot.y.value;

      if (item.kind === 'bomb' || item.kind === 'bad') {
        play(item.kind === 'bomb' ? 'hit' : 'wrong');
        livesRef.current -= 1;
        setLives(livesRef.current);
        addPop(x, y, item.kind === 'bomb' ? '💥' : '🌶️', '#E0604F');
        if (livesRef.current <= 0) setOverlay('lose'); // the hit sting already played
        return;
      }

      play(item.kind === 'gold' ? 'powerup' : 'pop');
      scoreRef.current += item.points;
      setScore(scoreRef.current);
      addPop(x, y, `+${item.points}`, '#E66FA0');
      if (scoreRef.current >= data.target) {
        play('win');
        setOverlay('win');
      }
    },
    [slots, play, addPop, retire, data.target],
  );

  const onMissed = useCallback(
    (index: number, uid: number) => {
      const item = contentsRef.current[index];
      if (!item || item.uid !== uid) return;
      retire(index);
    },
    [retire],
  );

  /* ---- the frame loop: UI thread, no React, no bridge ---- */
  const step = useCallback(
    (dt: number, elapsed: number) => {
      'worklet';
      // Basket eases toward the finger. Exponential smoothing keeps the feel
      // identical on 60Hz and 120Hz screens.
      const previous = basketX.value;
      basketX.value = approach(previous, basketTarget.value, BASKET_FOLLOW, dt);
      basketTilt.value = clamp(
        (basketX.value - previous) * 0.9,
        -BASKET_TILT_MAX,
        BASKET_TILT_MAX,
      );

      const height = areaH.value;
      if (height <= 0) return;

      spawnAcc.value += dt * 1000;
      if (spawnAcc.value >= spawnEvery.value) {
        spawnAcc.value = 0;
        runOnJS(spawn)();
      }

      const catchTop = height - BASKET_HEIGHT - 8;
      const catchBottom = height - 8;

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.cooldown.value > 0) s.cooldown.value -= dt;
        if (s.active.value === 0) continue;

        s.y.value += s.speed.value * dt;
        s.rot.value = Math.sin(elapsed * 2.4 + s.phase.value) * 9;

        if (s.y.value > height + 60) {
          s.active.value = 0;
          runOnJS(onMissed)(i, s.uid.value);
          continue;
        }

        const cx = s.x.value + ITEM_SIZE / 2;
        if (
          cx > basketX.value - 8 &&
          cx < basketX.value + BASKET_WIDTH + 8 &&
          s.y.value > catchTop - 14 &&
          s.y.value < catchBottom
        ) {
          s.active.value = 0;
          runOnJS(onCaught)(i, s.uid.value);
        }
      }
    },
    [
      slots,
      basketX,
      basketTarget,
      basketTilt,
      areaH,
      spawnAcc,
      spawnEvery,
      spawn,
      onCaught,
      onMissed,
    ],
  );

  useGameLoop(step, { active: status === 'playing' && overlay === 'none' });

  /* ---- input: the gesture writes the target straight from the UI thread ---- */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          'worklet';
          basketTarget.value = clamp(
            e.x - BASKET_WIDTH / 2,
            0,
            Math.max(0, areaW.value - BASKET_WIDTH),
          );
        })
        .onChange((e) => {
          'worklet';
          basketTarget.value = clamp(
            e.x - BASKET_WIDTH / 2,
            0,
            Math.max(0, areaW.value - BASKET_WIDTH),
          );
        }),
    [basketTarget, areaW],
  );

  const basketStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: basketX.value }, { rotate: `${basketTilt.value}deg` }],
  }));

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      const first = areaW.value === 0;
      areaW.value = width;
      areaH.value = height;
      if (first) {
        basketX.value = width / 2 - BASKET_WIDTH / 2;
        basketTarget.value = basketX.value;
      }
    },
    [areaW, areaH, basketX, basketTarget],
  );

  const handleStart = useCallback(() => {
    play('transition');
    setOverlay('none');
  }, [play]);

  const handleNext = useCallback(() => {
    play('transition');
    clearField();
    setOverlay('none');
    advance(0);
  }, [play, advance, clearField]);

  const handleRetry = useCallback(() => {
    play('transition');
    setOverlay('none');
    resetLevel();
  }, [play, resetLevel]);

  if (status === 'loading') return <View style={styles.root} />;
  if (status === 'resumable') {
    return (
      <View style={styles.root}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.dots}>
        {DOTS.map((d, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: d.s / 2 },
            ]}
          />
        ))}
      </View>

      {/* Playfield — pinned LTR so coords never mirror under RTL.
          onLayout belongs HERE, not on the root: the root view is also rendered
          by the `status === 'loading'` branch above (without onLayout), so React
          reuses that node and on web the handler attached afterwards never gets
          a size. This view only exists once we're playing, so it mounts with the
          handler already on it. It is also the view Pan coordinates are relative
          to, so measuring it keeps `e.x` and `areaW` in one coordinate space. */}
      <GestureDetector gesture={pan}>
        <View style={[styles.field, I18nManager.isRTL && styles.ltr]} onLayout={onLayout}>
          {slots.map((slot, i) => (
            <PooledItem key={i} slot={slot} content={contents[i]} />
          ))}

          {pops.map((p) => (
            <ScorePop key={p.id} x={p.x} y={p.y} text={p.text} color={p.color} />
          ))}

          <Animated.View pointerEvents="none" style={[styles.basketWrap, basketStyle]}>
            <Basket />
          </Animated.View>
        </View>
      </GestureDetector>

      <Hud level={level} score={score} target={data.target} lives={lives} />

      {overlay === 'start' && <StartOverlay onStart={handleStart} />}
      {overlay === 'win' && <WinOverlay score={score} onNext={handleNext} />}
      {overlay === 'lose' && <LoseOverlay onRetry={handleRetry} />}
    </View>
  );
}

/** One reused item view. Memoized so a spawn re-renders only its own slot. */
const PooledItem = memo(function PooledItem({
  slot,
  content,
}: {
  slot: Slot;
  content: SlotContent | null;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: slot.alpha.value,
    transform: [
      { translateX: slot.x.value },
      { translateY: slot.y.value },
      { rotate: `${slot.rot.value}deg` },
    ],
  }));

  if (!content) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.item, style]}>
      <FallingItem emoji={content.emoji} kind={content.kind} />
    </Animated.View>
  );
});

/** "+5" floating up and fading — animated on the UI thread, like everything else. */
function ScorePop({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 850 });
  }, [rise]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - rise.value,
    transform: [{ translateY: -34 * rise.value }, { scale: 1 + 0.25 * rise.value }],
  }));

  return (
    <Animated.Text style={[styles.pop, { left: x, top: y, color }, style]}>{text}</Animated.Text>
  );
}

// Static soft background dots
const DOTS = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 37) % 100) * 4,
  y: ((i * 53) % 100) * 6,
  s: 6 + ((i * 7) % 8),
}));

const styles = StyleSheet.create({
  root: { flex: 1 },
  dots: { ...StyleSheet.absoluteFillObject },
  dot: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.6)' },
  field: { flex: 1 },
  ltr: { direction: 'ltr' as const },
  item: { position: 'absolute', left: 0, top: 0 },
  pop: {
    position: 'absolute',
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
    zIndex: 6,
  },
  basketWrap: {
    position: 'absolute',
    left: 0,
    bottom: 4,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
  },
});
