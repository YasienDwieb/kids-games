/* Turbo Road — game root (bare mode: the GamePlayer screen renders only the
   floating BackButton; this component owns the rest of the layout).

   Views: start (road-trip map) → race (Playfield + Hud + ProgressBar, with the
   WinOverlay on top once the race finishes) → garage (cars + trims). Level
   progression is the SDK `useLevels` checkpoint; the coin wallet lives in the
   garage store and is banked exactly once per race in `handleFinish`. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import {
  COLORS,
  levelsFromGenerator,
  ResumePrompt,
  SafeContainer,
  useFreeOrientation,
  useLevels,
  useLoopSound,
  useScreenBack,
  useSound,
  useTilt,
} from '@/sdk';
import { GarageScreen } from './components/GarageScreen';
import { Hud } from './components/Hud';
import { PauseOverlay } from './components/PauseOverlay';
import { Playfield } from './components/Playfield';
import { ProgressBar } from './components/ProgressBar';
import { StartScreen } from './components/StartScreen';
import { WinOverlay } from './components/WinOverlay';
import { useGarage } from './hooks/useGarage';
import { useMissions } from './hooks/useMissions';
import { usePrefs } from './hooks/usePrefs';
import { useRaceGame, type RaceResult } from './hooks/useRaceGame';
import { generateLevel } from './utils/levels';
import {
  CARS,
  FINISH_CELEBRATION_MS,
  THEME_ORDER,
  THEMES,
  TILT_DEADZONE,
  TILT_FULL,
  TRIMS,
} from './constants';
import type {
  CarDef,
  CarId,
  ControlMode,
  LevelData,
  RoadTheme,
  ThemeId,
  TrimDef,
  TrimId,
} from './types';

type ViewName = 'start' | 'race' | 'garage';

/* Inner race screen — keyed by level+attempt from the root so every entry
   into the race view gets a fresh world + rAF loop (useRaceGame restarts on
   level prop identity change; a remount covers the same-level replay case). */
function Race({
  level,
  levelNumber,
  theme,
  playerEmoji,
  car,
  trim,
  control,
  onFinish,
  onExit,
}: {
  level: LevelData;
  levelNumber: number;
  theme: RoadTheme;
  playerEmoji: string;
  car: CarDef;
  trim: TrimDef;
  control: ControlMode;
  onFinish: (result: RaceResult) => void;
  onExit: () => void;
}) {
  const { ui, anim, steerTo, pause, resume } = useRaceGame({ level, car, onFinish });

  // Ambient engine hum (synthesized rumble, no music): runs while driving,
  // revs up under boost, sags after a crash.
  useLoopSound('engine', {
    active: ui.phase === 'racing',
    volume: 0.3,
    rate: ui.boostActive ? 1.3 : ui.slowActive ? 0.72 : 1,
  });

  // Auto-pause when the app goes to background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pause();
    });
    return () => sub.remove();
  }, [pause]);

  // Tilt steering: deadzone (a roughly-level phone holds the center lane,
  // no drift) + a gentle response curve, mapped to a lane target where
  // TILT_FULL g reaches the edge lanes.
  useTilt(control === 'tilt', (tilt) => {
    const mag = Math.abs(tilt);
    if (mag < TILT_DEADZONE) {
      steerTo(1);
      return;
    }
    const n = Math.min(1, (mag - TILT_DEADZONE) / (TILT_FULL - TILT_DEADZONE));
    steerTo(1 + Math.sign(tilt) * Math.pow(n, 1.2));
  });

  return (
    <View style={styles.flex}>
      <Playfield
        theme={theme}
        level={level}
        ui={ui}
        anim={anim}
        playerEmoji={playerEmoji}
        trim={trim}
        onSteerTo={steerTo}
      />
      {/* Hud is not inset-aware; float it inside the safe area over the
          full-bleed playfield. pointerEvents box-none keeps steering live. */}
      <SafeContainer backgroundColor="transparent" style={styles.hudLayer}>
        <Hud
          level={levelNumber}
          place={ui.place}
          coins={ui.coins}
          shieldActive={ui.shieldActive}
          magnetActive={ui.magnetActive}
          onPause={pause}
        />
      </SafeContainer>
      <ProgressBar progress={ui.progress} />
      {ui.phase === 'paused' && <PauseOverlay onResume={resume} onExit={onExit} />}
    </View>
  );
}

export default function TurboRoadGame() {
  // Car games want landscape too — unlock rotation while the game is open.
  useFreeOrientation();

  const { play } = useSound();
  const source = useMemo(() => levelsFromGenerator(generateLevel), []);
  const { status, data, level, score, start, startOver, advance } = useLevels({
    gameId: 'turbo-road',
    source,
  });
  const { garage, selectCar, selectTrim, unlockCar, addCoins } = useGarage();
  const { prefs, setControl } = usePrefs();
  const { missions, recordRace, claim } = useMissions();

  const [view, setView] = useState<ViewName>('start');
  const [result, setResult] = useState<RaceResult | null>(null);
  // Bumped on every race entry so replaying the same level remounts <Race>.
  const [attempt, setAttempt] = useState(0);
  // The win overlay is delayed past the finish-line celebration burst.
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    },
    [],
  );

  // Back (on-screen button + Android hardware) pops internal views first;
  // only the start view lets the press bubble up and exit to Home.
  useScreenBack(() => {
    if (view === 'race' || view === 'garage') {
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
      setResult(null);
      setView('start');
      return true;
    }
    return false;
  });

  const car: CarDef = CARS.find((c) => c.id === garage.selected) ?? CARS[0];
  const trim: TrimDef = TRIMS.find((tr) => tr.id === garage.trim) ?? TRIMS[0];
  const theme: RoadTheme = THEMES[data.theme];
  // One cup per completed 4-level tour; this race awards one when it closes
  // a tour (level 4, 8, 12, …). `level` is the level being played.
  const trophies = Math.floor((level - 1) / 4);
  const cupTheme: ThemeId | undefined =
    level % 4 === 0 ? THEME_ORDER[(level / 4 - 1) % THEME_ORDER.length] : undefined;

  const handleRace = useCallback(() => {
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    setResult(null);
    setAttempt((a) => a + 1);
    setView('race');
  }, []);

  // Fires exactly once per race (the hook guarantees it) — bank the coins,
  // feed the missions, then show the win overlay AFTER the finish-line
  // celebration has had its moment.
  const handleFinish = useCallback(
    (r: RaceResult) => {
      addCoins(r.coins);
      recordRace(r);
      overlayTimer.current = setTimeout(() => setResult(r), FINISH_CELEBRATION_MS);
    },
    [addCoins, recordRace],
  );

  const handleNext = useCallback(() => {
    if (result) advance(result.stars);
    setResult(null);
    setView('start');
  }, [advance, result]);

  const handleGarage = useCallback(() => {
    setResult(null);
    setView('garage');
  }, []);

  const handleGarageDone = useCallback(() => {
    play('pop');
    setView('start');
  }, [play]);

  const handleControlChange = useCallback(
    (mode: ControlMode) => {
      play('pop');
      setControl(mode);
    },
    [play, setControl],
  );

  const handleSelectCar = useCallback(
    (id: CarId) => {
      play('pop');
      selectCar(id);
    },
    [play, selectCar],
  );

  const handleSelectTrim = useCallback(
    (id: TrimId) => {
      play('pop');
      selectTrim(id);
    },
    [play, selectTrim],
  );

  const handleUnlockCar = useCallback(
    (id: CarId) => {
      if (unlockCar(id)) play('success');
    },
    [play, unlockCar],
  );

  const handleClaimMission = useCallback(
    (id: number) => {
      const reward = claim(id);
      if (reward > 0) {
        addCoins(reward);
        play('win');
      }
    },
    [addCoins, claim, play],
  );

  const handleExitRace = useCallback(() => {
    setResult(null);
    setView('start');
  }, []);

  if (status === 'loading') {
    return <View style={styles.canvas} />;
  }

  if (status === 'resumable') {
    return (
      <SafeContainer backgroundColor={COLORS.canvas} style={styles.flush}>
        <ResumePrompt level={level} onContinue={start} onStartOver={startOver} />
      </SafeContainer>
    );
  }

  if (view === 'garage') {
    // GarageScreen brings its own SafeContainer — render it directly.
    return (
      <GarageScreen
        garage={garage}
        trophies={trophies}
        onSelectCar={handleSelectCar}
        onUnlockCar={handleUnlockCar}
        onSelectTrim={handleSelectTrim}
        onDone={handleGarageDone}
      />
    );
  }

  if (view === 'race') {
    return (
      <View style={styles.canvas}>
        <Race
          key={`${level}-${attempt}`}
          level={data}
          levelNumber={level}
          theme={theme}
          playerEmoji={car.emoji}
          car={car}
          trim={trim}
          control={prefs.control}
          onFinish={handleFinish}
          onExit={handleExitRace}
        />
        {result && (
          <WinOverlay
            place={result.place}
            stars={result.stars}
            coinsEarned={result.coins}
            cupTheme={cupTheme}
            onNext={handleNext}
            onGarage={handleGarage}
          />
        )}
      </View>
    );
  }

  return (
    <SafeContainer backgroundColor={COLORS.canvas} style={styles.flush}>
      <StartScreen
        level={level}
        totalStars={score}
        theme={theme}
        playerEmoji={car.emoji}
        trim={trim}
        walletCoins={garage.coins}
        control={prefs.control}
        missions={missions}
        onClaimMission={handleClaimMission}
        onControlChange={handleControlChange}
        onRace={handleRace}
        onGarage={handleGarage}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  canvas: { flex: 1, backgroundColor: COLORS.canvas },
  // SafeContainer ships padding: SPACING.md — flush screens manage their own.
  flush: { padding: 0 },
  hudLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
});
