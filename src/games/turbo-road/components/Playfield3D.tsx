/**
 * Turbo Road — the 3D road (the game's only renderer).
 *
 * The race engine, HUD, overlays and steering contract live elsewhere; this is
 * a low-poly three.js scene (react-three-fiber + expo-gl) with a chase camera.
 * Cars, cones, trees and the finish arch are Kenney CC0 models (see
 * utils/models3d.ts); coins, barrels and pads are primitive shapes. Each model
 * shows a primitive stand-in for the moment it takes to load. Around the road:
 * a gradient sky dome, distant hills and drifting clouds, red-and-white kerbs,
 * soft shadows under every car, and speed streaks while boosting.
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
import {
  BackSide,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  type Group,
  type Object3D,
  type PerspectiveCamera,
} from 'three';
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
  shared,
}: {
  kind: EntityKind;
  motion: Animated3D;
  shared: Shared;
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
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            geometry={shared.coinGeo}
            material={shared.coin}
            dispose={null}
          />
          {/* A raised rim on both faces reads as a real coin. */}
          <mesh geometry={shared.coinRim} material={shared.coin} dispose={null} />
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
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            geometry={shared.boostGeo}
            material={shared.boost}
            dispose={null}
          />
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

/**
 * Built once per scene and handed to every coin, pad and spark. R3F would
 * dispose a mesh's material/geometry when a consumed pickup unmounts, which
 * would destroy these for everyone, so those meshes opt out (dispose={null})
 * and the scene disposes them itself on unmount.
 */
type Shared = {
  coin: MeshStandardMaterial;
  boost: MeshStandardMaterial;
  shadow: MeshBasicMaterial;
  coinGeo: CylinderGeometry;
  coinRim: TorusGeometry;
  shadowGeo: CircleGeometry;
  boostGeo: PlaneGeometry;
  sparkGeo: TetrahedronGeometry;
};

/** Gold flecks that burst from the car when a coin is grabbed. */
const SPARK_COUNT = 10;
const SPARK_LIFE = 0.55; // seconds

/** A car model facing −z, with a box-car stand-in while it loads, on a soft shadow. */
function Car({ model, color, flip = false, shared }: { model: ModelName; color: string; flip?: boolean; shared: Shared }) {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        scale={[1.15, CAR_LEN * 0.62, 1]}
        geometry={shared.shadowGeo}
        material={shared.shadow}
        dispose={null}
      />
      <Model
        name={model}
        length={CAR_LEN}
        rotationY={flip ? 0 : FACE_FORWARD}
        fallback={<BoxCar color={color} />}
      />
    </>
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

/** Sky dome radius; the camera's far plane reaches past it. */
const SKY_R = 140;
const FAR = SKY_R + 20;
const HILLS = 9;
const CLOUD_COUNT = 5;
const STREAKS = 16;

/** A colour part-way from `a` to `b`. */
const mix = (a: string, b: string, k: number) => new Color(a).lerp(new Color(b), k);

/**
 * Everything beyond the road: a sky dome fading from a deeper blue overhead to
 * the theme's sky at the horizon, a ring of soft hills in the theme's colour
 * hazed toward the sky, and slow clouds. Fog is off for all of it, so it frames
 * the road instead of vanishing into the haze.
 */
function Backdrop({ theme }: { theme: SceneProps['theme'] }) {
  const sky = useMemo(() => {
    const g = new SphereGeometry(SKY_R, 32, 16);
    const top = mix(theme.sky, ACCENTS.blue.base, 0.75);
    const horizon = new Color(theme.sky);
    const pos = g.getAttribute('position');
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const k = Math.max(0, pos.getY(i) / SKY_R);
      const c = horizon.clone().lerp(top, Math.pow(k, 0.6));
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return g;
  }, [theme.sky]);
  const hillMat = useMemo(
    () => new MeshBasicMaterial({ color: mix(theme.groundPatch, theme.sky, 0.45), fog: false }),
    [theme.groundPatch, theme.sky],
  );
  const farHillMat = useMemo(
    () => new MeshBasicMaterial({ color: mix(theme.groundPatch, theme.sky, 0.7), fog: false }),
    [theme.groundPatch, theme.sky],
  );
  const cloudMat = useMemo(() => new MeshBasicMaterial({ color: COLORS.surface, fog: false }), []);
  const hillGeo = useMemo(() => new SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const clouds = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    clouds.current?.children.forEach((c, i) => {
      c.position.x = ((i * 47 + t * (1.2 + i * 0.3)) % 180) - 90;
    });
  });
  return (
    <group>
      <mesh geometry={sky}>
        <meshBasicMaterial vertexColors side={BackSide} fog={false} depthWrite={false} />
      </mesh>
      {/* Two rows of hills: the far row paler, as if through haze. */}
      {Array.from({ length: HILLS }, (_, i) => {
        const x = (i - (HILLS - 1) / 2) * 22;
        return (
          <group key={i}>
            <mesh
              geometry={hillGeo}
              material={farHillMat}
              position={[x + 11, -0.5, -118]}
              scale={[26, 14 + (i % 3) * 4, 10]}
            />
            <mesh
              geometry={hillGeo}
              material={hillMat}
              position={[x, -0.5, -100]}
              scale={[20, 8 + ((i + 1) % 3) * 3, 8]}
            />
          </group>
        );
      })}
      <group ref={clouds}>
        {Array.from({ length: CLOUD_COUNT }, (_, i) => (
          <group key={i} position={[0, 22 + (i % 3) * 5, -90 - (i % 2) * 15]}>
            {[
              [0, 0, 5],
              [4.5, -0.8, 3.6],
              [-4.5, -1, 3.4],
              [1.8, 2, 3.4],
            ].map(([x, y, r], j) => (
              <mesh key={j} geometry={hillGeo} material={cloudMat} position={[x, y, 0]} scale={[r * 1.3, r, r * 0.6]} />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/** Red-and-white kerb blocks for one dash period, on both road edges. */
function KerbBlocks({ z }: { z: number }) {
  return (
    <>
      {[-1, 1].map((side) =>
        [0, 1].map((k) => (
          <mesh key={`${side}${k}`} position={[side * (ROAD_W / 2 + 0.3), 0.06, z - k * (DASH_PERIOD / 2)]}>
            <boxGeometry args={[0.6, 0.12, DASH_PERIOD / 2]} />
            <meshLambertMaterial color={k === 0 ? ACCENTS.coral.base : COLORS.surface} />
          </mesh>
        )),
      )}
    </>
  );
}

/** White streaks rushing past while boosting. */
function SpeedStreaks({ active }: { active: boolean }) {
  const g = useRef<Group>(null);
  const streaks = useMemo(
    () =>
      Array.from({ length: STREAKS }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * (ROAD_W / 2 + 1 + (i % 5) * 1.3),
        y: 0.6 + ((i * 7) % 5) * 0.9,
        offset: (i * 13) % 40,
      })),
    [],
  );
  const mat = useMemo(() => new MeshBasicMaterial({ color: COLORS.surface, transparent: true, opacity: 0, fog: false }), []);
  const geo = useMemo(() => new BoxGeometry(0.06, 0.06, 4), []);
  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    mat.opacity += ((active ? 0.7 : 0) - mat.opacity) * Math.min(1, delta * 6);
    if (!g.current) return;
    g.current.visible = mat.opacity > 0.02;
    g.current.children.forEach((c, i) => {
      c.position.z = 6 - ((streaks[i].offset + t * 70) % 46);
    });
  });
  return (
    <group ref={g} visible={false}>
      {streaks.map((st, i) => (
        <mesh key={i} geometry={geo} material={mat} position={[st.x, st.y, 0]} />
      ))}
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
  const shared = useMemo<Shared>(
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
      shadow: new MeshBasicMaterial({ color: COLORS.ink, transparent: true, opacity: 0.22, depthWrite: false }),
      coinGeo: new CylinderGeometry(0.6, 0.6, 0.16, 20),
      coinRim: new TorusGeometry(0.56, 0.07, 6, 24),
      shadowGeo: new CircleGeometry(1, 20),
      boostGeo: new PlaneGeometry(LANE_W * 0.75, 2.6),
      sparkGeo: new TetrahedronGeometry(0.18),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(shared).forEach((r) => r.dispose());
    },
    [shared],
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
  const lastX = useRef(0);
  const yaw = useRef(0);

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
    shared.boost.emissiveIntensity = 0.35 + Math.sin(t * 6) * 0.25;

    if (player.current) {
      // Steering: the car leans (bank) and noses toward where it's heading;
      // a light suspension hum keeps it feeling like it's on a real road.
      const vx = delta > 0 ? (lx - lastX.current) / delta : 0;
      lastX.current = lx;
      yaw.current += (Math.max(-0.35, Math.min(0.35, -vx * 0.06)) - yaw.current) * Math.min(1, delta * 10);
      player.current.position.x = lx;
      player.current.position.y = Math.sin(t * 22) * 0.025 + Math.abs(shake) * 0.15;
      player.current.rotation.z = (-read(anim.bank) * Math.PI) / 180;
      player.current.rotation.y = yaw.current;
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
      <hemisphereLight args={[theme.sky, theme.ground, 0.7]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 12, 6]} intensity={1.2} />
      <Backdrop theme={theme} />
      <SpeedStreaks active={ui.boostActive} />

      {/* Ground + road, long enough to always reach the horizon. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -AHEAD / 2]}>
        <planeGeometry args={[200, AHEAD + 40]} />
        {/* The flat theme tint reads grey once lit; push it toward the patch colour. */}
        <meshLambertMaterial color={mix(theme.ground, theme.groundPatch, 0.35)} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -AHEAD / 2]}>
        <planeGeometry args={[ROAD_W, AHEAD + 40]} />
        <meshLambertMaterial color={theme.road} />
      </mesh>

      {/* Solid white edge lines just inside the kerbs. */}
      {[-1, 1].map((side) => (
        <mesh key={side} rotation={[-Math.PI / 2, 0, 0]} position={[side * (ROAD_W / 2 - 0.25), 0.012, -AHEAD / 2]}>
          <planeGeometry args={[0.16, AHEAD + 40]} />
          <meshBasicMaterial color={theme.dash} />
        </mesh>
      ))}

      <group ref={dashes}>
        {Array.from({ length: DASH_COUNT }, (_, i) => (
          <KerbBlocks key={`k${i}`} z={8 - i * DASH_PERIOD} />
        ))}
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
              <EntityMesh kind={e.kind} motion={motion} shared={shared} />
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
          <Car model={RIVAL_MODELS[i % RIVAL_MODELS.length]} color={RIVAL_COLORS[i % RIVAL_COLORS.length]} shared={shared} />
        </group>
      ))}
      {level.traffic.map((_, i) => (
        <group key={i} ref={(g) => { traffic.current[i] = g; }}>
          {/* Oncoming: faces the player. */}
          <Car model={TRAFFIC_MODEL} color={ACCENTS.orange.base} flip shared={shared} />
        </group>
      ))}

      <group ref={player}>
        <Car model={CAR_MODEL[carId]} color={ui.slowActive ? ACCENTS.coral.tint : ACCENTS.coral.base} shared={shared} />
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
          <mesh key={i} geometry={shared.sparkGeo} material={shared.coin} dispose={null} />
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
      <Canvas flat camera={{ position: [0, 4.6, 8.5], fov: 58, near: 0.1, far: FAR }}>
        <Scene theme={theme} level={level} ui={ui} anim={anim} carId={carId} />
      </Canvas>
    </View>
  );
}

// Pinned LTR: lane math is physical left→right in both languages.
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, direction: 'ltr' },
});

