import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { DraggableResult } from './DraggableResult';
import { COLORS, DIMENSIONS, TIMING } from '../constants';
import type { ColorId } from '../types';

type MixingZoneProps = {
  size: number;
  colorsInZone: ColorId[];
  resultColor: ColorId | null;
  isMixing: boolean;
  onLayout: (position: { x: number; y: number; width: number; height: number }) => void;
  currentMixHex?: string | null;
  onResultDragEnd?: (position: { x: number; y: number }) => void;
  showDraggableResult?: boolean;
};

export function MixingZone({
  size,
  colorsInZone,
  resultColor,
  isMixing,
  onLayout,
  currentMixHex,
  onResultDragEnd,
  showDraggableResult = true,
}: MixingZoneProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMixing) {
      spinAnim.setValue(0);
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: TIMING.MIX_ANIMATION_DURATION,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isMixing, spinAnim]);

  useEffect(() => {
    if (resultColor || currentMixHex) {
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
  }, [resultColor, currentMixHex, resultScaleAnim, resultOpacity]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const blobSize = size * 0.35;
  const hasColors = colorsInZone.length > 0;
  const showResult = (resultColor || currentMixHex) && !isMixing;
  const displayHex = currentMixHex || (resultColor ? COLORS[resultColor].hex : null);

  const handleLayout = () => {
    viewRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      if (pageX !== undefined) {
        onLayout({ x: pageX, y: pageY, width, height });
      }
    });
  };

  const viewRef = useRef<View>(null);

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      style={[
        styles.zone,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        hasColors && styles.zoneActive,
      ]}
    >
      {/* Empty state */}
      {!hasColors && !showResult && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎨</Text>
          <Text style={styles.emptyText}>Drop colors here!</Text>
        </View>
      )}

      {/* Colors in zone (pre-mix) */}
      {hasColors && !showResult && (
        <Animated.View
          style={[
            styles.ingredientsContainer,
            isMixing && { transform: [{ rotate: spin }] },
          ]}
        >
          {colorsInZone.map((colorId, i) => (
            <Animated.View
              key={`${colorId}-${i}`}
              style={[
                styles.ingredientBlob,
                { backgroundColor: 'transparent' },
                getIngredientPosition(i, colorsInZone.length, size),
                isMixing && { opacity: spinAnim.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [1, 0.5, 0],
                })},
              ]}
            >
              <ColorBlob color={COLORS[colorId].hex} size={blobSize} />
            </Animated.View>
          ))}
          {colorsInZone.length === 1 && !isMixing && (
            <Text style={styles.promptText}>Add another!</Text>
          )}
        </Animated.View>
      )}

      {/* Result display */}
      {showResult && displayHex && (
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: resultOpacity,
              transform: [{ scale: resultScaleAnim }],
            },
          ]}
        >
          {showDraggableResult ? (
            <DraggableResult
              hex={displayHex}
              size={DIMENSIONS.RESULT_BLOB_SIZE}
              onDragEnd={onResultDragEnd}
            />
          ) : (
            <ColorBlob color={displayHex} size={DIMENSIONS.RESULT_BLOB_SIZE} showShine />
          )}
          {resultColor && !currentMixHex && (
            <Text style={styles.resultText}>{COLORS[resultColor].name}!</Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

function getIngredientPosition(
  index: number,
  total: number,
  zoneSize: number,
): { left: number; top: number } {
  const center = zoneSize / 2;
  const offset = zoneSize * 0.15;

  if (total === 1) {
    return { left: center - (zoneSize * 0.35) / 2, top: center - (zoneSize * 0.35) / 2 };
  }

  if (total === 2) {
    const positions = [
      { left: center - offset - (zoneSize * 0.35) / 2, top: center - (zoneSize * 0.35) / 2 },
      { left: center + offset - (zoneSize * 0.35) / 2, top: center - (zoneSize * 0.35) / 2 },
    ];
    return positions[index];
  }

  // 3 colors: triangle layout
  const angle = (index * 2 * Math.PI) / 3 - Math.PI / 2;
  const radius = offset;
  return {
    left: center + radius * Math.cos(angle) - (zoneSize * 0.35) / 2,
    top: center + radius * Math.sin(angle) - (zoneSize * 0.35) / 2,
  };
}

const styles = StyleSheet.create({
  zone: {
    borderWidth: 2.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  zoneActive: {
    borderColor: 'rgba(0, 0, 0, 0.3)',
    borderStyle: 'solid',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
  },
  ingredientsContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ingredientBlob: {
    position: 'absolute',
  },
  promptText: {
    position: 'absolute',
    bottom: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  resultText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
});
