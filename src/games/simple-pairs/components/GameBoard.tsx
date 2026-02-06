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

const HEADER_HEIGHT = 80;

export function GameBoard({ cards, onCardPress, disabled, columns }: GameBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const rowCount = Math.ceil(cards.length / columns);
  const availableWidth = screenWidth - BOARD_PADDING * 2;
  const availableHeight = screenHeight - HEADER_HEIGHT - BOARD_PADDING * 2;

  const widthSize = Math.floor(availableWidth / columns - LAYOUT.CARD_GAP);
  const heightSize = Math.floor(availableHeight / rowCount - LAYOUT.CARD_GAP);
  const cardSize = Math.min(widthSize, heightSize, LAYOUT.CARD_SIZE);

  const rows: CardType[][] = [];
  for (let i = 0; i < cards.length; i += columns) {
    rows.push(cards.slice(i, i + columns));
  }

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
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
  board: {
    alignItems: 'center',
    gap: LAYOUT.CARD_GAP,
  },
  row: {
    flexDirection: 'row',
  },
});
