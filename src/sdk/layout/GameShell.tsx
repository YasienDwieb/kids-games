import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeContainer } from '@/components/common/SafeContainer';
import { AppBar } from '@/components/common/AppBar';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants';
import { GameShellContext, type GameShellApi } from './GameShellContext';
import { GameOverlay } from './GameOverlay';
import type { GameShellProps, OverlaySlot } from './types';

// SafeContainer has its own `padding: SPACING.md`; we reset it to 0 so the shell
// (via AppBar + content) controls internal spacing. Background is passed through
// the SafeContainer `backgroundColor` prop.

export function GameShell({
  title,
  background = COLORS.background.light,
  showBack = true,
  header,
  onBack,
  onPause,
  children,
}: GameShellProps) {
  const { t } = useTranslation();
  const [score, setScore] = useState<number | string | null>(null);
  const [overlays, setOverlays] = useState<Partial<Record<OverlaySlot, ReactNode>>>({});

  const showOverlay = useCallback((slot: OverlaySlot, content: ReactNode) => {
    setOverlays((prev) => ({ ...prev, [slot]: content }));
  }, []);

  const hideOverlay = useCallback((slot: OverlaySlot) => {
    setOverlays((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  }, []);

  const api = useMemo<GameShellApi>(
    () => ({ setScore, showOverlay, hideOverlay }),
    [showOverlay, hideOverlay]
  );

  const activeOverlay = (['error', 'pause', 'win', 'loading'] as OverlaySlot[]).find(
    (slot) => overlays[slot] != null
  );

  return (
    <GameShellContext.Provider value={api}>
      {/* style overrides SafeContainer's default padding: SPACING.md so the shell
          controls all internal layout. backgroundColor is passed as its own prop. */}
      <SafeContainer backgroundColor={background} style={styles.safeReset}>
        <AppBar
          title={title}
          onBack={showBack && onBack ? onBack : undefined}
          right={
            <View style={styles.headerSlot}>
              {header}
              {score != null ? <Text style={styles.score}>{score}</Text> : null}
              {onPause ? (
                <TouchableOpacity onPress={onPause} accessibilityLabel={t('common.pause')} hitSlop={8}>
                  <Text style={styles.pause}>⏸️</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />

        <View style={styles.content}>{children}</View>

        <GameOverlay visible={activeOverlay != null}>
          {activeOverlay ? overlays[activeOverlay] : null}
        </GameOverlay>
      </SafeContainer>
    </GameShellContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeReset: { padding: 0 },
  headerSlot: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  score: { fontFamily: FONTS.display, fontSize: FONT_SIZES.md, color: COLORS.ink },
  pause: { fontSize: FONT_SIZES.md },
  content: { flex: 1 },
});
