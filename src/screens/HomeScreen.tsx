import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import type { GameConfig } from '../types';
import { getAllGames } from '../games/registry';
import { GameCard } from '../components/common';
import { SafeContainer } from '../components/common';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const games = getAllGames();

  return (
    <SafeContainer>
      <Text style={styles.title}>Let's Play! 👋</Text>

      {games.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎮</Text>
          <Text style={styles.emptyText}>No games yet!</Text>
        </View>
      ) : (
        <FlatList
          data={games}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }: { item: GameConfig }) => (
            <GameCard
              icon={item.icon}
              name={item.name}
              color={item.backgroundColor}
              onPress={() => navigation.navigate('GamePlayer', { gameId: item.id })}
              style={styles.card}
            />
          )}
        />
      )}
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.primary.purple,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  grid: {
    paddingBottom: SPACING.lg,
  },
  row: {
    justifyContent: 'space-evenly',
    marginBottom: SPACING.md,
  },
  card: {
    width: '44%',
    aspectRatio: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    fontWeight: 'bold',
  },
});
