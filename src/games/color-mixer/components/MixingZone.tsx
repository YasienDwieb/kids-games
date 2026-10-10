import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, EmojiImage, FONTS, OUTLINE, useTranslation } from '@/sdk';
import { DraggableResult } from './DraggableResult';
import { DIMENSIONS } from '../constants';

type MixingZoneProps = {
  size: number;
  currentMixHex: string | null;
  /** Drops in the pot, and the cap — shown only as the pot nears full. */
  dropCount: number;
  dropCap: number;
  /** Increments on a drop the full pot refused, to nudge the zone. */
  rejectedAt: number;
  onLayout: (position: { x: number; y: number; width: number; height: number }) => void;
  onResultDragEnd?: (position: { x: number; y: number }) => void;
};

export function MixingZone({
  size,
  currentMixHex,
  dropCount,
  dropCap,
  rejectedAt,
  onLayout,
  onResultDragEnd,
}: MixingZoneProps) {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (currentMixHex) {
      resultScaleAnim.setValue(0);
      resultOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(resultScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      resultScaleAnim.setValue(0);
      resultOpacity.setValue(0);
    }
  }, [currentMixHex, resultScaleAnim, resultOpacity]);

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

  // The empty state scales with the pot, which is no longer a fixed 180: challenge mode
  // spends ~19dp of diameter on the target strip, and the zone clamps as low as 112.
  // Fixed 36/16 type stayed 128dp wide inside a 161dp circle — crowding the dashed ring,
  // and overflowing it outright at the floor. Width is capped to the circle's inscribed
  // box so the copy can never touch the border.
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const iconSize = clamp(Math.round(size * 0.2), 20, 36);
  const emptyFontSize = clamp(Math.round(size * 0.089), 11, 16);
  const emptyMaxWidth = Math.round(size * 0.78);

  return (
    <Animated.View
      ref={viewRef}
      onLayout={handleLayout}
      style={[
        styles.zone,
        { transform: [{ translateX: nudge.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] },
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        currentMixHex != null && styles.zoneActive,
      ]}
    >
      {!currentMixHex && (
        <View style={[styles.emptyState, { maxWidth: emptyMaxWidth }]}>
          <EmojiImage
            emoji="🎨"
            size={iconSize}
            style={{ marginBottom: clamp(Math.round(size * 0.045), 4, 8) }}
          />
          <Text
            style={[
              styles.emptyText,
              { fontSize: emptyFontSize, lineHeight: Math.round(emptyFontSize * 1.25) },
            ]}
          >
            {t('color-mixer:mixingZone.dropHere')}
          </Text>
        </View>
      )}

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
          <DraggableResult
            hex={currentMixHex}
            size={DIMENSIONS.RESULT_BLOB_SIZE}
            onDragEnd={onResultDragEnd}
          />
        </Animated.View>
      )}

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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    bottom: -10,
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
  emptyText: {
    fontFamily: FONTS.body,
    color: TOKENS.inkSoft,
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
