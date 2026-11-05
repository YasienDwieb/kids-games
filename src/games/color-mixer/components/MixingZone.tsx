import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, OUTLINE, SHADOWS, useReduceMotion, useTranslation } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { DraggableResult } from './DraggableResult';
import { RecipeRow } from './RecipeRow';
import { DIMENSIONS } from '../constants';
import type { ColorId, PigmentId } from '../types';

// three + react-three-fiber + expo-gl are only evaluated once the pot is on screen.
const Bowl3D = lazy(() => import('./Bowl3D').then((m) => ({ default: m.Bowl3D })));

/** Droplets thrown up by a splash. */
const SPLASH_DROPS = 6;

type MixingZoneProps = {
  size: number;
  currentMixHex: string | null;
  /** Drops in the pot, and the cap — shown only as the pot nears full. */
  dropCount: number;
  dropCap: number;
  /** Increments on a drop the full pot refused, to nudge the zone. */
  rejectedAt: number;
  /** What's in the pot, shown as pictures above it. */
  recipe: readonly PigmentId[];
  /** The pot's colour name, when it has one. */
  colorId: ColorId | null;
  /** The colour of the last drop in, for its splash (changes every drop). */
  lastDrop: { hex: string; at: number } | null;
  /** A colour is being held over the pot. */
  hot: boolean;
  onLayout: (position: { x: number; y: number; width: number; height: number }) => void;
  onResultDragEnd?: (position: { x: number; y: number }) => void;
};

export function MixingZone({
  size,
  currentMixHex,
  dropCount,
  dropCap,
  rejectedAt,
  recipe,
  colorId,
  lastDrop,
  hot,
  onLayout,
  onResultDragEnd,
}: MixingZoneProps) {
  const { t } = useTranslation();
  const calm = useReduceMotion();
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const viewRef = useRef<View>(null);
  const nudge = useRef(new Animated.Value(0)).current;

  // A full pot silently ignoring drops reads as a broken game. Shake so the refusal is
  // felt, not guessed at.
  useEffect(() => {
    if (rejectedAt === 0) return;
    nudge.setValue(0);
    Animated.sequence([
      Animated.timing(nudge, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(nudge, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(nudge, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [rejectedAt, nudge]);

  // Each drop swirls into the paint: the old colour spins down and fades out over the
  // new one while the new one twists in, so the change reads as mixing, not a swap.
  const swirl = useRef(new Animated.Value(1)).current;
  const prevHex = useRef<string | null>(null);
  const [fromHex, setFromHex] = useState<string | null>(null);
  useEffect(() => {
    const before = prevHex.current;
    prevHex.current = currentMixHex;
    if (!currentMixHex) {
      resultScaleAnim.setValue(0);
      resultOpacity.setValue(0);
      setFromHex(null);
      return;
    }
    if (!before) {
      // The first drop lands in an empty pot: pop in.
      resultScaleAnim.setValue(0);
      resultOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(resultScaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      return;
    }
    if (before === currentMixHex) return;
    setFromHex(before);
    swirl.setValue(0);
    Animated.timing(swirl, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setFromHex(null));
  }, [currentMixHex, resultScaleAnim, resultOpacity, swirl]);

  // The splash: a ring in the dropped colour and a few droplets thrown up and out.
  const splash = useRef(new Animated.Value(1)).current;
  const [splashHex, setSplashHex] = useState<string | null>(null);
  useEffect(() => {
    if (!lastDrop) return;
    setSplashHex(lastDrop.hex);
    splash.setValue(0);
    Animated.timing(splash, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [lastDrop, splash]);

  const handleLayout = () => {
    viewRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      if (pageX !== undefined) {
        onLayout({ x: pageX, y: pageY, width, height });
      }
    });
  };

  // Only surfaces as the pot approaches its cap — a permanent counter is clutter for a
  // four-year-old, but hitting the wall with no warning is worse.
  const showCount = dropCount >= dropCap - 4;


  return (
    <Animated.View
      ref={viewRef}
      onLayout={handleLayout}
      // The pot shows no words: most players can't read yet. The bowl wobbles, glows
      // under a held colour, and the hint is spoken with the demo hand.
      accessible
      accessibilityLabel={t('color-mixer:mixingZone.dragHint')}
      style={[
        styles.frame,
        { transform: [{ translateX: nudge.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
        { width: size, height: size },
      ]}
    >
      {/* The 3D bowl; the flat 2D pot stands in while three.js loads. */}
      <Suspense
        fallback={
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.zone,
              { borderRadius: size / 2 },
              (currentMixHex != null || hot) && styles.zoneActive,
              hot && styles.zoneHot,
            ]}
          >

      {currentMixHex && (
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: resultOpacity,
              transform: [{ scale: resultScaleAnim }],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                { rotate: swirl.interpolate({ inputRange: [0, 1], outputRange: ['-120deg', '0deg'] }) },
                { scale: swirl.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.9, 1.08, 1] }) },
              ],
            }}
          >
            <DraggableResult
              hex={currentMixHex}
              size={DIMENSIONS.RESULT_BLOB_SIZE}
              onDragEnd={onResultDragEnd}
            />
          </Animated.View>
          {fromHex ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.overlay,
                {
                  opacity: swirl.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                  transform: [
                    { rotate: swirl.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '200deg'] }) },
                    { scale: swirl.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) },
                  ],
                },
              ]}
            >
              <ColorBlob color={fromHex} size={DIMENSIONS.RESULT_BLOB_SIZE} showShine={false} />
            </Animated.View>
          ) : null}
        </Animated.View>
      )}

      {splashHex ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.splashRing,
              {
                borderColor: splashHex,
                width: size * 0.7,
                height: size * 0.7,
                borderRadius: size,
                opacity: splash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.9, 0] }),
                transform: [{ scale: splash.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.35] }) }],
              },
            ]}
          />
          {Array.from({ length: SPLASH_DROPS }, (_, i) => {
            const a = (i / SPLASH_DROPS) * Math.PI * 2 + 0.3;
            const r = size * 0.42;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.droplet,
                  {
                    backgroundColor: splashHex,
                    opacity: splash.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      { translateX: splash.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * r] }) },
                      { translateY: splash.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * r - 10] }) },
                      { scale: splash.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.4] }) },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}

          </View>
        }
      >
        <Bowl3D
          size={size}
          hex={currentMixHex}
          dropCount={dropCount}
          dropCap={dropCap}
          lastDrop={lastDrop}
          hot={hot}
          calm={calm}
        />

      </Suspense>

      {/* What went in, on a pill above the pot. */}
      {recipe.length > 0 ? (
        <View style={styles.recipePill} pointerEvents="none">
          <RecipeRow recipe={recipe} size={18} />
        </View>
      ) : null}

      {/* The colour's name, on a pill straddling the bottom of the pot. */}
      {colorId ? (
        <View style={styles.namePill} pointerEvents="none">
          <Text style={styles.nameText} numberOfLines={1}>
            {t(`color-mixer:colors.${colorId}`)}
          </Text>
        </View>
      ) : null}

      {showCount && (
        <View style={styles.counter} pointerEvents="none">
          {/* Pinned LTR: a number pair must not reverse under RTL. */}
          <Text style={styles.counterText}>{`${dropCount}/${dropCap}`}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  zone: {
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    borderStyle: 'dashed',
    backgroundColor: TOKENS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  zoneActive: {
    borderColor: TOKENS.brand,
    borderStyle: 'solid',
  },
  zoneHot: {
    transform: [{ scale: 1.06 }],
  },
  overlay: {
    position: 'absolute',
  },
  splashRing: {
    position: 'absolute',
    alignSelf: 'center',
    top: '15%',
    borderWidth: 5,
  },
  droplet: {
    position: 'absolute',
    alignSelf: 'center',
    top: '46%',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recipePill: {
    position: 'absolute',
    top: -16,
    flexDirection: 'row',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: TOKENS.surface,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    ...SHADOWS.sm,
  },
  namePill: {
    position: 'absolute',
    bottom: -18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: TOKENS.surface,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    ...SHADOWS.sm,
  },
  nameText: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: TOKENS.ink,
  },
  counter: {
    position: 'absolute',
    top: 2,
    end: 2,
    direction: 'ltr',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: TOKENS.surface2,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
  },
  counterText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 11,
    color: TOKENS.inkSoft,
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
