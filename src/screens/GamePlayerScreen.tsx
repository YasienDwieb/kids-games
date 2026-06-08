import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  getGame,
  GameShell,
  ScreenBackContext,
  useTranslation,
  gameName,
  type BackInterceptor,
} from '@/sdk';
import { BackButton } from '../components/common';
import { COLORS, FONT_SIZES } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

export function GamePlayerScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const { t } = useTranslation();
  const game = getGame(gameId);

  // Games register a back interceptor; if it consumes the press (e.g. pops an
  // internal screen) we stay, otherwise we navigate up to Home.
  const interceptorRef = useRef<BackInterceptor | null>(null);
  const setInterceptor = useCallback((fn: BackInterceptor | null) => {
    interceptorRef.current = fn;
  }, []);
  const handleBack = useCallback(() => {
    if (interceptorRef.current?.()) return;
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () =>
      interceptorRef.current?.() ? true : false,
    );
    return () => sub.remove();
  }, []);

  if (!game) {
    return (
      <View style={styles.container}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('player.notFound')}</Text>
        </View>
      </View>
    );
  }

  const Game = game.component;
  const layout = game.layout ?? {};

  return (
    <ScreenBackContext.Provider value={setInterceptor}>
      {layout.mode === 'bare' ? (
        // Bare mode: game composes its own canvas; we float a back button.
        <View style={[styles.container, { backgroundColor: game.backgroundColor }]}>
          <BackButton onPress={handleBack} />
          <Game />
        </View>
      ) : (
        <GameShell
          title={layout.title ?? gameName(game)}
          background={game.backgroundColor}
          showBack={layout.showBack ?? true}
          onBack={handleBack}
        >
          <Game />
        </GameShell>
      )}
    </ScreenBackContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.light },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: FONT_SIZES.lg, color: COLORS.text.secondary, fontWeight: 'bold' },
});
