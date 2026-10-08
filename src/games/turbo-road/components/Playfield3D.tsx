/**
 * Turbo Road — 3D playfield (beta, 3D-1 spike).
 *
 * A drop-in replacement for <Playfield> with the same props: the race engine,
 * HUD, overlays and steering contract are untouched; only the rendering moves
 * to a low-poly three.js scene (react-three-fiber + expo-gl) with a chase
 * camera. Cars, cones, trees and the finish arch are Kenney CC0 models (see
 * utils/models3d.ts); coins, barrels and pads stay primitive shapes. Each model
 * shows a primitive stand-in for the moment it takes to load.
 *
 * Per-frame values are read straight from the race loop's Animated.Value
 * channels inside useFrame (both run on the JS thread), so nothing re-renders
 * React per frame. The world (entities, finish line) is ONE group whose z is
 * moved by the travelled distance; dashes and roadside trees are small pools
 * wrapped with the existing dash/decor phases.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { LogBox, PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { MeshStandardMaterial, type Group, type Object3D, type PerspectiveCamera } from 'three';
import { ACCENTS, COLORS } from '@/sdk';
import type { Animated } from 'react-native';
import type { CarId, EntityKind, PlayfieldProps } from '../types';
import {
  CAR_MODEL,
  SCENERY,
  preloadModels,
  useModel,
  type ModelName,
  type SceneryItem,
} from '../utils/models3d';

// three's internal Clock deprecation warning comes from react-three-fiber, not
// our code; keep it out of the dev LogBox.
LogBox.ignoreLogs(['THREE.Clock']);

const CAR_LEN = 3.2;
/** Rivals match their emoji: 🚙 → SUV, 🚕 → taxi. Oncoming trucks: delivery van. */
const RIVAL_MODELS: ModelName[] = ['suv', 'taxi'];
const TRAFFIC_MODEL: ModelName = 'delivery';
/** Kenney vehicles face +z; the race drives toward −z. */
const FACE_FORWARD = Math.PI;

/** A loaded model, or `fallback` until it's ready. */
function Model({
  name,
  length,
  fit = 'length',
  rotationY = 0,
  fallback = null,
}: {
  name: ModelName;
  length: number;
  fit?: 'length' | 'height';
  rotationY?: number;
  fallback?: ReactNode;
}) {
  const obj = useModel(name, length, fit);
  if (!obj) return <>{fallback}</>;
  return (
    <group rotation={[0, rotationY, 0]}>
      <primitive object={obj} />
    </group>
  );
}

/** World units → metres. VIEW_DIST (900 units) ≈ 45 m of road ahead. */
const S = 0.05;
const LANE_W = 3;
const ROAD_W = LANE_W * 3;
const AHEAD = 70; // metres of road drawn ahead of the car
const DASH_LEN = 2.2;
const DASH_PERIOD = 6; // metres
const DASH_COUNT = Math.ceil((AHEAD + 20) / DASH_PERIOD);
const TREE_PERIOD = 9; // metres between roadside scenery props
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

/**
 * Pickups that move: coins spin, shield/magnet bob and turn, boost pads pulse.
 * One shared material per kind, so a glow update is a single write per frame.
 */
type Animated3D = { spinners: Set<Object3D>; bobbers: Set<Object3D> };

function EntityMesh({
  kind,
  motion,
  materials,
}: {
  kind: EntityKind;
  motion: Animated3D;
  materials: Materials;
}) {
  const color = ENTITY_COLOR[kind];
  // React 19 ref cleanup: consumed pickups unmount and leave the set.
  const track = (set: Set<Object3D>) => (o: Object3D | null) => {
    if (!o) return;
    set.add(o);
    return () => {
      set.delete(o);
    };
  };
  switch (kind) {
    case 'coin':
      return (
        <group position={[0, 1, 0]} ref={track(motion.spinners)}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.coin}>
            <cylinderGeometry args={[0.6, 0.6, 0.16, 20]} />
          </mesh>
        </group>
      );
    case 'cone':
      return (
        <Model
          name="cone"
          length={1.1}
          fallback={
            <mesh position={[0, 0.6, 0]}>
              <coneGeometry args={[0.55, 1.2, 12]} />
              <meshLambertMaterial color={color} />
            </mesh>
          }
        />
      );
    case 'barrel':
      return (
        <group>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 1.4, 16]} />
            <meshLambertMaterial color={color} />
          </mesh>
          {[0.35, 1.05].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.61, 0.05, 6, 20]} />
              <meshLambertMaterial color={COLORS.surface} />
            </mesh>
          ))}
        </group>
      );
    case 'boost':
      return (
        <group position={[0, 0.03, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={materials.boost}>
            <planeGeometry args={[LANE_W * 0.75, 2.6]} />
          </mesh>
          {/* Chevrons point the way forward. */}
          {[-0.5, 0.5].map((z) => (
            <mesh key={z} rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.01, z]}>
              <planeGeometry args={[0.9, 0.9]} />
              <meshBasicMaterial color={COLORS.surface} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      );
    case 'shield':
      return (
        <group position={[0, 1.1, 0]} ref={track(motion.bobbers)}>
          <mesh>
            <icosahedronGeometry args={[0.65, 1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.85} />
          </mesh>
        </group>
      );
    case 'magnet':
      return (
        <group position={[0, 1.1, 0]} ref={track(motion.bobbers)}>
          <mesh rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.5, 0.2, 10, 20, Math.PI]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 0.05, 0]}>
              <boxGeometry args={[0.4, 0.2, 0.4]} />
              <meshLambertMaterial color={COLORS.surface} />
            </mesh>
          ))}
        </group>
      );
  }
}

type Materials = { coin: MeshStandardMaterial; boost: MeshStandardMaterial };

/** Gold flecks that burst from the car when a coin is grabbed. */
const SPARK_COUNT = 10;
const SPARK_LIFE = 0.55; // seconds

/** A car model facing −z, with a box-car stand-in while it loads. */
function Car({ model, color, flip = false }: { model: ModelName; color: string; flip?: boolean }) {
  return (
    <Model
      name={model}
      length={CAR_LEN}
      rotationY={flip ? 0 : FACE_FORWARD}
      fallback={<BoxCar color={color} />}
    />
  );
}

/** A chunky toy car from boxes: body, cabin, four wheels. */
function BoxCar({ color }: { color: string }) {
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

function Scenery({ item, color }: { item: SceneryItem; color: string }) {
  return (
    <Model name={item.name} length={item.size} fit={item.fit} fallback={<ConeTree color={color} />} />
  );
}

function ConeTree({ color }: { color: string }) {
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

type SceneProps = Omit<PlayfieldProps, 'onSteerTo' | 'playerEmoji'> & { carId: CarId };

function Scene({ theme, level, ui, anim, carId }: SceneProps) {
  const world = useRef<Group>(null);
  const dashes = useRef<Group>(null);
  const trees = useRef<Group>(null);
  const player = useRef<Group>(null);
  const sparks = useRef<Group>(null);
  const rivals = useRef<(Group | null)[]>([]);
  const traffic = useRef<(Group | null)[]>([]);
  const consumed = useMemo(() => new Set(ui.consumedIds), [ui.consumedIds]);
  const motion = useMemo<Animated3D>(() => ({ spinners: new Set(), bobbers: new Set() }), []);
  const materials = useMemo<Materials>(
    () => ({
      coin: new MeshStandardMaterial({
        color: COLORS.gold,
        emissive: COLORS.gold,
        emissiveIntensity: 0.35,
        metalness: 0.4,
        roughness: 0.35,
      }),
      boost: new MeshStandardMaterial({
        color: ACCENTS.green.base,
        emissive: ACCENTS.green.base,
        emissiveIntensity: 0.4,
      }),
    }),
    [],
  );
  const scenery = SCENERY[theme.id];

  // A coin newly in consumedIds → fire the spark burst from the car.
  const coinIds = useMemo(
    () => new Set(level.entities.filter((e) => e.kind === 'coin').map((e) => e.id)),
    [level.entities],
  );
  const seen = useRef(new Set<number>());
  const burstAt = useRef(-1);
  const clockRef = useRef(0);
  useEffect(() => {
    for (const id of ui.consumedIds) {
      if (seen.current.has(id)) continue;
      seen.current.add(id);
      if (coinIds.has(id)) burstAt.current = clockRef.current;
    }
  }, [ui.consumedIds, coinIds]);

  // Spike instrumentation: average frame rate, logged in dev every ~3 s.
  const fps = useRef({ frames: 0, time: 0 });
  const fov = useRef(58);

  useFrame(({ camera, clock }, delta) => {
    const t = clock.getElapsedTime();
    clockRef.current = t;
    if (__DEV__) {
      fps.current.frames += 1;
      fps.current.time += delta;
      if (fps.current.time >= 3) {
        console.log(`[turbo-road 3D] ${(fps.current.frames / fps.current.time).toFixed(1)} fps`);
        fps.current = { frames: 0, time: 0 };
      }
    }

    const dist = read(anim.dist);
    const shake = read(anim.shake);
    const lx = laneX(read(anim.playerLaneX) + shake);

    if (world.current) world.current.position.z = dist * S;
    if (dashes.current) dashes.current.position.z = (dist * S) % DASH_PERIOD;
    if (trees.current) trees.current.position.z = (dist * S) % TREE_PERIOD;

    // Pickups come alive.
    motion.spinners.forEach((o) => {
      o.rotation.y = t * 3;
    });
    motion.bobbers.forEach((o) => {
      o.position.y = 1.1 + Math.sin(t * 3) * 0.18;
      o.rotation.y = t * 1.5;
    });
    materials.boost.emissiveIntensity = 0.35 + Math.sin(t * 6) * 0.25;

    if (player.current) {
      player.current.position.x = lx;
      player.current.rotation.z = (-read(anim.bank) * Math.PI) / 180;
    }
    // Cars that drop behind the camera are hidden instead of filling the lens.
    anim.rivals.forEach((r, i) => {
      const g = rivals.current[i];
      if (!g) return;
      g.position.x = laneX(read(r.laneX));
      g.position.z = -read(r.gap) * S;
      g.visible = g.position.z < 1.5;
    });
    anim.traffic.forEach((tr, i) => {
      const g = traffic.current[i];
      if (!g) return;
      g.position.x = laneX(read(tr.lane));
      g.position.z = -read(tr.gap) * S;
      g.visible = g.position.z < 1.5;
    });

    // Coin sparks: fly up and out from the car, fade, then hide.
    if (sparks.current) {
      const age = t - burstAt.current;
      const live = burstAt.current >= 0 && age < SPARK_LIFE;
      sparks.current.visible = live;
      if (live) {
        const k = age / SPARK_LIFE;
        sparks.current.position.set(lx, 1.2, -0.5);
        sparks.current.children.forEach((c, i) => {
          const a = (i / SPARK_COUNT) * Math.PI * 2;
          c.position.set(Math.cos(a) * 2.2 * k, 2.4 * k - 2 * k * k, Math.sin(a) * 1.2 * k);
          c.rotation.set(t * 8 + i, t * 6, 0);
          c.scale.setScalar(1 - k);
        });
      }
    }

    // Chase camera: trails the lane softly; a crash shakes it, a boost widens
    // the lens for a rush of speed.
    const cam = camera as PerspectiveCamera;
    cam.position.x += (lx * 0.6 - cam.position.x) * 0.12 + shake * 0.35;
    cam.position.y = 4.6 + Math.abs(shake) * 0.4;
    const targetFov = ui.boostActive ? 70 : 58;
    fov.current += (targetFov - fov.current) * Math.min(1, delta * 4);
    if (Math.abs(cam.fov - fov.current) > 0.05) {
      cam.fov = fov.current;
      cam.updateProjectionMatrix();
    }
    cam.lookAt(lx * 0.4, 0.6, -12);
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

      {/* Roadside scenery for this level's theme, alternated along both verges. */}
      <group ref={trees}>
        {Array.from({ length: TREE_COUNT }, (_, i) =>
          [-1, 1].map((side) => (
            <group
              key={`${theme.id}-${i}-${side}`}
              position={[side * (ROAD_W / 2 + 2.5 + (i % 3)), 0, 8 - i * TREE_PERIOD - (side > 0 ? 4 : 0)]}
            >
              <Scenery
                item={scenery[(i + (side > 0 ? 1 : 0)) % scenery.length]}
                color={theme.groundPatch}
              />
            </group>
          )),
        )}
      </group>

      {/* Fixed-position world: entities + finish line, scrolled as one group. */}
      <group ref={world}>
        {level.entities.map((e) =>
          consumed.has(e.id) ? null : (
            <group key={e.id} position={[laneX(e.lane), 0, -e.dist * S]}>
              <EntityMesh kind={e.kind} motion={motion} materials={materials} />
            </group>
          ),
        )}
        <group position={[0, 0, -level.raceLength * S]}>
          <Model
            name="finishArch"
            length={ROAD_W + 2}
            fallback={
              <mesh position={[0, 2.6, 0]}>
                <boxGeometry args={[ROAD_W + 1, 0.6, 0.3]} />
                <meshLambertMaterial color={COLORS.surface} />
              </mesh>
            }
          />
        </group>
      </group>

      {level.rivals.map((r, i) => (
        <group key={r.id} ref={(g) => { rivals.current[i] = g; }}>
          <Car model={RIVAL_MODELS[i % RIVAL_MODELS.length]} color={RIVAL_COLORS[i % RIVAL_COLORS.length]} />
        </group>
      ))}
      {level.traffic.map((_, i) => (
        <group key={i} ref={(g) => { traffic.current[i] = g; }}>
          {/* Oncoming: faces the player. */}
          <Car model={TRAFFIC_MODEL} color={ACCENTS.orange.base} flip />
        </group>
      ))}

      <group ref={player}>
        <Car model={CAR_MODEL[carId]} color={ui.slowActive ? ACCENTS.coral.tint : ACCENTS.coral.base} />
        {ui.shieldActive ? (
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[2, 16, 12]} />
            <meshStandardMaterial
              color={ACCENTS.blue.base}
              emissive={ACCENTS.blue.base}
              emissiveIntensity={0.4}
              transparent
              opacity={0.25}
            />
          </mesh>
        ) : null}
        {ui.boostActive ? (
          // Exhaust glow while boosting.
          <mesh position={[0, 0.5, 1.9]}>
            <coneGeometry args={[0.35, 1.4, 10]} />
            <meshBasicMaterial color={ACCENTS.orange.base} transparent opacity={0.8} />
          </mesh>
        ) : null}
      </group>

      <group ref={sparks} visible={false}>
        {Array.from({ length: SPARK_COUNT }, (_, i) => (
          <mesh key={i} material={materials.coin}>
            <tetrahedronGeometry args={[0.18]} />
          </mesh>
        ))}
      </group>
    </>
  );
}

export function Playfield3D({
  theme,
  level,
  ui,
  anim,
  onSteerTo,
  carId,
}: PlayfieldProps & { carId: CarId }) {
  // Fetch every model this race uses during the countdown.
  useEffect(() => {
    preloadModels([
      CAR_MODEL[carId],
      ...RIVAL_MODELS,
      TRAFFIC_MODEL,
      'cone',
      'finishArch',
      ...SCENERY[theme.id].map((s) => s.name),
    ]);
  }, [carId, theme.id]);

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
      <Canvas camera={{ position: [0, 4.6, 8.5], fov: 58, near: 0.1, far: AHEAD + 12 }}>
        <Scene theme={theme} level={level} ui={ui} anim={anim} carId={carId} />
      </Canvas>
    </View>
  );
}

// Pinned LTR: lane math is physical left→right in both languages.
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, direction: 'ltr' },
});

