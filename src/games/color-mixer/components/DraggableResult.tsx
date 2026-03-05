import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import { ColorBlob } from './ColorBlob';

interface DraggableResultProps {
  hex: string;
  size: number;
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  disabled?: boolean;
}

export function DraggableResult({
  hex,
  size,
  onDragStart,
  onDragEnd,
  disabled = false,
}: DraggableResultProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (_evt) => {
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 7,
          useNativeDriver: true,
        }).start();
        onDragStart?.();
      },
      onPanResponderMove: (_evt, gs) => {
        pan.setValue({ x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_evt, gs) => {
        pan.flattenOffset();
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        onDragEnd?.({ x: gs.moveX, y: gs.moveY });

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [...pan.getTranslateTransform(), { scale: scaleAnim }],
          zIndex: 100,
        },
      ]}
    >
      <ColorBlob color={hex} size={size} showShine />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});
