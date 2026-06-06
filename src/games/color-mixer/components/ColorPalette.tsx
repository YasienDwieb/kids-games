import React, { useCallback, useRef } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, SHADOWS } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { ColorLabel } from './ColorLabel';
import { COLORS, DIMENSIONS } from '../constants';
import type { ColorId, SavedColor } from '../types';

type ColorPaletteProps = {
  availableColors: ColorId[];
  onColorDragStart: (colorId: ColorId, instanceId: string) => void;
  onColorDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onColorDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
  savedColors?: SavedColor[];
  onSavedColorDragEnd?: (savedColor: SavedColor, position: { x: number; y: number }) => void;
  paletteItemPositions?: React.MutableRefObject<Map<string, { x: number; y: number; width: number; height: number }>>;
};

export function ColorPalette({
  availableColors,
  onColorDragStart,
  onColorDragMove,
  onColorDragEnd,
  savedColors = [],
  onSavedColorDragEnd,
  paletteItemPositions,
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
              paletteItemPositions={paletteItemPositions}
            />
          ))}
        </View>

        {savedColors.length > 0 && (
          <>
            <Text style={[styles.title, styles.savedTitle]}>Saved</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.savedRow}
            >
              {savedColors.map((saved) => (
                <SavedPaletteSlot
                  key={saved.id}
                  saved={saved}
                  onDragEnd={(pos) => onSavedColorDragEnd?.(saved, pos)}
                  paletteItemPositions={paletteItemPositions}
                />
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

type PaletteSlotProps = {
  colorId: ColorId;
  onDragStart: (colorId: ColorId, instanceId: string) => void;
  onDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
  paletteItemPositions?: React.MutableRefObject<Map<string, { x: number; y: number; width: number; height: number }>>;
};

function PaletteSlot({ colorId, onDragStart, onDragMove, onDragEnd, paletteItemPositions }: PaletteSlotProps) {
  const slotRef = useRef<View>(null);
  const slotPosition = useRef({ x: 0, y: 0 });
  const instanceCounter = useRef(0);

  const measureSlot = useCallback(() => {
    slotRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      if (pageX !== undefined) {
        slotPosition.current = { x: pageX, y: pageY };
        paletteItemPositions?.current.set(colorId, { x: pageX, y: pageY, width: w, height: h });
      }
    });
  }, [colorId, paletteItemPositions]);

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
  colorId?: ColorId;
  colorHex?: string;
  instanceId: string;
  size: number;
  onDragStart: (instanceId: string) => void;
  onDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
};

function DraggableSlotBlob({
  colorId,
  colorHex,
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

  const hex = colorHex ?? (colorId ? COLORS[colorId].hex : '#000000');

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
      <ColorBlob color={hex} size={size} showShine />
    </Animated.View>
  );
}

type SavedPaletteSlotProps = {
  saved: SavedColor;
  onDragEnd: (position: { x: number; y: number }) => void;
  paletteItemPositions?: React.MutableRefObject<Map<string, { x: number; y: number; width: number; height: number }>>;
};

function SavedPaletteSlot({ saved, onDragEnd, paletteItemPositions }: SavedPaletteSlotProps) {
  const slotRef = useRef<View>(null);
  const slotPosition = useRef({ x: 0, y: 0 });

  const measureSlot = useCallback(() => {
    slotRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      if (pageX !== undefined) {
        slotPosition.current = { x: pageX, y: pageY };
        paletteItemPositions?.current.set(saved.id, { x: pageX, y: pageY, width: w, height: h });
      }
    });
  }, [saved.id, paletteItemPositions]);

  const handleDragEnd = useCallback((_instanceId: string, localPos: { x: number; y: number }) => {
    onDragEnd({
      x: slotPosition.current.x + localPos.x,
      y: slotPosition.current.y + localPos.y,
    });
  }, [onDragEnd]);

  const size = DIMENSIONS.PALETTE_ITEM_SIZE;

  return (
    <View ref={slotRef} onLayout={measureSlot} style={styles.slot}>
      <View style={styles.slotDraggableArea}>
        <DraggableSlotBlob
          colorHex={saved.hex}
          instanceId={saved.id}
          size={size}
          onDragStart={() => {}}
          onDragMove={() => {}}
          onDragEnd={handleDragEnd}
        />
      </View>
      <ColorLabel name={saved.name} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
  },
  paletteEdge: {
    height: 4,
    backgroundColor: TOKENS.line2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 8,
  },
  palette: {
    backgroundColor: TOKENS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 8,
    ...SHADOWS.sm,
    overflow: 'visible',
  },
  title: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: TOKENS.inkSoft,
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
  savedTitle: {
    marginTop: 10,
  },
  savedRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
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
