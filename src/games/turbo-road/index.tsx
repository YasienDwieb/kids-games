/* Turbo Road — a sunny road trip (bare mode: the GamePlayer screen renders only
   the floating BackButton; this component owns the rest of the layout).

   Views: trip (the map, in pictures) → drive (a race against two rivals:
   Playfield + Hud + progress rail) → back to the map, with the car one stop
   further on. A car picker opens from the map. Places show as medals; every
   finish moves the trip on, and the place sets the stars. Progression is the
   SDK `useLevels` checkpoint. */

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import {
  AreaDemo,
  COLORS,
  currentLanguage,
  EmojiImage,
  levelsFromGenerator,
  ResumePrompt,
  SafeContainer,
  tierFactor,
  useAdaptive,
  useGuide,
  useLevels,
  useLoopSound,
  useRoundEnd,
  useScreenBack,
  useSound,
  useTranslation,
} from '@/sdk';
import { CarPicker } from './components/CarPicker';
import { Hud } from './components/Hud';
import { PauseOverlay } from './components/PauseOverlay';
import { ProgressBar } from './components/ProgressBar';
import { TripScreen } from './components/TripScreen';
import { carsUnlockedAt, useGarage } from './hooks/useGarage';
import { useRaceGame, type RaceResult } from './hooks/useRaceGame';
import { generateLevel } from './utils/levels';
import { CARS, FINISH_CELEBRATION_MS, PLACE_MEDAL, THEMES } from './constants';
import { drivePhrase } from './phrase';
import type { CarDef, CarId, LevelData, RoadTheme } from './types';

type ViewName = 'trip' | 'drive' | 'cars';

// three + react-three-fiber + expo-gl are only evaluated once a drive actually uses the 3D road.
const Playfield3D = lazy(() =>
  import('./components/Playfield3D').then((m) => ({ default: m.Playfield3D })),
);

/* One drive — keyed by level+attempt from the root so each one gets a fresh
   world + loop. */
function Drive({
  level,
  levelNumber,
  theme,
  playerEmoji,
  car,
  onFinish,
  onExit,
}: {
  level: LevelData;
  levelNumber: number;
  theme: RoadTheme;
  playerEmoji: string;
  car: CarDef;
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

  // Says what to do as the drive starts; the first time, a hand sweeps side to
  // side to show the steering, and both come back if the child stops steering.
  const guide = useGuide({
    id: 'turbo-road',
    phrase: drivePhrase(currentLanguage()),
    roundKey: levelNumber,
    active: ui.phase === 'racing',
  });

  return (
    <View style={styles.flex} onTouchStart={guide.poke} onTouchMove={guide.poke}>
      <Suspense fallback={<View style={[styles.flex, { backgroundColor: theme.sky }]} />}>
        <Playfield3D
          carId={car.id}
          theme={theme}
          level={level}
          ui={ui}
          anim={anim}
          playerEmoji={playerEmoji}
          onSteerTo={steerTo}
        />
      </Suspense>
      {guide.showDemo ? <AreaDemo mode="sweep" /> : null}
      {/* Hud is not inset-aware; float it inside the safe area over the
          full-bleed playfield. pointerEvents box-none keeps steering live. */}
      <SafeContainer backgroundColor="transparent" style={styles.hudLayer}>
        <Hud place={ui.place} shieldActive={ui.shieldActive} magnetActive={ui.magnetActive} onPause={pause} />
      </SafeContainer>
      <ProgressBar progress={ui.progress} />
      {ui.phase === 'paused' && <PauseOverlay onResume={resume} onExit={onExit} />}
    </View>
  );
}

export default function TurboRoadGame() {
  const { play } = useSound();
  const { t } = useTranslation();
  const source = useMemo(() => levelsFromGenerator(generateLevel), []);
  const { status, data, level, start, startOver, advance } = useLevels({
    gameId: 'turbo-road',
    source,
  });
  const { garage, selectCar } = useGarage();
  // Adaptive pace: an easy drive nudges the road a little faster, a bumpy one
  // eases it. Layered on the age-band speed factor.
  const { tier, record } = useAdaptive('turbo-road');
  const roundEnd = useRoundEnd();

  const [view, setView] = useState<ViewName>('trip');
  // Bumped on every drive so replaying the same level remounts <Drive>.
  const [attempt, setAttempt] = useState(0);
  // The celebration waits for the finish-line burst.
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (finishTimer.current) clearTimeout(finishTimer.current);
    },
    [],
  );

  // Back (on-screen button + Android hardware) returns to the map first; only
  // the map lets the press bubble up and exit to Home.
  useScreenBack(() => {
    if (view === 'trip') return false;
    if (finishTimer.current) clearTimeout(finishTimer.current);
    setView('trip');
    return true;
  });

  const unlocked = carsUnlockedAt(level, garage.owned);
  const car: CarDef =
    CARS.find((c) => c.id === garage.selected && unlocked.includes(c.id)) ?? CARS[0];
  const pacedCar = useMemo<CarDef>(
    () => ({ ...car, stats: { ...car.stats, speed: car.stats.speed * tierFactor(tier, 0.05) } }),
    [car, tier],
  );
  const theme: RoadTheme = THEMES[data.theme];

  const handleDrive = useCallback(() => {
    play('transition');
    setAttempt((a) => a + 1);
    setView('drive');
  }, [play]);

  // Fires exactly once per drive: show the place, celebrate after the
  // finish-line burst, then back to the map with the car one stop further on.
  const [finishPlace, setFinishPlace] = useState<1 | 2 | 3 | null>(null);
  const handleFinish = useCallback(
    (r: RaceResult) => {
      if (r.place === 1) record(true);
      else if (r.place === 3) record(false);
      finishTimer.current = setTimeout(() => {
        setFinishPlace(r.place);
        void roundEnd.next(r.place === 1 ? 'big' : 'small', () => {
          setFinishPlace(null);
          advance(r.stars);
          setView('trip');
        });
      }, FINISH_CELEBRATION_MS);
    },
    [advance, record, roundEnd],
  );

  const handleSelectCar = useCallback(
    (id: CarId) => {
      play('pop');
      selectCar(id);
    },
    [play, selectCar],
  );

  const handleExitDrive = useCallback(() => setView('trip'), []);

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

  if (view === 'cars') {
    return (
      <SafeContainer backgroundColor={COLORS.canvas} style={styles.flush}>
        <CarPicker unlocked={unlocked} selected={car.id} onSelect={handleSelectCar} />
      </SafeContainer>
    );
  }

  if (view === 'drive') {
    return (
      <View style={styles.canvas}>
        <Drive
          key={`${level}-${attempt}`}
          level={data}
          levelNumber={level}
          theme={theme}
          playerEmoji={car.emoji}
          car={pacedCar}
          onFinish={handleFinish}
          onExit={handleExitDrive}
        />
        {finishPlace ? (
          <View style={styles.podium} pointerEvents="none" accessible accessibilityLabel={t(`turbo-road:place.p${finishPlace}`)}>
            <EmojiImage emoji={PLACE_MEDAL[finishPlace]} size={120} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <SafeContainer backgroundColor={COLORS.canvas} style={styles.flush}>
      <TripScreen level={level} car={car} onDrive={handleDrive} onCars={() => setView('cars')} />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  canvas: { flex: 1, backgroundColor: COLORS.canvas },
  podium: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
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
