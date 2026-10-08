/**
 * Turbo Road — 3D playfield (beta, 3D-1 spike).
 *
 * A drop-in replacement for <Playfield> with the same props: the race engine,
 * HUD, overlays and steering contract are untouched; only the rendering moves
 * to a low-poly three.js scene (react-three-fiber + expo-gl) with a chase
 * camera. Everything is primitive geometry for now — real car / prop models
 * come later (3D-2) once this proves smooth on mid-range phones.
 *
 * Per-frame values are read straight from the race loop's Animated.Value
 * channels inside useFrame (both run on the JS thread), so nothing re-renders
 * React per frame. The world (entities, finish line) is ONE group whose z is
 * moved by the travelled distance; dashes and roadside trees are small pools
 * wrapped with the existing dash/decor phases.
 */
import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type { Group, Mesh } from 'three';
import { ACCENTS, COLORS } from '@/sdk';
import type { Animated } from 'react-native';
import type { EntityKind, PlayfieldProps } from '../types';

/** World units → metres. VIEW_DIST (900 units) ≈ 45 m of road ahead. */
const S = 0.05;
const LANE_W = 3;
const ROAD_W = LANE_W * 3;
const AHEAD = 70; // metres of road drawn ahead of the car
const DASH_LEN = 2.2;
const DASH_PERIOD = 6; // metres
const DASH_COUNT = Math.ceil((AHEAD + 20) / DASH_PERIOD);
const TREE_PERIOD = 9; // metres between roadside trees
const TREE_COUNT = Math.ceil((AHEAD + 20) / TREE_PERIOD);

const laneX = (lane: number) => (lane - 1) * LANE_W;

/** Animated.Value has no public sync getter; the race loop writes it with
    setValue on this same JS thread, so reading the current value is exact. */
const read = (v: Animated.Value) => (v as unknown as { __getValue(): number }).__getValue();

const ENTITY_COLOR: Record<EntityKind, string> = {
  coin: COLORS.gold,
  cone: ACCENTS.orange.deep,
  barrel: ACCENTS.blue.deep,
  boost: ACCENTS.green.base,
  shield: ACCENTS.blue.base,
  magnet: ACCENTS.coral.deep,
};

function EntityMesh({ kind }: { kind: EntityKind }) {
  const color = ENTITY_COLOR[kind];
  switch (kind) {
    case 'coin':
      return (
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 0.15, 16]} />
          <meshLambertMaterial color={color} />
        </mesh>
      );
    case 'cone':
      return (
        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.55, 1.2, 12]} />
          <meshLambertMaterial color={color} />
        </mesh>
      );
    case 'barrel':
      return (
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 1.4, 14]} />
          <meshLambertMaterial color={color} />
        </mesh>
      );
    case 'boost':
      return (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[LANE_W * 0.7, 2.4]} />
          <meshLambertMaterial color={color} />
        </mesh>
      );
    case 'shield':
      return (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.6, 14, 10]} />
          <meshLambertMaterial color={color} transparent opacity={0.8} />
        </mesh>
      );
    case 'magnet':
      return (
        <mesh position={[0, 1, 0]}>
          <torusGeometry args={[0.5, 0.18, 8, 16, Math.PI]} />
          <meshLambertMaterial color={color} />
        </mesh>
      );
  }
}

/** A chunky toy car from boxes: body, cabin, four wheels. Faces -z. */
function Car({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.7, 0.6, 3]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.05, 0.25]}>
        <boxGeometry args={[1.3, 0.5, 1.5]} />
        <meshLambertMaterial color={COLORS.surface} />
      </mesh>
      {[
        [-0.85, 1],
        [0.85, 1],
        [-0.85, -1],
        [0.85, -1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.3, 12]} />
          <meshLambertMaterial color={COLORS.ink} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 1.2, 8]} />
        <meshLambertMaterial color="#8A5A3B" />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.9, 1.9, 10]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

const RIVAL_COLORS = [ACCENTS.blue.base, ACCENTS.purple.base];

function Scene({ theme, level, ui, anim }: Omit<PlayfieldProps, 'onSteerTo' | 'playerEmoji'>) {
  const world = useRef<Group>(null);
  const dashes = useRef<Group>(null);
  const trees = useRef<Group>(null);
  const player = useRef<Group>(null);
  const rivals = useRef<(Group | null)[]>([]);
  const traffic = useRef<(Group | null)[]>([]);
  const consumed = useMemo(() => new Set(ui.consumedIds), [ui.consumedIds]);
  // Spike instrumentation: average frame rate, logged in dev every ~3 s.
  const fps = useRef({ frames: 0, time: 0 });

  useFrame(({ camera }, delta) => {
    if (__DEV__) {
      fps.current.frames += 1;
      fps.current.time += delta;
      if (fps.current.time >= 3) {
        console.log(`[turbo-road 3D] ${(fps.current.frames / fps.current.time).toFixed(1)} fps`);
        fps.current = { frames: 0, time: 0 };
      }
    }

    const dist = read(anim.dist);
    const lx = laneX(read(anim.playerLaneX) + read(anim.shake));

    if (world.current) world.current.position.z = dist * S;
    if (dashes.current) dashes.current.position.z = ((dist * S) % DASH_PERIOD);
    if (trees.current) trees.current.position.z = ((dist * S) % TREE_PERIOD);

    if (player.current) {
      player.current.position.x = lx;
      player.current.rotation.z = (-read(anim.bank) * Math.PI) / 180;
    }
    anim.rivals.forEach((r, i) => {
      const g = rivals.current[i];
      if (!g) return;
      g.position.x = laneX(read(r.laneX));
      g.position.z = -read(r.gap) * S;
    });
    anim.traffic.forEach((tr, i) => {
      const g = traffic.current[i];
      if (!g) return;
      g.position.x = laneX(read(tr.lane));
      g.position.z = -read(tr.gap) * S;
    });

    // Chase camera: trails the car's lane softly so steering feels weighty.
    camera.position.x += (lx * 0.6 - camera.position.x) * 0.12;
    camera.lookAt(lx * 0.4, 0.8, -14);
  });

  return (
    <>
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.sky, AHEAD * 0.55, AHEAD]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 12, 6]} intensity={1.1} />

      {/* Ground + road, long enough to always reach the horizon. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -AHEAD / 2]}>
        <planeGeometry args={[200, AHEAD + 40]} />
        <meshLambertMaterial color={theme.ground} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -AHEAD / 2]}>
        <planeGeometry args={[ROAD_W, AHEAD + 40]} />
        <meshLambertMaterial color={theme.road} />
      </mesh>

      <group ref={dashes}>
        {Array.from({ length: DASH_COUNT }, (_, i) =>
          [-0.5, 0.5].map((side) => (
            <mesh
              key={`${i}-${side}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[side * LANE_W, 0.01, 8 - i * DASH_PERIOD]}
            >
              <planeGeometry args={[0.18, DASH_LEN]} />
              <meshBasicMaterial color={theme.dash} />
            </mesh>
          )),
        )}
      </group>

      <group ref={trees}>
        {Array.from({ length: TREE_COUNT }, (_, i) =>
          [-1, 1].map((side) => (
            <group
              key={`${i}-${side}`}
              position={[side * (ROAD_W / 2 + 2.5 + (i % 3)), 0, 8 - i * TREE_PERIOD - (side > 0 ? 4 : 0)]}
            >
              <Tree color={theme.groundPatch} />
            </group>
          )),
        )}
      </group>

      {/* Fixed-position world: entities + finish line, scrolled as one group. */}
      <group ref={world}>
        {level.entities.map((e) =>
          consumed.has(e.id) ? null : (
            <group key={e.id} position={[laneX(e.lane), 0, -e.dist * S]}>
              <EntityMesh kind={e.kind} />
            </group>
          ),
        )}
        <mesh position={[0, 2.6, -level.raceLength * S]}>
          <boxGeometry args={[ROAD_W + 1, 0.6, 0.3]} />
          <meshLambertMaterial color={COLORS.surface} />
        </mesh>
      </group>

      {level.rivals.map((r, i) => (
        <group key={r.id} ref={(g) => { rivals.current[i] = g; }}>
          <Car color={RIVAL_COLORS[i % RIVAL_COLORS.length]} />
        </group>
      ))}
      {level.traffic.map((_, i) => (
        <group key={i} ref={(g) => { traffic.current[i] = g; }} rotation={[0, Math.PI, 0]}>
          <Car color={ACCENTS.orange.base} />
        </group>
      ))}

      <group ref={player}>
        <Car color={ui.slowActive ? ACCENTS.coral.tint : ACCENTS.coral.base} />
        {ui.shieldActive ? (
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[2, 16, 12]} />
            <meshLambertMaterial color={ACCENTS.blue.base} transparent opacity={0.25} />
          </mesh>
        ) : null}
      </group>
    </>
  );
}

export function Playfield3D({ theme, level, ui, anim, onSteerTo }: PlayfieldProps) {
  // Finger x across the whole width → continuous lane 0..2 (same contract as 2D).
  const width = useRef(1);
  const steer = useRef(onSteerTo);
  steer.current = onSteerTo;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => steer.current((e.nativeEvent.locationX / width.current) * 3 - 0.5),
      onPanResponderMove: (e) => steer.current((e.nativeEvent.locationX / width.current) * 3 - 0.5),
    }),
  ).current;

  return (
    <View
      style={styles.root}
      onLayout={(e: LayoutChangeEvent) => {
        width.current = Math.max(1, e.nativeEvent.layout.width);
      }}
      {...pan.panHandlers}
    >
      <Canvas camera={{ position: [0, 4.2, 7.5], fov: 60, near: 0.1, far: AHEAD + 10 }}>
        <Scene theme={theme} level={level} ui={ui} anim={anim} />
      </Canvas>
    </View>
  );
}

// Pinned LTR: lane math is physical left→right in both languages.
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, direction: 'ltr' },
});

