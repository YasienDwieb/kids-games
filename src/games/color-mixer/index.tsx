import { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS as TOKENS,
  FONTS,
  SPACING,
  TOUCH_TARGET,
  Chip,
  IconButton,
  PressableButton,
  useScreenBack,
  useSound,
  useTranslation,
} from '@/sdk';
import {
  ColorBlob,
  ColorPalette,
  MixingZone,
  DiscoveryCelebration,
  ColorCollection,
  ColorNamingDialog,
  ChallengeMode,
  ChallengePicker,
} from './components';
import { useColorMixer, useChallengeMode } from './hooks';
import { COLORS, DIMENSIONS } from './constants';
import type { ColorId, GameMode } from './types';

export default function ColorMixerGame() {
  const mixer = useColorMixer();
  const challenge = useChallengeMode();
  const insets = useSafeAreaInsets();
  const { play } = useSound();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  // Lifted-ghost overlay for dragging a saved color up into the mixing zone.
  // Rendered at the root (outside the palette's clipping ScrollView) so it isn't cut off.
  const [liftedHex, setLiftedHex] = useState<string | null>(null);
  const ghostPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const [mode, setMode] = useState<GameMode>('freeplay');
  const [showCollection, setShowCollection] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const zoneRect = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const palettePositions = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  const handleZoneLayout = useCallback(
    (pos: { x: number; y: number; width: number; height: number }) => {
      zoneRect.current = pos;
    },
    [],
  );

  const isInsideZone = useCallback((pos: { x: number; y: number }) => {
    const z = zoneRect.current;
    const centerX = z.x + z.width / 2;
    const centerY = z.y + z.height / 2;
    const radius = z.width / 2;
    const dx = pos.x - centerX;
    const dy = pos.y - centerY;
    return dx * dx + dy * dy <= radius * radius;
  }, []);

  const dragColorRef = useRef<ColorId | null>(null);

  const handleDragStart = useCallback((colorId: ColorId, _instanceId: string) => {
    dragColorRef.current = colorId;
  }, []);

  const handleDragMove = useCallback((_instanceId: string, _pos: { x: number; y: number }) => {
  }, []);

  const handleDragEnd = useCallback(
    (_instanceId: string, pos: { x: number; y: number }) => {
      if (dragColorRef.current && isInsideZone(pos)) {
        mixer.addColorToContinuousMix(COLORS[dragColorRef.current].hex);
      }
      dragColorRef.current = null;
    },
    [isInsideZone, mixer.addColorToContinuousMix],
  );

  const GHOST_SIZE = DIMENSIONS.PALETTE_ITEM_SIZE;

  const addSavedToMix = useCallback(
    (hex: string) => {
      mixer.addColorToContinuousMix(hex);
      play('pop');
    },
    [mixer.addColorToContinuousMix, play],
  );

  const handleSavedTap = useCallback(
    (hex: string) => addSavedToMix(hex),
    [addSavedToMix],
  );

  const handleSavedLiftStart = useCallback(
    (hex: string, x: number, y: number) => {
      ghostPos.setValue({ x: x - GHOST_SIZE / 2, y: y - GHOST_SIZE / 2 });
      setLiftedHex(hex);
    },
    [GHOST_SIZE, ghostPos],
  );

  const handleSavedLiftMove = useCallback(
    (x: number, y: number) => {
      ghostPos.setValue({ x: x - GHOST_SIZE / 2, y: y - GHOST_SIZE / 2 });
    },
    [GHOST_SIZE, ghostPos],
  );

  const handleSavedLiftEnd = useCallback(
    (x: number, y: number) => {
      setLiftedHex((hex) => {
        if (hex && isInsideZone({ x, y })) addSavedToMix(hex);
        return null;
      });
    },
    [isInsideZone, addSavedToMix],
  );

  const isPositionInBounds = useCallback(
    (
      pos: { x: number; y: number },
      bounds: { x: number; y: number; width: number; height: number },
    ) =>
      pos.x >= bounds.x &&
      pos.x <= bounds.x + bounds.width &&
      pos.y >= bounds.y &&
      pos.y <= bounds.y + bounds.height,
    [],
  );

  const handleResultDragEnd = useCallback(
    (pos: { x: number; y: number }) => {
      for (const [id, bounds] of palettePositions.current.entries()) {
        if (isPositionInBounds(pos, bounds)) {
          const targetHex =
            COLORS[id as ColorId]?.hex ?? mixer.savedColors.find((s) => s.id === id)?.hex;
          if (targetHex) {
            mixer.addColorToContinuousMix(targetHex);
          }
          return;
        }
      }
    },
    [isPositionInBounds, mixer.savedColors, mixer.addColorToContinuousMix],
  );

  const handleSaveColor = useCallback(
    (name: string) => {
      // Keep the current mix so the child can keep building on top of it.
      mixer.saveCurrentMix(name);
      setSaveDialogOpen(false);
    },
    [mixer.saveCurrentMix],
  );

  const handleChallengeComplete = useCallback(() => {
    challenge.markChallengeComplete();
    setShowChallengePicker(true);
  }, [challenge.markChallengeComplete]);

  const handleSwitchMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      mixer.clearContinuousMix();
      challenge.clearChallenge();
      setShowChallengePicker(newMode === 'challenge');
    },
    [mixer.clearContinuousMix, challenge.clearChallenge],
  );

  // Back steps up one internal level (challenge → picker → free play) before home.
  useScreenBack(() => {
    if (showChallengePicker) {
      handleSwitchMode('freeplay');
      return true;
    }
    if (mode === 'challenge' && challenge.currentChallenge) {
      setShowChallengePicker(true);
      return true;
    }
    return false;
  });

  if (mode === 'challenge' && showChallengePicker) {
    return (
      <View style={styles.root}>
        <ChallengePicker
          challenges={challenge.challenges}
          completedChallenges={challenge.completedChallenges}
          onSelectChallenge={(c) => {
            challenge.selectChallenge(c);
            mixer.clearContinuousMix();
            setShowChallengePicker(false);
          }}
          onBack={() => handleSwitchMode('freeplay')}
        />
      </View>
    );
  }

  // Shared inner content blocks — used in both portrait and landscape layouts.
  const headerBlock = (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
      {/* reserves room for the floating BackButton */}
      <View style={styles.headerSide} />
      <Text style={styles.title}>{t('color-mixer:title')}</Text>
      <View style={styles.headerSide}>
        <IconButton
          glyph="📚"
          onPress={() => setShowCollection(true)}
          accessibilityLabel={t('color-mixer:header.myColors')}
        />
      </View>
    </View>
  );

  const modeToggleBlock = (
    <View style={styles.modeToggle}>
      <Chip
        label={t('color-mixer:mode.freeplay')}
        active={mode === 'freeplay'}
        onPress={() => handleSwitchMode('freeplay')}
      />
      <Chip
        label={t('color-mixer:mode.challenges')}
        active={mode === 'challenge'}
        onPress={() => handleSwitchMode('challenge')}
      />
    </View>
  );

  const challengeBlock = mode === 'challenge' && challenge.currentChallenge ? (
    <ChallengeMode
      currentChallenge={challenge.currentChallenge}
      currentMixHex={mixer.currentMixHex}
      onChallengeComplete={handleChallengeComplete}
      onBack={() => setShowChallengePicker(true)}
    />
  ) : null;

  const mixingZoneBlock = (
    <View style={styles.playArea}>
      <MixingZone
        size={DIMENSIONS.MIXING_ZONE_SIZE}
        currentMixHex={mixer.currentMixHex}
        onLayout={handleZoneLayout}
        onResultDragEnd={handleResultDragEnd}
      />
    </View>
  );

  const actionsBlock = (
    <View style={styles.actions}>
      {mixer.canUndo && (
        <PressableButton label={t('color-mixer:actions.undo')} variant="ghost" onPress={mixer.undoLastMix} />
      )}
      {mixer.currentMixHex && (
        <PressableButton
          label={t('color-mixer:actions.clear')}
          variant="ghost"
          onPress={mixer.clearContinuousMix}
        />
      )}
      {mixer.currentMixHex && (
        <PressableButton
          label={t('color-mixer:actions.save')}
          accent="blue"
          onPress={() => setSaveDialogOpen(true)}
        />
      )}
    </View>
  );

  const paletteBlock = (
    <ColorPalette
      availableColors={mixer.unlockedColors}
      onColorDragStart={handleDragStart}
      onColorDragMove={handleDragMove}
      onColorDragEnd={handleDragEnd}
      savedColors={mixer.savedColors}
      onSavedTap={handleSavedTap}
      onSavedLiftStart={handleSavedLiftStart}
      onSavedLiftMove={handleSavedLiftMove}
      onSavedLiftEnd={handleSavedLiftEnd}
      paletteItemPositions={palettePositions}
      landscape={landscape}
    />
  );

  return (
    <View style={styles.root}>
      <View style={[styles.container, landscape && styles.containerLandscape]}>
        {landscape ? (
          /* ── Landscape: left = mixing zone, right = palette ── */
          <>
            <View style={styles.leftPanel}>
              {headerBlock}
              {modeToggleBlock}
              {challengeBlock}
              {mixingZoneBlock}
              {actionsBlock}
            </View>
            <View style={styles.rightPanel}>
              {paletteBlock}
            </View>
          </>
        ) : (
          /* ── Portrait: stacked ── */
          <>
            {headerBlock}
            {modeToggleBlock}
            {challengeBlock}
            {mixingZoneBlock}
            {actionsBlock}
            <View style={styles.paletteContainer}>
              {paletteBlock}
            </View>
          </>
        )}
      </View>

      {liftedHex && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { width: GHOST_SIZE, height: GHOST_SIZE, transform: ghostPos.getTranslateTransform() },
          ]}
        >
          <ColorBlob color={liftedHex} size={GHOST_SIZE} showShine />
        </Animated.View>
      )}

      {/* Modals */}
      <DiscoveryCelebration
        colorId={mixer.newDiscovery}
        visible={!!mixer.newDiscovery}
        onComplete={mixer.acknowledgeDiscovery}
      />

      <ColorNamingDialog
        visible={saveDialogOpen}
        colorHex={mixer.currentMixHex}
        onSave={handleSaveColor}
        onCancel={() => setSaveDialogOpen(false)}
      />

      <ColorCollection
        visible={showCollection}
        discoveries={mixer.discoveries}
        savedColors={mixer.savedColors}
        onDeleteSaved={mixer.deleteSavedColor}
        onClose={() => setShowCollection(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  // Landscape: side-by-side row; left = mixing area, right = palette panel
  containerLandscape: {
    flexDirection: 'row',
  },
  // Left panel: header + mode toggle + optional challenge + mixing zone + actions
  leftPanel: {
    flex: 1,
    overflow: 'visible',
  },
  // Right panel: palette — fixed width so the mixing zone gets the remaining space
  rightPanel: {
    width: '40%',
    justifyContent: 'center',
    zIndex: 10,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOUCH_TARGET.recommended,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSide: {
    width: TOUCH_TARGET.recommended,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: TOKENS.ink,
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: SPACING.sm,
    marginBottom: 8,
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: 20,
    paddingBottom: 12,
    minHeight: 56,
  },
  paletteContainer: {
    zIndex: 10,
    overflow: 'visible',
  },
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
});
