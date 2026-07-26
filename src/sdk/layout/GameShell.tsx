import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { I18nManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SafeContainer } from '@/components/common/SafeContainer';
import { BackButton } from '@/components/common/BackButton';
import { HudPill, hudTextStyle } from '@/components/common/HudPill';
import { Star } from '@/components/common/Star';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import { GameShellContext, type GameShellApi } from './GameShellContext';
import { GameOverlay } from './GameOverlay';
import type { GameShellProps, OverlaySlot } from './types';

/**
 * Shell games used to render an AppBar: a full-width tinted strip holding a
 * centred game title and a bare score number. That made the five shell games
 * look like a different app from the six bare ones, which float a back button
 * top-start and a HudPill top-end over the playfield.
 *
 * They now share the bare layout. The title is gone on purpose — the child just
 * tapped the tile to get here, so naming the game again is chrome that costs a
 * whole row of playfield and tells them nothing.
 */
export function GameShell({
  background = COLORS.background.light,
  showBack = true,
  header,
  onBack,
  onPause,
  children,
}: GameShellProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

  const hasHud = header != null || score != null || onPause != null;
  // `safeReset` zeroes SafeContainer's padding so the playfield runs edge to
  // edge, which also removes the safe-area inset the absolute HUD would have
  // inherited. Offset it manually, the same way BackButton does, or the pill
  // renders under the status bar and the notch.
  const endInset = I18nManager.isRTL ? insets.left : insets.right;

  return (
    <GameShellContext.Provider value={api}>
      {/* SafeContainer's default padding is reset so the playfield runs edge to
          edge beneath the floating controls. */}
      <SafeContainer backgroundColor={background} style={styles.safeReset}>
        <View style={styles.content}>{children}</View>

        {showBack && onBack ? <BackButton onPress={onBack} /> : null}

        {hasHud ? (
          <View
            style={[
              styles.hud,
              { top: insets.top + SPACING.xs, end: endInset + SPACING.md },
            ]}
            pointerEvents="box-none"
          >
            {header}
            {score != null ? (
              <HudPill>
                <Star size={18} filled />
                <Text style={hudTextStyle}>{t('common.score', { n: score })}</Text>
              </HudPill>
            ) : null}
            {onPause ? (
              <TouchableOpacity
                onPress={onPause}
                accessibilityRole="button"
                accessibilityLabel={t('common.pause')}
                hitSlop={8}
              >
                <HudPill>
                  <Text style={styles.pause}>⏸️</Text>
                </HudPill>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <GameOverlay visible={activeOverlay != null}>
          {activeOverlay ? overlays[activeOverlay] : null}
        </GameOverlay>
      </SafeContainer>
    </GameShellContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeReset: { padding: 0 },
  content: { flex: 1 },
  // Top-end cluster mirroring the floating back button on the start side.
  // `end` (not `right`) so it follows the reading direction under RTL.
  hud: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pause: { fontSize: FONT_SIZES.md },
});
