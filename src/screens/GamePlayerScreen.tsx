import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { getGame, GameShell } from '@/sdk';
import { BackButton } from '../components/common';
import { COLORS, FONT_SIZES } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

export function GamePlayerScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const game = getGame(gameId);

  if (!game) {
    return (
      <View style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Game not found</Text>
        </View>
      </View>
    );
  }

  const Game = game.component;
  const layout = game.layout ?? {};

  // Bare mode: game composes its own shell/canvas.
  if (layout.mode === 'bare') {
    return (
      <View style={[styles.container, { backgroundColor: game.backgroundColor }]}>
        <BackButton onPress={() => navigation.goBack()} />
        <Game />
      </View>
    );
  }

  return (
    <GameShell
      title={layout.title ?? game.name}
      background={game.backgroundColor}
      showBack={layout.showBack ?? true}
      onBack={() => navigation.goBack()}
    >
      <Game />
    </GameShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.light },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: FONT_SIZES.lg, color: COLORS.text.secondary, fontWeight: 'bold' },
});
