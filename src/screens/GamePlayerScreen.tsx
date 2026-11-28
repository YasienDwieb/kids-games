import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import {
  CelebrationProvider,
  ErrorBoundary,
  GameExitContext,
  getGame,
  GameShell,
  ScreenBackContext,
  SoundOverridesContext,
  useTranslation,
  type BackInterceptor,
  type SoundOverrides,
  usePlaySession,
  markSessionEnd,
} from '@/sdk';
import { BackButton } from '../components/common';
import { PlayLimitGate } from './PlayLimitGate';
import { COLORS, FONT_SIZES } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'GamePlayer'>;

const NO_OVERRIDES: SoundOverrides = {};

export function GamePlayerScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const { t } = useTranslation();
  const game = getGame(gameId);
  usePlaySession(game ? gameId : null, 'free');

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

  // Every exit but back says why the session ended (game_end.endedBy).
  const exitAs = useCallback(
    (reason: 'complete' | 'error' | 'limit') => () => {
      markSessionEnd(reason);
      navigation.goBack();
    },
    [navigation],
  );
  const exitComplete = useMemo(() => exitAs('complete'), [exitAs]);

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
  // A game that throws while rendering sends the child back Home instead of closing the app.
  const gameBody = (
    <ErrorBoundary where={`game:${gameId}`} fallback={null} onError={exitAs('error')}>
      <Game />
    </ErrorBoundary>
  );

  return (
    <ScreenBackContext.Provider value={setInterceptor}>
      <GameExitContext.Provider value={exitComplete}>
      <SoundOverridesContext.Provider value={game.sounds ?? NO_OVERRIDES}>
        {/* Celebrations float over the whole screen, in both layout modes. */}
        <CelebrationProvider>
          <PlayLimitGate trackId={gameId} onHome={exitAs('limit')}>
            {layout.mode === 'bare' ? (
              // Bare mode: game composes its own canvas; we float a back button.
              <View style={[styles.container, { backgroundColor: game.backgroundColor }]}>
                <BackButton onPress={handleBack} />
                {gameBody}
              </View>
            ) : (
              <GameShell
                background={game.backgroundColor}
                showBack={layout.showBack ?? true}
                onBack={handleBack}
              >
                {gameBody}
              </GameShell>
            )}
          </PlayLimitGate>
        </CelebrationProvider>
      </SoundOverridesContext.Provider>
      </GameExitContext.Provider>
    </ScreenBackContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.light },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: FONT_SIZES.lg, color: COLORS.text.secondary, fontWeight: 'bold' },
});
