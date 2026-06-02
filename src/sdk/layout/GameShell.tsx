import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeContainer } from '@/components/common/SafeContainer';
import { BackButton } from '@/components/common/BackButton';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { GameShellContext, type GameShellApi } from './GameShellContext';
import { GameOverlay } from './GameOverlay';
import type { GameShellProps, OverlaySlot } from './types';

// Adaptation notes:
// 1. BackButton has `position: 'absolute'` baked into its own styles (top: SPACING.xxl,
//    left: SPACING.md). It cannot participate in flex flow, so it is rendered as a sibling
//    to the headerRow — it positions itself absolutely over the shell.
//    The headerRow left padding is set to SPACING.md + TOUCH_TARGET width to prevent title
//    from underlapping the back button. The onPress prop is required (non-optional) on
//    BackButton, so when showBack is false we simply omit it.
// 2. SafeContainer accepts `style?: ViewStyle` and has its own `padding: SPACING.md`.
//    We override padding to 0 via the style prop to avoid double-padding — the shell
//    manages its own internal spacing. Background is passed via the `backgroundColor` prop
//    (SafeContainer accepts that directly).

export function GameShell({
  title,
  background = COLORS.background.light,
  showBack = true,
  header,
  onBack,
  onPause,
  children,
}: GameShellProps) {
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
        {/* BackButton is absolutely positioned by its own styles — render as a sibling
            so it floats over the shell without disrupting flex children. */}
        {showBack && onBack ? <BackButton onPress={onBack} /> : null}

        <View style={styles.headerRow}>
          <Text style={[styles.title, !title && styles.hidden]}>{title ?? ''}</Text>
          <View style={styles.headerSlot}>
            {header}
            {score != null ? <Text style={styles.score}>{score}</Text> : null}
            {onPause ? (
              <TouchableOpacity onPress={onPause} accessibilityLabel="Pause" hitSlop={8}>
                <Text style={styles.pause}>⏸️</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Left padding reserves space for the absolutely-positioned BackButton
    // (BackButton left: SPACING.md=16, width: TOUCH_TARGET.recommended=64 → 80px total)
    paddingLeft: SPACING.md + 64 + SPACING.sm,
    paddingRight: SPACING.md,
    minHeight: 56,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  hidden: { opacity: 0 },
  headerSlot: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  score: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text.primary },
  pause: { fontSize: FONT_SIZES.lg },
  content: { flex: 1 },
});
