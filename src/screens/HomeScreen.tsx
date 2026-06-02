import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import type { GameConfig } from '../types';
import { GameCard } from '../components/common';
import { SafeContainer } from '../components/common';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import { useSettings, gamesForBand, getAllGames, AGE_BANDS } from '@/sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { settings, update } = useSettings();
  const games = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();

  return (
    <SafeContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Let's Play! 👋</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.gearButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, settings.ageBand === null && styles.chipActive]}
          onPress={() => update({ ageBand: null })}
        >
          <Text style={[styles.chipText, settings.ageBand === null && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {AGE_BANDS.map((band) => (
          <TouchableOpacity
            key={band.id}
            style={[styles.chip, settings.ageBand === band.id && styles.chipActive]}
            onPress={() => update({ ageBand: band.id })}
          >
            <Text style={[styles.chipText, settings.ageBand === band.id && styles.chipTextActive]}>
              {band.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.primary.purple,
    textAlign: 'center',
  },
  gearButton: {
    position: 'absolute',
    right: SPACING.md,
  },
  gearIcon: {
    fontSize: FONT_SIZES.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.white,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: COLORS.primary.blue,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.text.inverse,
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
