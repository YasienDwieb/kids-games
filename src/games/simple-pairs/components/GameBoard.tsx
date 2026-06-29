import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Card as CardType } from '../types';
import { LAYOUT } from '../constants';
import { SPACING } from '../../../constants';
import { Card } from './Card';

type GameBoardProps = {
  cards: CardType[];
  onCardPress: (cardId: string) => void;
  disabled: boolean;
  columns: number;
};

const BOARD_PADDING = SPACING.lg;

export function GameBoard({ cards, onCardPress, disabled, columns }: GameBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const landscape = screenWidth > screenHeight;

  // Measure the real available height of the board area (the View below the header)
  // via onLayout instead of estimating header/inset heights — device-agnostic, so
  // notched-landscape devices size cards from actual space, never a fixed budget.
  const [boardH, setBoardH] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== boardH) setBoardH(h);
  };

  const rowCount = Math.ceil(cards.length / columns);
  const availableWidth = screenWidth - BOARD_PADDING * 2;

  const widthSize = Math.floor(availableWidth / columns - LAYOUT.CARD_GAP);
  // The measured height already excludes the header; subtract our own vertical
  // padding (tighter in landscape, see containerLandscape).
  // Until measured (boardH === 0), fall back to width-based sizing so there's no flash.
  const verticalPadding = (landscape ? SPACING.xs : BOARD_PADDING) * 2;
  const heightSize =
    boardH > 0
      ? Math.floor((boardH - verticalPadding) / rowCount - LAYOUT.CARD_GAP)
      : widthSize;
  const cardSize = Math.min(widthSize, heightSize, LAYOUT.CARD_SIZE);

  const rows: CardType[][] = [];
  for (let i = 0; i < cards.length; i += columns) {
    rows.push(cards.slice(i, i + columns));
  }

  return (
    <View
      style={[styles.container, landscape && styles.containerLandscape]}
      onLayout={onLayout}
    >
      <View style={[styles.board, landscape && styles.boardLandscape]}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.row, landscape && styles.rowLandscape]}>
            {row.map((card) => (
              <View key={card.id} style={{ marginHorizontal: LAYOUT.CARD_GAP / 2 }}>
                <Card
                  card={card}
                  onPress={onCardPress}
                  disabled={disabled}
                  size={cardSize}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: BOARD_PADDING,
  },
  containerLandscape: {
    justifyContent: 'space-evenly',
    paddingVertical: SPACING.xs,
  },
  board: {
    alignItems: 'center',
    gap: LAYOUT.CARD_GAP,
  },
  boardLandscape: {
    gap: LAYOUT.CARD_GAP,
    width: '100%',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  rowLandscape: {
    justifyContent: 'space-evenly',
    width: '100%',
  },
});
