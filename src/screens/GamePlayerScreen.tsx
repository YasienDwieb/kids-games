import { StyleSheet, Text, View, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { getGame } from '../games/registry';
import { COLORS, SPACING, FONT_SIZES, TOUCH_TARGET, BORDER_RADIUS } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

export function GamePlayerScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const game = getGame(gameId);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{'←'}</Text>
      </Pressable>

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
  backButton: {
    position: 'absolute',
    top: SPACING.xxl,
    left: SPACING.md,
    zIndex: 10,
    width: TOUCH_TARGET.recommended,
    height: TOUCH_TARGET.recommended,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  backText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
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
