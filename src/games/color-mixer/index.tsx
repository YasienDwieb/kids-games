import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
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
  awardStars,
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
  ChallengeSuccess,
} from './components';
import { useColorMixer, useChallengeMode } from './hooks';
import { COLORS, DIMENSIONS } from './constants';
import { MIX_CAP, isChallengeMet, starsFor } from './utils';
import type { ColorId, GameMode, PigmentId, SavedColor } from './types';

export default function ColorMixerGame() {
  const [mode, setMode] = useState<GameMode>('freeplay');
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  // Discoveries are a free-play reward. During a challenge a full-screen celebration for
  // some *other* color interrupts the one the child is actually working on.
  const inChallenge = mode === 'challenge';
  const mixer = useColorMixer({ detectDiscoveries: !inChallenge });
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

  // Bumped whenever a full pot refuses a drop, so the zone can shake.
  const [rejectedAt, setRejectedAt] = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // The mixing zone is sized from the space the play area actually gets, not a fixed
  // number: in challenge mode the landscape left panel has ~180dp less room, and a hard
  // 180 pushed the zone and its action buttons off the bottom of the screen.
  const [zoneSize, setZoneSize] = useState(DIMENSIONS.MIXING_ZONE_MAX);

  const handlePlayAreaLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w <= 0 || h <= 0) return;
    const fit = Math.min(w, h) - DIMENSIONS.MIXING_ZONE_MARGIN * 2;
    const next = Math.round(
      Math.max(DIMENSIONS.MIXING_ZONE_MIN, Math.min(DIMENSIONS.MIXING_ZONE_MAX, fit)),
    );
    setZoneSize((prev) => (prev === next ? prev : next));
  }, []);

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

  // A drop the pot cannot take must still answer: sound plus a shake, never silence.
  const refuseDrop = useCallback(() => {
    play('wrong');
    setRejectedAt((n) => n + 1);
  }, [play]);

  const dragColorRef = useRef<PigmentId | null>(null);

  const handleDragStart = useCallback((colorId: PigmentId, _instanceId: string) => {
    dragColorRef.current = colorId;
  }, []);

  const handleDragMove = useCallback((_instanceId: string, _pos: { x: number; y: number }) => {
  }, []);

  const handleDragEnd = useCallback(
    (_instanceId: string, pos: { x: number; y: number }) => {
      if (dragColorRef.current && isInsideZone(pos)) {
        if (mixer.potFull) refuseDrop();
        else {
          // The core action of the game: every drop lands with a soft bloop.
          mixer.addPigment(dragColorRef.current);
          play('balloon');
        }
      }
      dragColorRef.current = null;
    },
    [isInsideZone, mixer.addPigment, mixer.potFull, play, refuseDrop],
  );

  // Discovering a famous color is free play's reward moment — it gets a cue, not silence.
  useEffect(() => {
    if (!mixer.newDiscovery) return;
    play('success');
    void awardStars('color-mixer');
  }, [mixer.newDiscovery, play]);

  const GHOST_SIZE = DIMENSIONS.PALETTE_ITEM_SIZE;

  const addSavedToMix = useCallback(
    (saved: SavedColor) => {
      if (mixer.potFull) {
        refuseDrop();
        return;
      }
      mixer.addSavedColor(saved);
      play('pop');
    },
    [mixer.addSavedColor, mixer.potFull, play, refuseDrop],
  );

  const handleSavedTap = useCallback(
    (saved: SavedColor) => addSavedToMix(saved),
    [addSavedToMix],
  );

  const liftedSaved = useRef<SavedColor | null>(null);

  const handleSavedLiftStart = useCallback(
    (saved: SavedColor, x: number, y: number) => {
      ghostPos.setValue({ x: x - GHOST_SIZE / 2, y: y - GHOST_SIZE / 2 });
      liftedSaved.current = saved;
      setLiftedHex(saved.hex);
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
      const saved = liftedSaved.current;
      liftedSaved.current = null;
      if (saved && isInsideZone({ x, y })) addSavedToMix(saved);
      setLiftedHex(null);
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
          if (COLORS[id as ColorId]?.isPrimary) {
            mixer.addPigment(id as PigmentId);
            return;
          }
          const saved = mixer.savedColors.find((s) => s.id === id);
          if (saved) mixer.addSavedColor(saved);
          return;
        }
      }
    },
    [isPositionInBounds, mixer.savedColors, mixer.addPigment, mixer.addSavedColor],
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

  // Success detection lives here, not in ChallengeMode: the celebration has to cover the
  // whole game, and in landscape ChallengeMode is only a ~76dp strip.
  const activeChallenge = mode === 'challenge' && !showChallengePicker ? challenge.currentChallenge : null;
  const challengeTargetHex = activeChallenge ? COLORS[activeChallenge.targetColor].hex : null;
  const stars = challengeTargetHex ? starsFor(mixer.currentMixHex, challengeTargetHex) : 0;
  const canFinishChallenge = !!challengeTargetHex && isChallengeMet(mixer.currentMixHex, challengeTargetHex);
  const [showSuccess, setShowSuccess] = useState(false);

  // Completion is explicit. It used to fire on a timer the moment the mix passed, which
  // ejected a child at their first passing star before they could refine it — and, because
  // the effect that set the flag also listed it as a dependency, its own cleanup cancelled
  // that timer, so the celebration never dismissed at all.
  const finishChallenge = useCallback(() => {
    if (!canFinishChallenge) return;
    play('win');
    void awardStars('color-mixer');
    setShowSuccess(true);
  }, [canFinishChallenge, play]);

  const dismissSuccess = useCallback(() => {
    setShowSuccess(false);
    handleChallengeComplete();
  }, [handleChallengeComplete]);

  useEffect(() => {
    if (!activeChallenge) setShowSuccess(false);
  }, [activeChallenge]);

  // Page coordinates measured before a mode/orientation change are wrong afterwards:
  // drops then silently miss the zone. Drop them and let onLayout re-measure.
  const invalidateMeasurements = useCallback(() => {
    zoneRect.current = { x: 0, y: 0, width: 0, height: 0 };
    palettePositions.current.clear();
  }, []);

  useEffect(invalidateMeasurements, [invalidateMeasurements, landscape, mode, showChallengePicker]);

  const handleSwitchMode = useCallback(
    (newMode: GameMode) => {
      invalidateMeasurements();
      setMode(newMode);
      mixer.clearContinuousMix();
      challenge.clearChallenge();
      setShowChallengePicker(newMode === 'challenge');
    },
    [mixer.clearContinuousMix, challenge.clearChallenge, invalidateMeasurements],
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

  const challengeBlock = activeChallenge ? (
    <ChallengeMode
      currentChallenge={activeChallenge}
      currentMixHex={mixer.currentMixHex}
      stars={stars}
      landscape={landscape}
      onBack={() => setShowChallengePicker(true)}
    />
  ) : null;

  const mixingZoneBlock = (
    <View style={styles.playArea} onLayout={handlePlayAreaLayout}>
      <MixingZone
        size={zoneSize}
        currentMixHex={mixer.currentMixHex}
        dropCount={mixer.mixLog.length}
        dropCap={MIX_CAP}
        rejectedAt={rejectedAt}
        onLayout={handleZoneLayout}
        onResultDragEnd={handleResultDragEnd}
      />
    </View>
  );

  const actionsBlock = (
    <View style={styles.actions}>
      {mixer.potFull && (
        <Text style={styles.potFull} numberOfLines={2}>
          {t('color-mixer:mixingZone.potFull')}
        </Text>
      )}
      {canFinishChallenge && (
        <PressableButton
          label={t('color-mixer:actions.done')}
          accent="green"
          onPress={finishChallenge}
        />
      )}
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
      dimmed={mixer.potFull}
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

      <ChallengeSuccess
        visible={showSuccess}
        targetHex={challengeTargetHex ?? '#FFFFFF'}
        targetName={activeChallenge ? t(`color-mixer:colors.${activeChallenge.targetColor}`) : ''}
        stars={stars}
        onDismiss={dismissSuccess}
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
  potFull: {
    flexShrink: 1,
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    color: TOKENS.inkSoft,
    textAlign: 'center',
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
