import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS } from '@/sdk';
import { DraggableResult } from './DraggableResult';
import { DIMENSIONS } from '../constants';

type MixingZoneProps = {
  size: number;
  currentMixHex: string | null;
  onLayout: (position: { x: number; y: number; width: number; height: number }) => void;
  onResultDragEnd?: (position: { x: number; y: number }) => void;
};

export function MixingZone({
  size,
  currentMixHex,
  onLayout,
  onResultDragEnd,
}: MixingZoneProps) {
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const viewRef = useRef<View>(null);

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
        currentMixHex != null && styles.zoneActive,
      ]}
    >
      {!currentMixHex && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎨</Text>
          <Text style={styles.emptyText}>Drop colors here!</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    borderWidth: 2.5,
    borderColor: TOKENS.line2,
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
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: TOKENS.inkSoft,
    textAlign: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
