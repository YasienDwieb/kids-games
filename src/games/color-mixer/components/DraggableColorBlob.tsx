import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { COLORS, DIMENSIONS } from '../constants';
import type { ColorId } from '../types';

type DraggableColorBlobProps = {
  colorId?: ColorId;
  colorHex?: string;
  instanceId: string;
  initialPosition: { x: number; y: number };
  onDragStart: (instanceId: string) => void;
  onDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
  disabled?: boolean;
};

export function DraggableColorBlob({
  colorId,
  colorHex,
  instanceId,
  initialPosition,
  onDragStart,
  onDragMove,
  onDragEnd,
  disabled = false,
}: DraggableColorBlobProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const currentPos = useRef({ x: initialPosition.x, y: initialPosition.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });

        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 7,
          useNativeDriver: true,
        }).start();

        onDragStart(instanceId);
      },
      onPanResponderMove: (_evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        currentPos.current = {
          x: initialPosition.x + gestureState.dx,
          y: initialPosition.y + gestureState.dy,
        };
        onDragMove(instanceId, currentPos.current);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        isDragging.current = false;
        pan.flattenOffset();

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        const finalPos = {
          x: initialPosition.x + gestureState.dx,
          y: initialPosition.y + gestureState.dy,
        };
        onDragEnd(instanceId, finalPos);

        // Snap back to original position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const hex = colorHex ?? (colorId ? COLORS[colorId].hex : '#000000');
  const size = DIMENSIONS.COLOR_BLOB_SIZE;

  return (
    <View style={[styles.container, { left: initialPosition.x, top: initialPosition.y }]}>
      {/* Ghost blob at original position */}
      <View style={styles.ghost}>
        <ColorBlob color={hex} size={size} showShine={false} />
      </View>

      {/* Draggable blob */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.draggable,
          {
            transform: [
              ...pan.getTranslateTransform(),
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <ColorBlob color={hex} size={size} showShine />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  ghost: {
    opacity: 0.25,
  },
  draggable: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
});
