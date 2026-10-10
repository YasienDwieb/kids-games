/**
 * Celebration kit — a confetti burst + a short praise bubble, spoken aloud by a
 * real (recorded) voice in the app's language, that plays OVER the game and then
 * gets out of the way. Replaces the "tap to continue" modal after
 * every small win; games keep a modal only for real milestones.
 *
 *   const celebrate = useCelebrate();
 *   await celebrate('small');               // ~1.2 s, then advance
 *   celebrate('big', { praise: false });    // confetti behind a win card
 *
 * The provider is mounted once by the player screens (GamePlayer, FlowPlayer),
 * so both `shell` and `bare` games get it. Without a provider, celebrate() is a
 * no-op that resolves immediately — games never have to guard for it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSound } from '@/sdk/audio/useSound';
import { currentLanguage } from '@/sdk/i18n';
import { Lulu3D } from '@/sdk/mascot/Lulu3D';
import { StickerToast } from '@/sdk/rewards/StickerToast';
import { QuestToast } from './QuestToast';
import { LevelUp } from './LevelUp';
import { bumpCombo } from './combo';
import { ACCENTS, COLORS, POP } from '@/constants/colors';
import { FONT_SIZES, OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { FONTS } from '@/constants/typography';

export type CelebrationSize = 'small' | 'big';
export type CelebrateOptions = {
  /** Show the praise bubble (default true). Turn off when a win card already says it. */
  praise?: boolean;
  /** Speak the praise line (default true). Follows the sound setting like every SFX. */
  voice?: boolean;
};
export type Celebrate = (size?: CelebrationSize, options?: CelebrateOptions) => Promise<void>;

/**
 * Number of `core:celebrate.praise.<n>` lines (1-based). Each has a recorded clip per
 * language (`praise.<lang>.<n>` in the asset manifest) — keep all three in sync.
 */
export const PRAISE_COUNT = 8;

const praiseIntent = (n: number) => `praise.${currentLanguage()}.${n}`;

const DURATION: Record<CelebrationSize, number> = { small: 1150, big: 1900 };
const PIECES: Record<CelebrationSize, number> = { small: 18, big: 36 };
const PIECE_COLORS = [
  ACCENTS.pink.base,
  ACCENTS.blue.base,
  ACCENTS.green.base,
  ACCENTS.orange.base,
  ACCENTS.purple.base,
  COLORS.gold,
];

type Piece = {
  dx: number;
  dy: number;
  fall: number;
  spin: number;
  size: number;
  round: boolean;
  color: string;
};

type Burst = {
  id: number;
  size: CelebrationSize;
  praiseKey: string | null;
  /** Wins in a row so far (shown as "x3 COMBO!" from 2 up). */
  combo: number;
  pieces: Piece[];
  resolve: () => void;
};

function makePieces(size: CelebrationSize): Piece[] {
  const n = PIECES[size];
  const reach = size === 'big' ? 260 : 170;
  return Array.from({ length: n }, (_, i) => {
    // Spread evenly round the circle with jitter so bursts never look gridded.
    const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const dist = reach * (0.55 + Math.random() * 0.45);
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.75,
      fall: 90 + Math.random() * 90,
      spin: (Math.random() - 0.5) * 720,
      size: 8 + Math.random() * (size === 'big' ? 10 : 6),
      round: Math.random() < 0.4,
      color: PIECE_COLORS[i % PIECE_COLORS.length],
    };
  });
}

const CelebrationContext = createContext<Celebrate>(() => Promise.resolve());

/** Fire a celebration over the current game. Safe to call without a provider. */
export function useCelebrate(): Celebrate {
  return useContext(CelebrationContext);
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(1);
  const lastPraise = useRef(0);
  const { play, prewarm } = useSound();

  // Load this language's praise clips up front so the voice lands with the burst.
  useEffect(() => {
    prewarm(Array.from({ length: PRAISE_COUNT }, (_, i) => praiseIntent(i + 1)));
  }, [prewarm]);

  const celebrate = useCallback<Celebrate>((size = 'small', options = {}) => {
    return new Promise<void>((resolve) => {
      // Never repeat the previous line back-to-back.
      let n = 1 + Math.floor(Math.random() * PRAISE_COUNT);
      if (n === lastPraise.current) n = (n % PRAISE_COUNT) + 1;
      lastPraise.current = n;

      const praiseKey = options.praise !== false ? `celebrate.praise.${n}` : null;
      // The voice is the "human" half of the reward; no haptic — the game's own
      // success cue already buzzed.
      if (options.voice !== false) play(praiseIntent(n), { haptic: false });

      const burst: Burst = {
        id: nextId.current++,
        size,
        praiseKey,
        combo: bumpCombo(),
        pieces: makePieces(size),
        resolve,
      };
      setBursts((b) => [...b, burst]);
    });
  }, [play]);

  const finish = useCallback((id: number) => {
    setBursts((b) => {
      b.find((x) => x.id === id)?.resolve();
      return b.filter((x) => x.id !== id);
    });
  }, []);

  // Resolve anything still pending if the screen goes away mid-burst, so an
  // awaiting game callback never hangs.
  const live = useRef(bursts);
  live.current = bursts;
  useEffect(() => () => live.current.forEach((b) => b.resolve()), []);

  return (
    <CelebrationContext.Provider value={celebrate}>
      <View style={styles.fill}>
        {children}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {bursts.map((b) => (
            <BurstView key={b.id} burst={b} onDone={finish} />
          ))}
          <CheeringLulu show={bursts.length > 0} big={bursts.some((b) => b.size === 'big')} />
          <StickerToast />
          <QuestToast />
        </View>
        <LevelUp />
      </View>
    </CelebrationContext.Provider>
  );
}

/**
 * 3D Lulu hops up from the corner to cheer every celebration. She is mounted up
 * front (one GL context per screen, created before the first burst so it can't
 * hitch the confetti) and only renders frames while shown.
 */
function CheeringLulu({ show, big }: { show: boolean; big: boolean }) {
  const enter = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    Animated.spring(enter, { toValue: show ? 1 : 0, friction: 7, tension: 70, useNativeDriver: true }).start();
  }, [enter, show]);
  const size = big ? 170 : 130;
  return (
    <Animated.View
      style={[
        styles.mascot,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [size, 0] }) }],
        },
      ]}
    >
      <Lulu3D size={size} mood="cheer" active={show} />
    </Animated.View>
  );
}

function BurstView({ burst, onDone }: { burst: Burst; onDone: (id: number) => void }) {
  const { t } = useTranslation();
  const progress = useMemo(() => new Animated.Value(0), []);
  const bubble = useMemo(() => new Animated.Value(0), []);
  const duration = DURATION[burst.size];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(bubble, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
        Animated.delay(duration - 600),
        Animated.timing(bubble, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(burst.id));
  }, [bubble, burst.id, duration, onDone, progress]);

  const fade = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });

  return (
    <View style={styles.center}>
      {burst.pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              width: p.size,
              height: p.round ? p.size : p.size * 0.55,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: fade,
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                {
                  // Out along the burst, then a little gravity at the end.
                  translateY: progress.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0, p.dy * 0.9, p.dy + p.fall],
                  }),
                },
                {
                  rotate: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${p.spin}deg`],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      {burst.praiseKey || burst.combo >= 2 ? (
        <Animated.View
          style={[
            styles.pop,
            {
              opacity: bubble,
              transform: [
                { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                { rotate: '-4deg' },
              ],
            },
          ]}
        >
          {burst.combo >= 2 ? (
            <View style={[styles.combo, SHADOWS.sm]}>
              <Text style={styles.comboText}>{t('combo.label', { n: burst.combo })}</Text>
            </View>
          ) : null}
          {burst.praiseKey ? (
            <View style={[styles.bubble, burst.size === 'big' && styles.bubbleBig, SHADOWS.lg]}>
              <Text style={[styles.praise, burst.size === 'big' && styles.praiseBig]}>
                {t(burst.praiseKey)}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  piece: { position: 'absolute' },
  mascot: { position: 'absolute', bottom: SPACING.sm, start: SPACING.lg },
  pop: { alignItems: 'center', gap: SPACING.sm },
  // Comic speech-burst: zap yellow, thick ink edge, hard shadow, slight tilt.
  bubble: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    borderWidth: OUTLINE.thick,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
  },
  combo: {
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 14,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: POP.bubblegum,
    transform: [{ rotate: '6deg' }],
  },
  comboText: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.ink },
  bubbleBig: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  praise: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
  },
  praiseBig: { fontSize: FONT_SIZES.xl },
});
