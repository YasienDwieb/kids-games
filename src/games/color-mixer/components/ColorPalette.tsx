import React, { useCallback, useRef } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, SHADOWS, useTranslation } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { ColorLabel } from './ColorLabel';
import { COLORS, DIMENSIONS } from '../constants';
import { isVerticalDrag, sortSavedNewestFirst } from '../utils';
import type { ColorId, SavedColor } from '../types';

type ColorPaletteProps = {
  availableColors: ColorId[];
  onColorDragStart: (colorId: ColorId, instanceId: string) => void;
  onColorDragMove: (instanceId: string, position: { x: number; y: number }) => void;
  onColorDragEnd: (instanceId: string, position: { x: number; y: number }) => void;
  savedColors?: SavedColor[];
  onSavedTap?: (hex: string) => void;
  onSavedLiftStart?: (hex: string, x: number, y: number) => void;
  onSavedLiftMove?: (x: number, y: number) => void;
  onSavedLiftEnd?: (x: number, y: number) => void;
  paletteItemPositions?: React.MutableRefObject<Map<string, { x: number; y: number; width: number; height: number }>>;
};

export function ColorPalette({
  availableColors,
  onColorDragStart,
  onColorDragMove,
  onColorDragEnd,
  savedColors = [],
  onSavedTap,
  onSavedLiftStart,
  onSavedLiftMove,
  onSavedLiftEnd,
  paletteItemPositions,
}: ColorPaletteProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.paletteEdge} />
      <View style={styles.palette}>
        <Text style={styles.title}>{t('color-mixer:palette.colorsTitle')}</Text>
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
            <Text style={[styles.title, styles.savedTitle]}>{t('color-mixer:palette.savedTitle')}</Text>
            {/* A horizontal scroller keeps the saved area one row tall no matter how many
                colors exist, so it can never squeeze the mixing zone. The actual lift-drag
                is rendered by the parent in a full-screen overlay (this ScrollView clips). */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.savedStrip}
              contentContainerStyle={styles.savedStripContent}
            >
              {sortSavedNewestFirst(savedColors).map((saved) => (
                <SavedSwatch
                  key={saved.id}
                  saved={saved}
                  onTap={onSavedTap}
                  onLiftStart={onSavedLiftStart}
                  onLiftMove={onSavedLiftMove}
                  onLiftEnd={onSavedLiftEnd}
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
  const { t } = useTranslation();
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
      <ColorLabel name={t(`color-mixer:colors.${colorId}`)} />
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

type SavedSwatchProps = {
  saved: SavedColor;
  onTap?: (hex: string) => void;
  onLiftStart?: (hex: string, x: number, y: number) => void;
  onLiftMove?: (x: number, y: number) => void;
  onLiftEnd?: (x: number, y: number) => void;
};

// Tap → add to mix. Vertical drag → hand absolute finger coords to the parent, which
// renders the lifted ghost above everything (this swatch lives inside a clipping
// ScrollView, so it cannot itself be dragged up into the zone). Horizontal motion is
// ignored here so the ScrollView keeps it for scrolling.
function SavedSwatch({ saved, onTap, onLiftStart, onLiftMove, onLiftEnd }: SavedSwatchProps) {
  const dimAnim = useRef(new Animated.Value(1)).current;

  const endLift = useCallback(
    (x: number, y: number) => {
      dimAnim.setValue(1);
      onLiftEnd?.(x, y);
    },
    [dimAnim, onLiftEnd],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gs) => isVerticalDrag(gs.dx, gs.dy),
      onPanResponderGrant: (evt) => {
        dimAnim.setValue(0.3); // dim the in-strip swatch while its ghost is lifted
        onLiftStart?.(saved.hex, evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderMove: (_evt, gs) => onLiftMove?.(gs.moveX, gs.moveY),
      onPanResponderRelease: (_evt, gs) => endLift(gs.moveX, gs.moveY),
      // ScrollView stole the gesture (horizontal scroll) — dismiss the ghost off-screen.
      onPanResponderTerminate: () => endLift(-1, -1),
    }),
  ).current;

  return (
    <Animated.View {...panResponder.panHandlers} style={{ opacity: dimAnim }}>
      <Pressable style={styles.slot} onPress={() => onTap?.(saved.hex)}>
        <View style={styles.slotDraggableArea}>
          <ColorBlob color={saved.hex} size={DIMENSIONS.PALETTE_ITEM_SIZE} showShine />
        </View>
        <ColorLabel name={saved.name} />
      </Pressable>
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
  savedStrip: {
    alignSelf: 'stretch',
  },
  savedStripContent: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 4,
    alignItems: 'flex-start',
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
