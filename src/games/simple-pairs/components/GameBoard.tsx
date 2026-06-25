import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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

// Approximate header height — compact in landscape (single row), taller in portrait.
const HEADER_HEIGHT_PORTRAIT = 80;
const HEADER_HEIGHT_LANDSCAPE = 52;

export function GameBoard({ cards, onCardPress, disabled, columns }: GameBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const landscape = screenWidth > screenHeight;

  const headerHeight = landscape ? HEADER_HEIGHT_LANDSCAPE : HEADER_HEIGHT_PORTRAIT;
  const rowCount = Math.ceil(cards.length / columns);
  const availableWidth = screenWidth - BOARD_PADDING * 2;
  const availableHeight = screenHeight - headerHeight - BOARD_PADDING * 2;

  const widthSize = Math.floor(availableWidth / columns - LAYOUT.CARD_GAP);
  const heightSize = Math.floor(availableHeight / rowCount - LAYOUT.CARD_GAP);
  // In landscape, size from width so cards fill the wider axis; cap at portrait max.
  const cardSize = landscape
    ? Math.min(widthSize, heightSize, LAYOUT.CARD_SIZE)
    : Math.min(widthSize, heightSize, LAYOUT.CARD_SIZE);

  const rows: CardType[][] = [];
  for (let i = 0; i < cards.length; i += columns) {
    rows.push(cards.slice(i, i + columns));
  }

  return (
    <View style={[styles.container, landscape && styles.containerLandscape]}>
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
