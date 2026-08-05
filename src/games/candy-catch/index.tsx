import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  I18nManager,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useSound,
  useLevels,
  levelsFromGenerator,
  ResumePrompt,
  useTranslation,
  FONTS,
} from '@/sdk';
import { Basket } from './components/Basket';
import { FallingItem } from './components/FallingItem';
import { Hud } from './components/Hud';
import { StartOverlay, WinOverlay, LoseOverlay } from './components/Overlays';
import {
  BOMB,
  BASKET_HEIGHT,
  BASKET_WIDTH,
  CHILI,
  GOLD_ITEM,
  GOOD_ITEMS,
  buildLevel,
  type ItemKind,
} from './constants';

const MAX_LIVES = 3;
const GOOD_COUNTS: { [k: number]: number } = {};

interface ItemData {
  id: number;
  x: number;
  y: number; // live value (ref-driven)
  animY: Animated.Value;
  wobble: Animated.Value;
  speed: number;
  kind: ItemKind;
  emoji: string;
  points: number;
  done: boolean;
}

interface Pop {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

let nextId = 1;

export default function CandyCatchGame() {
  const { play } = useSound();
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

  const [area, setArea] = useState({ width: 0, height: 0 });
  const itemsRef = useRef<ItemData[]>([]);
  const [, setTick] = useState(0); // force re-render for item add/remove
  const basketX = useRef(0); // basket left edge
  const running = useRef(false);
  const spawnAcc = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastTs = useRef(0);

  // live mirrors for the loop
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const targetRef = useRef(data.target);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  useEffect(() => {
    targetRef.current = data.target;
  }, [data]);

  const resetLevel = useCallback(() => {
    itemsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    setScore(0);
    setLives(MAX_LIVES);
    setPops([]);
    spawnAcc.current = 0;
    basketX.current = area.width / 2 - BASKET_WIDTH / 2;
  }, [area.width]);

  const addPop = useCallback((x: number, y: number, text: string, color: string) => {
    const id = nextId++;
    setPops((p) => [...p, { id, x, y, text, color }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 900);
  }, []);

  const spawnItem = useCallback(() => {
    if (area.width <= 0) return;
    const roll = Math.random();
    let kind: ItemKind;
    let emoji: string;
    let points = 0;
    if (roll < data.goldChance) {
      kind = 'gold';
      emoji = GOLD_ITEM.emoji;
      points = GOLD_ITEM.points;
    } else if (roll < data.goldChance + data.hazardChance) {
      if (Math.random() < 0.5) {
        kind = 'bomb';
        emoji = BOMB.emoji;
      } else {
        kind = 'bad';
        emoji = CHILI.emoji;
      }
    } else {
      kind = 'good';
      const idx = Math.floor(Math.random() * GOOD_ITEMS.length);
      GOOD_COUNTS[idx] = (GOOD_COUNTS[idx] ?? 0) + 1;
      const g = GOOD_ITEMS[idx];
      emoji = g.emoji;
      points = g.points;
    }
    const x = 20 + Math.random() * Math.max(0, area.width - BASKET_WIDTH - 20);
    const item: ItemData = {
      id: nextId++,
      x,
      y: -50,
      animY: new Animated.Value(-50),
      wobble: new Animated.Value(0),
      speed: data.fallSpeed * (0.85 + Math.random() * 0.3),
      kind,
      emoji,
      points,
      done: false,
    };
    itemsRef.current.push(item);
    // gentle wobble loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(item.wobble, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(item.wobble, { toValue: -1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
    setTick((t) => t + 1);
  }, [area.width, data]);

  const handleCatch = useCallback(
    (item: ItemData) => {
      item.done = true;
      if (item.kind === 'bomb') {
        play('hit');
        livesRef.current -= 1;
        setLives(livesRef.current);
        addPop(item.x, item.y, '💥', '#E0604F');
      } else if (item.kind === 'bad') {
        play('wrong');
        livesRef.current -= 1;
        setLives(livesRef.current);
        addPop(item.x, item.y, t('candy-catch:lose.title'), '#E0604F');
      } else {
        play(item.kind === 'gold' ? 'powerup' : 'pop');
        scoreRef.current += item.points;
        setScore(scoreRef.current);
        addPop(item.x, item.y, `+${item.points}`, '#E66FA0');
      }
    },
    [play, addPop, t],
  );

  const finishLevel = useCallback(() => {
    running.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    play('win');
    setOverlay('win');
  }, [play]);

  const failLevel = useCallback(() => {
    running.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    play('wrong');
    setOverlay('lose');
  }, [play]);

  const step = useCallback(
    (ts: number) => {
      const dt = lastTs.current ? (ts - lastTs.current) / 1000 : 0;
      lastTs.current = ts;
      if (running.current && area.height > 0) {
        spawnAcc.current += dt * 1000;
        if (spawnAcc.current >= data.spawnInterval) {
          spawnAcc.current = 0;
          spawnItem();
        }
        const catchTop = area.height - BASKET_HEIGHT - 8;
        const catchBottom = area.height - 8;
        let changed = false;
        for (const item of itemsRef.current) {
          if (item.done) continue;
          item.y += item.speed * dt;
          item.animY.setValue(item.y);
          if (item.y > area.height + 60) {
            item.done = true;
            changed = true;
            continue;
          }
          const cx = item.x + 28; // item center
          if (
            cx > basketX.current - 8 &&
            cx < basketX.current + BASKET_WIDTH + 8 &&
            item.y > catchTop - 14 &&
            item.y < catchBottom
          ) {
            handleCatch(item);
            changed = true;
          }
        }
        if (changed) {
          itemsRef.current = itemsRef.current.filter((i) => !i.done);
          setTick((t) => t + 1);
        }
        if (scoreRef.current >= targetRef.current) {
          finishLevel();
          return;
        }
        if (livesRef.current <= 0) {
          failLevel();
          return;
        }
      }
      rafId.current = requestAnimationFrame(step);
    },
    [area.height, data, spawnItem, handleCatch, finishLevel, failLevel],
  );

  // drive the loop based on overlay + status
  useEffect(() => {
    const active = status === 'playing' && overlay === 'none';
    if (active && !running.current) {
      running.current = true;
      lastTs.current = 0;
      rafId.current = requestAnimationFrame(step);
    } else if (!active && running.current) {
      running.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    return () => {
      running.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = null;
    };
  }, [status, overlay, step]);

  // reset level state whenever the level changes
  useEffect(() => {
    resetLevel();
  }, [level, resetLevel]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea({ width, height });
  }, []);

  const moveBasket = useCallback((gx: number) => {
    const max = Math.max(0, area.width - BASKET_WIDTH);
    basketX.current = Math.max(0, Math.min(max, gx - BASKET_WIDTH / 2));
  }, [area.width]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) =>
          moveBasket(e.nativeEvent.locationX),
        onPanResponderMove: (e: GestureResponderEvent) =>
          moveBasket(e.nativeEvent.locationX),
      }),
    [moveBasket],
  );

  const handleStart = useCallback(() => {
    play('transition');
    setOverlay('none');
  }, [play]);

  const handleNext = useCallback(() => {
    play('transition');
    setOverlay('none');
    advance(0);
  }, [play, advance]);

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
    <View style={styles.root} onLayout={onLayout}>
      {/* soft sky dots */}
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

      {/* playfield — pinned LTR so coords never mirror under RTL */}
      <View
        style={[styles.field, I18nManager.isRTL && styles.ltr]}
        {...responder.panHandlers}
      >
        {itemsRef.current.map((item) => (
          <Animated.View
            key={item.id}
            pointerEvents="none"
            style={[
              styles.item,
              {
                left: item.x,
                transform: [
                  { translateY: item.animY },
                  {
                    rotate: item.wobble.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-9deg', '9deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <FallingItem emoji={item.emoji} kind={item.kind} />
          </Animated.View>
        ))}

        {/* score pops */}
        {pops.map((p) => (
          <Text key={p.id} style={[styles.pop, { left: p.x, top: p.y, color: p.color }]}>
            {p.text}
          </Text>
        ))}

        {/* basket */}
        <View pointerEvents="none" style={[styles.basketWrap, { left: basketX.current }]}>
          <Basket />
        </View>
      </View>

      <Hud level={level} score={score} target={data.target} lives={lives} />

      {overlay === 'start' && <StartOverlay onStart={handleStart} />}
      {overlay === 'win' && <WinOverlay score={score} onNext={handleNext} />}
      {overlay === 'lose' && <LoseOverlay onRetry={handleRetry} />}
    </View>
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
  item: { position: 'absolute', top: 0 },
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
    bottom: 4,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
  },
});
