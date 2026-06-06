import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, GameConfig } from '../types';
import { GameCard, Chip, IconButton } from '../components/common';
import { COLORS, FONTS, SPACING } from '../constants';
import type { AccentName } from '../constants';
import { useSettings, gamesForBand, getAllGames, AGE_BANDS, bandsForGame } from '@/sdk';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const ACCENT_CYCLE: AccentName[] = ['green', 'blue', 'orange', 'coral', 'purple', 'pink'];

// Stable fallback accent when a game config doesn't declare one.
function accentForGame(game: GameConfig, index: number): AccentName {
  return game.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length];
}

function ageLabelForGame(game: GameConfig): string | undefined {
  const ids = bandsForGame(game);
  const band = AGE_BANDS.find((b) => ids.includes(b.id));
  return band?.label;
}

export function HomeScreen({ navigation }: Props) {
  const { settings, update } = useSettings();
  const games = settings.ageBand ? gamesForBand(settings.ageBand) : getAllGames();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* greeting header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Hello there 👋</Text>
            <Text style={styles.title}>Let's Play!</Text>
          </View>
          <IconButton
            glyph="⚙️"
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Settings"
          />
        </View>

        {/* category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="All" active={settings.ageBand === null} onPress={() => update({ ageBand: null })} />
          {AGE_BANDS.map((band) => (
            <Chip
              key={band.id}
              label={band.label}
              active={settings.ageBand === band.id}
              onPress={() => update({ ageBand: band.id })}
            />
          ))}
        </ScrollView>

        {/* grid */}
        {games.length === 0 ? (
          <Text style={styles.empty}>More games coming soon! 🎈</Text>
        ) : (
          <View style={styles.grid}>
            {games.map((game, i) => (
              <View key={game.id} style={styles.cell}>
                <GameCard
                  icon={game.icon}
                  name={game.name}
                  accent={accentForGame(game, i)}
                  ageLabel={ageLabelForGame(game)}
                  onPress={() => navigation.navigate('GamePlayer', { gameId: game.id })}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  scroll: { paddingBottom: SPACING.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  hello: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.inkSoft,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 34,
    color: COLORS.ink,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
  },
  cell: {
    width: '50%',
    padding: 7,
  },
  empty: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.inkSoft,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
