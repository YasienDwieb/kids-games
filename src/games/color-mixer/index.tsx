import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BigButton } from '../../components/common';
import {
  ColorPalette,
  MixingZone,
  DiscoveryCelebration,
  ColorCollection,
  ChallengeMode,
  ChallengePicker,
} from './components';
import { useColorMixer, useChallengeMode } from './hooks';
import { DIMENSIONS, GAME_BG } from './constants';
import type { ColorId } from './types';
import type { GameMode } from './types';

export default function ColorMixerGame() {
  const mixer = useColorMixer();
  const challenge = useChallengeMode();

  const [mode, setMode] = useState<GameMode>('freeplay');
  const [showCollection, setShowCollection] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  // Track mixing zone bounds for hit testing
  const zoneRect = useRef({ x: 0, y: 0, width: 0, height: 0 });

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

  // Drag tracking — we only care about which color was dragged
  const dragColorRef = useRef<ColorId | null>(null);

  const handleDragStart = useCallback((colorId: ColorId, _instanceId: string) => {
    dragColorRef.current = colorId;
  }, []);

  const handleDragMove = useCallback((_instanceId: string, _pos: { x: number; y: number }) => {
    // Could add visual feedback on zone hover here
  }, []);

  const handleDragEnd = useCallback(
    (_instanceId: string, pos: { x: number; y: number }) => {
      if (dragColorRef.current && isInsideZone(pos)) {
        mixer.addColorToZone(dragColorRef.current);
      }
      dragColorRef.current = null;
    },
    [isInsideZone, mixer.addColorToZone],
  );

  const handleMix = useCallback(() => {
    mixer.mixColors();
  }, [mixer.mixColors]);

  const handleClearZone = useCallback(() => {
    mixer.clearZone();
  }, [mixer.clearZone]);

  const handleChallengeComplete = useCallback(() => {
    challenge.markChallengeComplete();
    setShowChallengePicker(true);
  }, [challenge.markChallengeComplete]);

  const handleSwitchMode = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      mixer.clearZone();
      if (newMode === 'challenge') {
        setShowChallengePicker(true);
        challenge.clearChallenge();
      } else {
        setShowChallengePicker(false);
        challenge.clearChallenge();
      }
    },
    [mixer.clearZone, challenge.clearChallenge],
  );

  const showMixButton =
    mixer.mixingZone.colorsInZone.length >= 2 && !mixer.mixingZone.isMixing;
  const showClearButton =
    (mixer.mixingZone.colorsInZone.length > 0 || mixer.mixingZone.resultColor) &&
    !mixer.mixingZone.isMixing;

  // Challenge picker as full-screen view
  if (mode === 'challenge' && showChallengePicker) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <ChallengePicker
          challenges={challenge.challenges}
          completedChallenges={challenge.completedChallenges}
          onSelectChallenge={(c) => {
            challenge.selectChallenge(c);
            mixer.clearZone();
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
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {showMixButton && (
            <BigButton title="Mix!" onPress={handleMix} color="#4CAF50" />
          )}
          {showClearButton && (
            <Pressable onPress={handleClearZone} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Palette */}
        <ColorPalette
          availableColors={mixer.unlockedColors}
          onColorDragStart={handleDragStart}
          onColorDragMove={handleDragMove}
          onColorDragEnd={handleDragEnd}
        />
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
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
    minHeight: 56,
  },
  clearButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
});
