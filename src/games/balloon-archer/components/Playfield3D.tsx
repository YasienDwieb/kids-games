/**
 * Balloon Archer in 3D — a renderer swap over the same archery engine
 * (`useArcheryGame`): glossy rubber balloons on swaying strings, a wooden bow
 * whose string draws back while aiming, a fletched arrow, confetti bursts, and
 * clouds drifting in front of a painted Higgsfield meadow (see CREDITS.md).
 *
 * The camera is placed so the z = 0 plane maps 1:1 onto the play area's pixels
 * (x right, y down from the top-left, like the engine), so hit-testing, aiming
 * and the 2D HUD / lane guide line up exactly. Anything nearer or farther (the
 * clouds) gets real perspective. Under RTL the 2D playfield is mirrored; the
 * scene mirrors x the same way.
 *
 * The engine mutates one `World` object; the scene reads it every frame in
 * useFrame and drives a fixed pool of meshes, so React never re-renders the
 * 3D tree while playing.
 */
import { memo, useMemo, useRef } from 'react';
import { I18nManager, LogBox, StyleSheet, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import {
  ConeGeometry,
  CylinderGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type Group,
  type Mesh,
  type PerspectiveCamera,
} from 'three';
import { COLORS } from '@/sdk';
import { PHYSICS, POP_MS } from '../constants';
import type { World } from '../types';

LogBox.ignoreLogs(['THREE.Clock']);

const FOV = 40;
const POOL = 10; // balloons drawn at once (max on screen + popping)
const SHARDS = 10; // confetti pieces per burst
const CLOUDS = 4;
const WOOD = '#B9783F';
const WOOD_DEEP = '#8A5427';
const FLETCH = '#FF6B5E';
/** Bow stave: radius and half its arc. */
const BOW_R = 34;
const BOW_HALF_ARC = Math.PI * 0.41;

type Props = { world: World; width: number; height: number; archerX: number };

/** Engine pixels → scene units (same scale, origin in the middle, y up). */
function useMap(width: number, height: number) {
  const flip = I18nManager.isRTL ? -1 : 1;
  return useMemo(
    () => ({
      x: (px: number) => flip * (px - width / 2),
      /** Unmirrored x, for things inside a group that is itself mirrored. */
      ux: (px: number) => px - width / 2,
      y: (py: number) => height / 2 - py,
      flip,
    }),
    [flip, width, height],
  );
}

/** Puts the camera where the z = 0 plane fills the view pixel for pixel. */
function CameraRig({ height }: { height: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useMemo(() => {
    const dist = height / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
    camera.fov = FOV;
    camera.near = 1;
    camera.far = dist + 3000;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, height]);
  return null;
}

function useShared() {
  return useMemo(
    () => ({
      sphere: new SphereGeometry(1, 32, 24),
      knot: new ConeGeometry(0.16, 0.22, 12),
      string: new CylinderGeometry(0.012, 0.012, 1, 4),
      shard: new PlaneGeometry(1, 0.6),
      ring: new TorusGeometry(1, 0.1, 8, 32),
      shaft: new CylinderGeometry(2.2, 2.2, PHYSICS.arrowLength, 8),
      head: new ConeGeometry(6, 14, 12),
      fletch: new PlaneGeometry(12, 7),
      limb: new TorusGeometry(BOW_R, 4.2, 10, 28, BOW_HALF_ARC * 2),
      grip: new CylinderGeometry(5.5, 5.5, 16, 12),
      bowString: new CylinderGeometry(0.9, 0.9, 1, 4),
      cloud: new SphereGeometry(1, 16, 12),
      stringMat: new MeshStandardMaterial({ color: COLORS.ink, transparent: true, opacity: 0.35 }),
      wood: new MeshStandardMaterial({ color: WOOD, roughness: 0.6 }),
      woodDeep: new MeshStandardMaterial({ color: WOOD_DEEP, roughness: 0.7 }),
      ink: new MeshStandardMaterial({ color: COLORS.ink, roughness: 0.5 }),
      steel: new MeshStandardMaterial({ color: '#C9CED6', metalness: 0.6, roughness: 0.3 }),
      fletchMat: new MeshStandardMaterial({ color: FLETCH, side: 2 }),
      cloudMat: new MeshStandardMaterial({
        color: COLORS.surface,
        emissive: COLORS.surface,
        emissiveIntensity: 0.45,
        roughness: 1,
        transparent: true,
        opacity: 0.9,
      }),
    }),
    [],
  );
}
type Shared = ReturnType<typeof useShared>;

/** One pooled balloon: body, knot, string, and its burst (shards + ring). */
type Slot = {
  root: Group | null;
  body: Group | null;
  burst: Group | null;
  ring: Mesh | null;
  shards: (Mesh | null)[];
  mat: MeshPhysicalMaterial;
  shardMat: MeshStandardMaterial;
  ringMat: MeshStandardMaterial;
  id: number;
};

function useSlots() {
  return useMemo<Slot[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        root: null,
        body: null,
        burst: null,
        ring: null,
        shards: [],
        mat: new MeshPhysicalMaterial({
          roughness: 0.28,
          clearcoat: 1,
          clearcoatRoughness: 0.15,
          // A little self-light keeps the accent colours true under the shading.
          emissiveIntensity: 0.22,
        }),
        shardMat: new MeshStandardMaterial({ side: 2 }),
        ringMat: new MeshStandardMaterial({ color: COLORS.surface, transparent: true, opacity: 0.8 }),
        id: -1,
      })),
    [],
  );
}

/** Fixed shard directions, so a burst is the same nice spray every time. */
const SHARD_DIRS = Array.from({ length: SHARDS }, (_, i) => {
  const a = (i / SHARDS) * Math.PI * 2 + (i % 2) * 0.3;
  return { x: Math.cos(a), y: Math.sin(a), spin: 4 + (i % 3) * 3 };
});

function Balloons({ world, map, shared }: { world: World; map: ReturnType<typeof useMap>; shared: Shared }) {
  const slots = useSlots();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const now = Date.now();
    const list = world.balloons;
    slots.forEach((s, i) => {
      const b = list[i];
      if (!s.root) return;
      s.root.visible = !!b;
      if (!b || !s.body || !s.burst) return;
      if (s.id !== b.id) {
        s.id = b.id;
        s.mat.color.set(b.color);
        s.mat.emissive.set(b.color);
        s.shardMat.color.set(b.color);
      }
      // A small depth step per slot, so overlapping balloons never z-fight.
      s.root.position.set(map.x(b.x), map.y(b.y), -i * 3);
      if (b.popping) {
        // Burst: body gone, shards fly out and spin, a ring flashes outward.
        const k = Math.min(1, (now - b.popAt) / POP_MS);
        s.body.visible = false;
        s.burst.visible = true;
        s.shards.forEach((m, j) => {
          if (!m) return;
          const d = SHARD_DIRS[j];
          const dist = b.r * (0.4 + k * 1.6);
          m.position.set(d.x * dist, d.y * dist - k * k * b.r * 0.8, 0);
          m.rotation.set(t * d.spin, t * d.spin * 0.7, j);
          m.scale.setScalar(b.r * 0.5 * (1 - k * 0.5));
        });
        if (s.ring) {
          s.ring.scale.setScalar(b.r * (0.8 + k * 1.2));
          s.ringMat.opacity = 0.8 * (1 - k);
        }
      } else {
        s.body.visible = true;
        s.burst.visible = false;
        // A slow bob and a tilt that follows the sway, so it feels tethered.
        s.body.rotation.z = Math.cos(b.swayPhase) * 0.12 * map.flip;
        s.body.scale.set(b.r, b.r * 1.12, b.r);
      }
    });
  });

  return (
    <>
      {slots.map((s, i) => (
        <group
          key={i}
          visible={false}
          ref={(g) => {
            s.root = g;
          }}
        >
          <group
            ref={(g) => {
              s.body = g;
            }}
          >
            <mesh geometry={shared.sphere} material={s.mat} />
            <mesh geometry={shared.knot} material={s.mat} position={[0, -1.06, 0]} rotation={[Math.PI, 0, 0]} />
            <mesh geometry={shared.string} material={shared.stringMat} position={[0, -1.7, 0]} scale={[1, 1.2, 1]} />
          </group>
          <group
            visible={false}
            ref={(g) => {
              s.burst = g;
            }}
          >
            {SHARD_DIRS.map((_, j) => (
              <mesh
                key={j}
                geometry={shared.shard}
                material={s.shardMat}
                ref={(m) => {
                  s.shards[j] = m;
                }}
              />
            ))}
            <mesh
              geometry={shared.ring}
              material={s.ringMat}
              ref={(m) => {
                s.ring = m;
              }}
            />
          </group>
        </group>
      ))}
    </>
  );
}

/** A fletched arrow pointing along +x (tip at the origin). */
function ArrowMesh({ shared }: { shared: Shared }) {
  const len = PHYSICS.arrowLength;
  return (
    <group>
      <mesh geometry={shared.shaft} material={shared.wood} position={[-len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={shared.head} material={shared.steel} position={[-3, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} geometry={shared.fletch} material={shared.fletchMat} position={[-len + 6, 0, 0]} rotation={[r, 0, 0]} />
      ))}
    </group>
  );
}

function BowAndArrows({
  world,
  map,
  archerX,
  shared,
}: {
  world: World;
  map: ReturnType<typeof useMap>;
  archerX: number;
  shared: Shared;
}) {
  const bow = useRef<Group>(null);
  const nocked = useRef<Group>(null);
  const flying = useRef<Group>(null);
  const strings = useRef<(Mesh | null)[]>([]);
  const pull = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const b = bow.current;
    if (!b) return;
    b.position.set(map.ux(archerX), map.y(world.laneY), 0);
    // Drawn: the string eases back and the bow swells a touch; idle: a breath.
    const want = world.drawing ? 1 : 0;
    pull.current += (want - pull.current) * Math.min(1, dt * 14);
    const p = pull.current;
    b.scale.setScalar(1 + p * 0.1);
    b.rotation.y = Math.sin(t * 1.3) * 0.12 * (1 - p);
    // The string: two halves meeting at the nock point, pulled back by `p`.
    const tipX = BOW_R * Math.cos(BOW_HALF_ARC); // where the limbs end
    const tipY = BOW_R * Math.sin(BOW_HALF_ARC);
    const back = tipX - 4 - p * 22;
    strings.current.forEach((m, i) => {
      if (!m) return;
      const sy = i === 0 ? tipY : -tipY;
      const dx = back - tipX;
      const dy = -sy;
      m.position.set(tipX + dx / 2, sy + dy / 2, 0);
      m.scale.set(1, Math.hypot(dx, dy), 1);
      m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    });
    if (nocked.current) {
      nocked.current.visible = world.phase === 'aiming' && world.arrowsLeft > 0;
      nocked.current.position.x = back + PHYSICS.arrowLength;
    }
    const f = flying.current;
    if (f) {
      f.visible = !!world.arrow;
      if (world.arrow) f.position.set(map.x(world.arrow.x), map.y(world.arrow.y), 0);
    }
  });

  return (
    <>
      {/* Mirrored as a whole under RTL so it faces the balloons. */}
      <group scale={[map.flip, 1, 1]}>
        <group ref={bow}>
          {/* The stave bows toward the balloons; the string runs between its tips. */}
          <mesh geometry={shared.limb} material={shared.wood} rotation={[0, 0, -BOW_HALF_ARC]} />
          <mesh geometry={shared.grip} material={shared.woodDeep} position={[BOW_R, 0, 0]} />
          {[0, 1].map((i) => (
            <mesh
              key={i}
              geometry={shared.bowString}
              material={shared.ink}
              ref={(m) => {
                strings.current[i] = m;
              }}
            />
          ))}
          <group ref={nocked}>
            <ArrowMesh shared={shared} />
          </group>
        </group>
      </group>
      <group ref={flying} scale={[map.flip, 1, 1]}>
        <ArrowMesh shared={shared} />
      </group>
    </>
  );
}

/** Soft clouds drifting across the sky, in front of the painted backdrop. */
function Clouds({ width, height, shared }: { width: number; height: number; shared: Shared }) {
  const group = useRef<Group>(null);
  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUDS }, (_, i) => ({
        y: height * (0.36 - (i % 2) * 0.14),
        z: -260 - i * 120,
        speed: 10 + i * 6,
        offset: (i / CLOUDS) * width * 1.6,
        puffs: [
          [0, 0, 1],
          [0.9, -0.15, 0.75],
          [-0.9, -0.2, 0.7],
          [0.35, 0.35, 0.7],
        ] as const,
        size: 34 + (i % 3) * 10,
      })),
    [width, height],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current?.children.forEach((c, i) => {
      const k = clouds[i];
      const span = width * 1.8;
      c.position.x = ((k.offset + t * k.speed) % span) - span / 2;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((k, i) => (
        <group key={i} position={[0, k.y, k.z]}>
          {k.puffs.map(([x, y, s], j) => (
            <mesh
              key={j}
              geometry={shared.cloud}
              material={shared.cloudMat}
              position={[x * k.size, y * k.size, 0]}
              scale={[k.size * s * 1.2, k.size * s, k.size * s * 0.6]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

export const Playfield3D = memo(function Playfield3D({ world, width, height, archerX }: Props) {
  const map = useMap(width, height);
  const shared = useShared();
  if (width <= 0 || height <= 0) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ltr]}>
    <Canvas
      flat
      gl={{ alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <CameraRig height={height} />
      <hemisphereLight args={[0xffffff, 0xb8d9a0, 1.5]} />
      <directionalLight position={[-300, 500, 600]} intensity={1.6} />
      <directionalLight position={[400, -100, 300]} intensity={0.35} />
      <Clouds width={width} height={height} shared={shared} />
      <Balloons world={world} map={map} shared={shared} />
      <BowAndArrows world={world} map={map} archerX={archerX} shared={shared} />
    </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  ltr: { direction: 'ltr' },
});
