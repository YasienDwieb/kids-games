/**
 * The mixing pot in 3D — a clay bowl of real-looking paint (react-three-fiber,
 * no model files). The paint rises with every drop, and each drop lands with a
 * splash in its own colour and a spiral that swirls into the paint while the
 * surface blends from the old colour to the new one. Between drops the paint
 * keeps a slow, gentle stir. An empty bowl wobbles to invite a drop, and the
 * bowl swells and its rim lights up while a colour is held over it (`hot`).
 *
 * Pure presentation: drop detection, the colour maths and the name / recipe
 * pills stay in <MixingZone>, which draws this behind its overlays.
 */
import { useMemo, useRef } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import {
  BackSide,
  BufferGeometry,
  Color,
  FrontSide,
  Float32BufferAttribute,
  LatheGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector2,
  type Group,
  type Mesh,
} from 'three';
import { ACCENTS, OUTLINE, COLORS as TOKENS } from '@/sdk';

LogBox.ignoreLogs(['THREE.Clock']);

/** Bowl height and how the wall flares: radius at a height (0..1 of the wall). Deep
 * enough, and seen low enough, that the wall shows — from above it read as a plate. */
const H = 0.85;
const radiusAt = (t: number) => 0.42 + 0.58 * Math.sin((Math.min(1, Math.max(0, t)) * Math.PI) / 2);
/** Paint level: starts high enough to be seen over the near rim, near the top at the cap. */
const levelFor = (drops: number, cap: number) => (drops <= 0 ? 0 : 0.5 + 0.4 * Math.min(1, drops / cap));
/** The ink outline's thickness, as a fraction of the bowl. */
const INK = 0.045;
const SWIRL_S = 0.9;
const SPLASH_S = 0.6;
const DROPLETS = 8;

/** A flat Archimedean spiral ribbon on the XZ plane, unit outer radius. */
function spiralGeometry(): BufferGeometry {
  const turns = 2.2;
  const steps = 120;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const a = k * turns * Math.PI * 2;
    const r = 0.06 + 0.86 * k;
    const w = 0.05 + 0.07 * k;
    for (const s of [-1, 1]) {
      const rr = r + (s * w) / 2;
      pos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
    }
    if (i > 0) {
      const b = i * 2;
      idx.push(b - 2, b - 1, b, b - 1, b + 1, b);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

type Drop = { hex: string; at: number } | null;

type SceneProps = { hex: string | null; dropCount: number; dropCap: number; lastDrop: Drop; hot: boolean; calm: boolean };

function Scene({ hex, dropCount, dropCap, lastDrop, hot, calm }: SceneProps) {
  const geo = useMemo(() => {
    const wall: Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      wall.push(new Vector2(radiusAt(t), t * H));
    }
    // The outline: the same wall pushed out, drawn back faces only in ink (inverted hull).
    const hull = wall.map((p) => new Vector2(p.x + INK, p.y));
    hull.unshift(new Vector2(0, -INK * 1.5), new Vector2(radiusAt(0) * 0.7, -INK * 1.5));
    return {
      wall: new LatheGeometry(wall, 48),
      hull: new LatheGeometry(hull, 48),
      spiral: spiralGeometry(),
    };
  }, []);
  const mat = useMemo(
    () => ({
      // Tinted outside so it stands off the cream page; white inside so the paint reads true.
      outside: new MeshStandardMaterial({
        color: ACCENTS.purple.tint,
        emissive: ACCENTS.purple.tint,
        emissiveIntensity: 0.3,
        roughness: 0.7,
        side: FrontSide,
      }),
      clay: new MeshStandardMaterial({
        color: TOKENS.surface,
        emissive: TOKENS.surface,
        emissiveIntensity: 0.25,
        roughness: 0.7,
        side: BackSide,
      }),
      inside: new MeshStandardMaterial({ color: TOKENS.surface2, emissive: TOKENS.surface2, emissiveIntensity: 0.3, roughness: 0.8 }),
      ink: new MeshBasicMaterial({ color: OUTLINE.color, side: BackSide }),
      shadow: new MeshBasicMaterial({ color: OUTLINE.color, transparent: true, opacity: 0.18, depthWrite: false }),
      rim: new MeshStandardMaterial({ color: ACCENTS.purple.base, emissive: ACCENTS.purple.base, emissiveIntensity: 0, roughness: 0.5 }),
      paint: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.18, metalness: 0.05, emissiveIntensity: 0.25 }),
      swirl: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, transparent: true, depthWrite: false }),
      drop: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
      ring: new MeshStandardMaterial({ color: '#ffffff', transparent: true, depthWrite: false }),
    }),
    [],
  );

  const paint = useRef<Mesh>(null);
  const swirl = useRef<Mesh>(null);
  const splash = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const bowl = useRef<Group>(null);

  // Colour blend: from what the pot was to what it is now, started on change.
  const blend = useRef({ from: new Color('#ffffff'), to: new Color('#ffffff'), at: -10, shown: '' });
  const level = useRef(0);
  const dropSeen = useRef<number>(0);
  const dropAt = useRef(-10);
  const heat = useRef(0);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const b = blend.current;
    if (hex && hex !== b.shown) {
      b.from.copy(b.shown ? (paint.current?.material as MeshStandardMaterial).color : new Color(hex));
      b.to.set(hex);
      b.at = t;
      b.shown = hex;
    }
    if (!hex) b.shown = '';
    if (lastDrop && lastDrop.at !== dropSeen.current) {
      dropSeen.current = lastDrop.at;
      dropAt.current = t;
      // The streak is the drop's colour pushed away from the paint's, so it still
      // reads when the two are close (blue into purple).
      const drop = new Color(lastDrop.hex);
      const paintNow = (paint.current?.material as MeshStandardMaterial | undefined)?.color;
      const lum = (c: Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      const toward = paintNow && lum(paintNow) > 0.45 ? new Color(TOKENS.ink) : new Color(TOKENS.surface);
      mat.swirl.color.copy(drop).lerp(toward, 0.35);
      mat.swirl.emissive.copy(mat.swirl.color).multiplyScalar(0.3);
      mat.drop.color.set(lastDrop.hex);
      mat.ring.color.set(lastDrop.hex);
    }

    // Paint rises smoothly to its level.
    const want = hex ? levelFor(dropCount, dropCap) : 0;
    level.current += (want - level.current) * Math.min(1, dt * 6);
    const lv = level.current;
    const y = lv * H;
    const r = radiusAt(lv) * 0.97;
    const p = paint.current;
    if (p) {
      p.visible = lv > 0.02;
      p.position.y = y;
      p.scale.set(r, 1, r);
      p.rotation.y = t * 0.25; // the slow stir
      const k = Math.min(1, (t - b.at) / SWIRL_S);
      const m = p.material as MeshStandardMaterial;
      m.color.copy(b.from).lerp(b.to, k * k * (3 - 2 * k));
      // A little self-light keeps the paint the colour the game names.
      m.emissive.copy(m.color);
    }

    // Swirl: the drop's colour spirals in and dissolves.
    const s = swirl.current;
    const ds = t - dropAt.current;
    if (s) {
      s.visible = ds < SWIRL_S && lv > 0.02;
      if (s.visible) {
        const k = ds / SWIRL_S;
        s.position.y = y + 0.006;
        s.scale.set(r * (1 - 0.35 * k), 1, r * (1 - 0.35 * k));
        s.rotation.y = -k * Math.PI * 2.4;
        mat.swirl.opacity = 0.95 * (1 - k);
      }
    }

    // Splash: droplets jump up and fall back, a ring spreads on the surface.
    const sp = splash.current;
    if (sp) {
      sp.visible = ds < SPLASH_S;
      if (sp.visible) {
        const k = ds / SPLASH_S;
        sp.children.forEach((c, i) => {
          const a = (i / DROPLETS) * Math.PI * 2;
          const out = 0.15 + 0.45 * k;
          c.position.set(Math.cos(a) * out, y + 0.05 + Math.sin(k * Math.PI) * 0.4, Math.sin(a) * out);
          c.scale.setScalar(0.06 * (1 - 0.6 * k));
        });
      }
    }
    const rg = ring.current;
    if (rg) {
      rg.visible = ds < SPLASH_S && lv > 0.02;
      if (rg.visible) {
        const k = ds / SPLASH_S;
        rg.position.y = y + 0.01;
        rg.scale.setScalar(0.1 + r * 0.9 * k);
        mat.ring.opacity = 0.8 * (1 - k);
      }
    }

    // Held over the bowl, a colour makes it swell and its rim glow: "drop it here".
    heat.current += ((hot ? 1 : 0) - heat.current) * Math.min(1, dt * 10);
    const h = heat.current;
    mat.rim.emissiveIntensity = 0.7 * h;

    // The bowl gives a small bump when a drop lands; empty, it wobbles to invite one.
    const bw = bowl.current;
    if (bw) {
      const k = ds < 0.3 ? Math.sin((ds / 0.3) * Math.PI) * (1 - ds / 0.3) : 0;
      const grow = 1 + 0.08 * h;
      bw.scale.set(grow * (1 + k * 0.04), grow * (1 - k * 0.05), grow * (1 + k * 0.04));
      const wobble = !hex && !calm && h < 0.5;
      const target = wobble ? Math.sin(t * 2.6) * 0.06 * (0.6 + 0.4 * Math.sin(t * 0.9)) : 0;
      bw.rotation.z += (target - bw.rotation.z) * Math.min(1, dt * 8);
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
    {/* A hard ink shadow on the table, offset like the app's other shadows. */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.08, -0.08, 0.06]} material={mat.shadow}>
      <circleGeometry args={[0.62, 40]} />
    </mesh>
    <group ref={bowl}>
      {/* Clay bowl: ink outline, tinted outside, white inside, inner floor, a coloured
          rim and a little foot. */}
      <mesh geometry={geo.hull} material={mat.ink} />
      <mesh geometry={geo.wall} material={mat.outside} />
      <mesh geometry={geo.wall} material={mat.clay} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={mat.inside}>
        <circleGeometry args={[radiusAt(0), 32]} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat.rim}>
        <torusGeometry args={[radiusAt(1), 0.045, 12, 64]} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat.ink}>
        <torusGeometry args={[radiusAt(1), 0.045 + INK * 0.6, 12, 64]} />
      </mesh>
      <mesh position={[0, -0.04, 0]} material={mat.rim}>
        <cylinderGeometry args={[0.3, 0.34, 0.08, 32]} />
      </mesh>

      {/* Paint surface. */}
      <mesh ref={paint} rotation={[0, 0, 0]} material={mat.paint} visible={false}>
        <cylinderGeometry args={[1, 1, 0.012, 48]} />
      </mesh>
      <mesh ref={swirl} geometry={geo.spiral} material={mat.swirl} visible={false} />
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} material={mat.ring} visible={false}>
        <torusGeometry args={[1, 0.025, 8, 48]} />
      </mesh>
      <group ref={splash} visible={false}>
        {Array.from({ length: DROPLETS }, (_, i) => (
          <mesh key={i} material={mat.drop}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        ))}
      </group>
    </group>
    </group>
  );
}

type Bowl3DProps = {
  size: number;
  hex: string | null;
  dropCount: number;
  dropCap: number;
  lastDrop: Drop;
  /** A colour is being held over the bowl. */
  hot: boolean;
  /** Reduce Motion: no idle wobble. */
  calm: boolean;
};

export function Bowl3D({ size, hex, dropCount, dropCap, lastDrop, hot, calm }: Bowl3DProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: size, height: size }]}>
      <Canvas
        flat
        gl={{ alpha: true }}
        camera={{ position: [0, 2.0, 2.9], fov: 40 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          camera.lookAt(0, -0.18, 0);
        }}
      >
        <hemisphereLight args={[0xffffff, 0xd9cfe8, 1.2]} />
        <directionalLight position={[1.5, 3, 2]} intensity={1.4} />
        <Scene hex={hex} dropCount={dropCount} dropCap={dropCap} lastDrop={lastDrop} hot={hot} calm={calm} />
      </Canvas>
    </View>
  );
}
