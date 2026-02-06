import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { getGame } from '../games/registry';
import { BackButton } from '../components/common';
import { COLORS, FONT_SIZES } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

export function GamePlayerScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const game = getGame(gameId);

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />

      {game ? (
        <game.component />
      ) : (
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Game not found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    fontWeight: 'bold',
  },
});
