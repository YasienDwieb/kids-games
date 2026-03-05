import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ColorPalette,
  MixingZone,
  DiscoveryCelebration,
  ColorCollection,
  ChallengeMode,
  ChallengePicker,
} from './components';
import { useColorMixer, useChallengeMode } from './hooks';
import { COLORS, DIMENSIONS, GAME_BG } from './constants';
import type { ColorId, GameMode, SavedColor } from './types';

export default function ColorMixerGame() {
  const mixer = useColorMixer();
  const challenge = useChallengeMode();

  const [mode, setMode] = useState<GameMode>('freeplay');
  const [showCollection, setShowCollection] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

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
        if (mixer.mixingZone.resultColor) {
          mixer.clearZone();
        }
        mixer.addColorToZone(dragColorRef.current);
        mixer.addColorToContinuousMix(COLORS[dragColorRef.current].hex);
      }
      dragColorRef.current = null;
    },
    [isInsideZone, mixer.mixingZone.resultColor, mixer.clearZone, mixer.addColorToZone, mixer.addColorToContinuousMix],
  );

  const handleSavedColorDragEnd = useCallback(
    (saved: SavedColor, pos: { x: number; y: number }) => {
      if (isInsideZone(pos)) {
        mixer.addColorToContinuousMix(saved.hex);
      }
    },
    [isInsideZone, mixer.addColorToContinuousMix],
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

  const handleChallengeComplete = useCallback(() => {
    challenge.markChallengeComplete();
    setShowChallengePicker(true);
  }, [challenge.markChallengeComplete]);

  const handleSwitchMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      mixer.clearZone();
      mixer.clearContinuousMix();
      if (newMode === 'challenge') {
        setShowChallengePicker(true);
        challenge.clearChallenge();
      } else {
        setShowChallengePicker(false);
        challenge.clearChallenge();
      }
    },
    [mixer.clearZone, mixer.clearContinuousMix, challenge.clearChallenge],
  );

  if (mode === 'challenge' && showChallengePicker) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <ChallengePicker
          challenges={challenge.challenges}
          completedChallenges={challenge.completedChallenges}
          onSelectChallenge={(c) => {
            challenge.selectChallenge(c);
            mixer.clearZone();
            mixer.clearContinuousMix();
            setShowChallengePicker(false);
          }}
          onBack={() => handleSwitchMode('freeplay')}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Color Mixer</Text>
          <Pressable
            onPress={() => setShowCollection(true)}
            style={styles.collectionButton}
          >
            <Text style={styles.collectionIcon}>📚</Text>
          </Pressable>
        </View>

        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => handleSwitchMode('freeplay')}
            style={[styles.modeButton, mode === 'freeplay' && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, mode === 'freeplay' && styles.modeTextActive]}>
              Free Play
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleSwitchMode('challenge')}
            style={[styles.modeButton, mode === 'challenge' && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, mode === 'challenge' && styles.modeTextActive]}>
              Challenges
            </Text>
          </Pressable>
        </View>

        {/* Challenge target */}
        {mode === 'challenge' && challenge.currentChallenge && (
          <ChallengeMode
            currentChallenge={challenge.currentChallenge}
            resultColor={mixer.mixingZone.resultColor}
            onChallengeComplete={handleChallengeComplete}
            onBack={() => setShowChallengePicker(true)}
          />
        )}

        {/* Play area */}
        <View style={styles.playArea}>
          <MixingZone
            size={DIMENSIONS.MIXING_ZONE_SIZE}
            colorsInZone={mixer.mixingZone.colorsInZone}
            resultColor={mixer.mixingZone.resultColor}
            isMixing={mixer.mixingZone.isMixing}
            onLayout={handleZoneLayout}
            currentMixHex={mixer.currentMixHex}
            onResultDragEnd={handleResultDragEnd}
            showDraggableResult={true}
          />
        </View>

        {/* Continuous mix action buttons */}
        <View style={styles.actions}>
          {mixer.canUndo && (
            <TouchableOpacity style={styles.actionButton} onPress={mixer.undoLastMix}>
              <Text style={styles.actionIcon}>↩️</Text>
              <Text style={styles.actionLabel}>Undo</Text>
            </TouchableOpacity>
          )}
          {mixer.currentMixHex && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => { mixer.clearZone(); mixer.clearContinuousMix(); }}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={styles.actionLabel}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Palette */}
        <View style={styles.paletteContainer}>
          <ColorPalette
            availableColors={mixer.unlockedColors}
            onColorDragStart={handleDragStart}
            onColorDragMove={handleDragMove}
            onColorDragEnd={handleDragEnd}
            savedColors={mixer.savedColors}
            onSavedColorDragEnd={handleSavedColorDragEnd}
            paletteItemPositions={palettePositions}
          />
        </View>
      </View>

      {/* Modals */}
      <DiscoveryCelebration
        colorId={mixer.newDiscovery}
        visible={!!mixer.newDiscovery}
        onComplete={mixer.acknowledgeDiscovery}
      />

      <ColorCollection
        visible={showCollection}
        unlockedColors={mixer.unlockedColors}
        onClose={() => setShowCollection(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: GAME_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#424242',
  },
  collectionButton: {
    position: 'absolute',
    right: 16,
    top: 52,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionIcon: {
    fontSize: 22,
  },
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    padding: 3,
    marginBottom: 8,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 17,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  modeTextActive: {
    color: '#424242',
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
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    minHeight: 56,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  paletteContainer: {
    zIndex: 10,
    overflow: 'visible',
  },
});
