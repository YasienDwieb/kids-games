import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SHADOWS } from '@/sdk';
import { STRING_COLOR } from '../constants';

type Props = { x: number; y: number; r: number; color: string; popping: boolean };

// Styled-View balloon (so we control color, size & the burst). (x, y) is its center.
export function Balloon({ x, y, r, color, popping }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!popping) return;
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.5, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [popping, scale, opacity]);

  const bodyW = r * 2;
  const bodyH = r * 2.2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.root,
        { left: x - r, top: y - r, width: bodyW, height: bodyH, opacity, transform: [{ scale }] },
      ]}
    >
      {popping ? (
        <Text style={{ fontSize: r * 1.6 }}>💥</Text>
      ) : (
        <>
          <View
            style={[
              styles.body,
              { width: bodyW, height: bodyH * 0.84, borderRadius: r, backgroundColor: color },
              SHADOWS.sm,
            ]}
          >
            <View
              style={[
                styles.shine,
                { top: r * 0.32, left: r * 0.4, width: r * 0.5, height: r * 0.66, borderRadius: r * 0.3 },
              ]}
            />
          </View>
          <View style={[styles.knot, { borderTopColor: color }]} />
          <View style={[styles.string, { height: r * 0.6 }]} />
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', alignItems: 'center' },
  body: { alignItems: 'center' },
  shine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.4)' },
  knot: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  string: { width: 2, backgroundColor: STRING_COLOR },
});
