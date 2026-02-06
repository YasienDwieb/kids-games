import { useCallback, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { ColorLabel } from './ColorLabel';
import { COLORS, DIMENSIONS } from '../constants';
import type { ColorId } from '../types';

type ColorPaletteProps = {
  availableColors: ColorId[];
  onColorDragStart: (colorId: ColorId, instanceId: string) => void;
  onColorDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onColorDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
};

export function ColorPalette({
  availableColors,
  onColorDragStart,
  onColorDragMove,
  onColorDragEnd,
}: ColorPaletteProps) {
  return (
    <View style={styles.container}>
      <View style={styles.paletteEdge} />
      <View style={styles.palette}>
        <Text style={styles.title}>Colors</Text>
        <View style={styles.slotsRow}>
          {availableColors.map((colorId) => (
            <PaletteSlot
              key={colorId}
              colorId={colorId}
              onDragStart={onColorDragStart}
              onDragMove={onColorDragMove}
              onDragEnd={onColorDragEnd}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

type PaletteSlotProps = {
  colorId: ColorId;
  onDragStart: (colorId: ColorId, instanceId: string) => void;
  onDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
};

function PaletteSlot({ colorId, onDragStart, onDragMove, onDragEnd }: PaletteSlotProps) {
  const slotRef = useRef<View>(null);
  const slotPosition = useRef({ x: 0, y: 0 });
  const instanceCounter = useRef(0);

  const measureSlot = useCallback(() => {
    slotRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      if (pageX !== undefined) {
        slotPosition.current = { x: pageX, y: pageY };
      }
    });
  }, []);

  const handleDragStart = useCallback((instanceId: string) => {
    onDragStart(colorId, instanceId);
  }, [colorId, onDragStart]);

  const handleDragMove = useCallback((instanceId: string, localPos: { x: number; y: number }) => {
    onDragMove(instanceId, {
      x: slotPosition.current.x + localPos.x,
      y: slotPosition.current.y + localPos.y,
    });
  }, [onDragMove]);

  const handleDragEnd = useCallback((instanceId: string, localPos: { x: number; y: number }) => {
    onDragEnd(instanceId, {
      x: slotPosition.current.x + localPos.x,
      y: slotPosition.current.y + localPos.y,
    });
  }, [onDragEnd]);

  const colorData = COLORS[colorId];
  const size = DIMENSIONS.PALETTE_ITEM_SIZE;
  const instanceId = `${colorId}-${instanceCounter.current++}`;

  return (
    <View ref={slotRef} onLayout={measureSlot} style={styles.slot}>
      <View style={styles.slotDraggableArea}>
        <DraggableSlotBlob
          colorId={colorId}
          instanceId={instanceId}
          size={size}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      </View>
      <ColorLabel name={colorData.name} />
    </View>
  );
}

type DraggableSlotBlobProps = {
  colorId: ColorId;
  instanceId: string;
  size: number;
  onDragStart: (instanceId: string) => void;
  onDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
};

function DraggableSlotBlob({
  colorId,
  instanceId,
  size,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DraggableSlotBlobProps) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });

        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 7,
          useNativeDriver: true,
        }).start();

        onDragStart(instanceId);
      },
      onPanResponderMove: (_evt, gs) => {
        pan.setValue({ x: gs.dx, y: gs.dy });
        onDragMove(instanceId, { x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_evt, gs) => {
        pan.flattenOffset();

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        onDragEnd(instanceId, { x: gs.dx, y: gs.dy });

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 6,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const colorData = COLORS[colorId];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        zIndex: 100,
        transform: [
          ...pan.getTranslateTransform(),
          { scale: scaleAnim },
        ],
      }}
    >
      <ColorBlob color={colorData.hex} size={size} showShine />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
  },
  paletteEdge: {
    height: 4,
    backgroundColor: '#D7CCC8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 8,
  },
  palette: {
    backgroundColor: '#EFEBE9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    overflow: 'visible',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8D6E63',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    overflow: 'visible',
  },
  slot: {
    alignItems: 'center',
    width: DIMENSIONS.PALETTE_ITEM_SIZE + 16,
    overflow: 'visible',
  },
  slotDraggableArea: {
    width: DIMENSIONS.PALETTE_ITEM_SIZE,
    height: DIMENSIONS.PALETTE_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
