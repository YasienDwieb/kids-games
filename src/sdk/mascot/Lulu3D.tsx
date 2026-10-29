/**
 * The buddy in 3D — Lulu the owl or Zain the lion cub, rigged semi-realistic
 * models moved bone by bone: they breathe, sway, follow the child's finger
 * with their head, wave, hop and cheer, nod to encourage, point, and react to
 * a tap with a hop, a spin and a giggle.
 *
 *   <Lulu3D size={140} mood="cheer" />
 *   <Lulu3D size={120} interactive />   // tap / drag
 *   <Lulu3D buddy="zain" />             // a specific buddy (default: the chosen one)
 *
 * `active={false}` stops the render loop (keep a mounted Lulu cheap while
 * hidden). They match the 2D poses in `Mascot`.
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { Canvas, createPortal, useFrame } from '@react-three/fiber/native';
import { Bone, Euler, Group as GroupImpl, Quaternion, Vector3, type Group, type Object3D } from 'three';
import { useModel3D, type ModelSource } from '@/sdk/three/models';
import { COLORS, POP } from '@/constants/colors';
import { useBuddy, type BuddyId } from '@/sdk/buddy';
import { useWearing, type Wearing } from '@/sdk/player/outfitStore';
import { useSound } from '@/sdk/audio/useSound';
import { currentLanguage } from '@/sdk/i18n';
import { useTranslation } from 'react-i18next';

export type LuluMood = 'idle' | 'wave' | 'cheer' | 'encourage' | 'point';

const INK = COLORS.ink;
const GOLD = COLORS.gold;
const PINK = POP.bubblegum;
const BLUE = POP.splash;
const DRAG_SLOP = 8;


/** Lulu's wardrobe in 3D: each item hangs off the head so it turns with her. */
function Hat({ id }: { id: string | null }) {
  switch (id) {
    case 'party-hat':
      return (
        <group position={[0.05, 0.66, 0.04]} rotation={[0, 0, -0.22]}>
          <mesh>
            <coneGeometry args={[0.17, 0.4, 20]} />
            <meshToonMaterial color={PINK} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <torusGeometry args={[0.13, 0.02, 8, 24]} />
            <meshToonMaterial color={GOLD} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <meshToonMaterial color={GOLD} />
          </mesh>
        </group>
      );
    case 'cap':
      return (
        <group position={[0, 0.5, 0.02]}>
          <mesh>
            <sphereGeometry args={[0.31, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshToonMaterial color={BLUE} />
          </mesh>
          <mesh position={[0, 0.01, 0.3]} scale={[1, 0.12, 0.7]}>
            <cylinderGeometry args={[0.22, 0.22, 0.2, 20]} />
            <meshToonMaterial color={BLUE} />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshToonMaterial color={GOLD} />
          </mesh>
        </group>
      );
    case 'crown':
      return (
        <group position={[0, 0.62, 0.03]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 24, 1, true]} />
            <meshToonMaterial color={GOLD} side={2} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.2, 0.12, Math.cos(a) * 0.2]}>
                <coneGeometry args={[0.045, 0.12, 8]} />
                <meshToonMaterial color={GOLD} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, 0.2]}>
            <sphereGeometry args={[0.04, 10, 8]} />
            <meshToonMaterial color={PINK} />
          </mesh>
        </group>
      );
    case 'flower':
      return (
        <group position={[0.27, 0.48, 0.2]} rotation={[0.3, 0.4, 0]}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0]} scale={[1, 1, 0.5]}>
                <sphereGeometry args={[0.065, 12, 10]} />
                <meshToonMaterial color={PINK} />
              </mesh>
            );
          })}
          <mesh position={[0, 0, 0.03]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshToonMaterial color={GOLD} />
          </mesh>
        </group>
      );
    case 'top-hat':
      return (
        <group position={[0, 0.6, 0.02]} rotation={[0, 0, 0.12]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.32, 0.03, 28]} />
            <meshToonMaterial color={INK} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.34, 24]} />
            <meshToonMaterial color={INK} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.195, 0.195, 0.06, 24]} />
            <meshToonMaterial color={PINK} />
          </mesh>
        </group>
      );
    case 'bow':
      return (
        <group position={[0, 0.6, 0.12]}>
          {[-1, 1].map((sgn) => (
            <mesh key={sgn} position={[sgn * 0.1, 0, 0]} rotation={[0, 0, sgn * Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.18, 12]} />
              <meshToonMaterial color={PINK} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshToonMaterial color={PINK} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function Glasses({ id }: { id: string | null }) {
  if (id !== 'round-glasses' && id !== 'sunglasses') return null;
  const dark = id === 'sunglasses';
  return (
    <group position={[0, 0.15, 0.58]}>
      {[-0.15, 0.15].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.115, 0.02, 8, 28]} />
            <meshToonMaterial color={dark ? INK : BLUE} />
          </mesh>
          {dark ? (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.01, 24]} />
              <meshBasicMaterial color={INK} transparent opacity={0.85} />
            </mesh>
          ) : null}
        </group>
      ))}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
        <meshToonMaterial color={dark ? INK : BLUE} />
      </mesh>
    </group>
  );
}

/** Number of tap reaction lines per buddy and language (`<buddy>.tap.<lang>.<n>` in the manifest). */
export const LULU_TAP_LINES = 3;

type Reaction = { at: number };

type Pointer = { x: number; y: number; active: boolean };

type RigProps = {
  mood: LuluMood;
  wearing: Wearing;
  pointer: React.MutableRefObject<Pointer>;
  reaction: React.MutableRefObject<Reaction>;
  spin: React.MutableRefObject<number>;
};

/**
 * Each buddy is a rigged Higgsfield model (Image to 3D + auto-rig, see
 * CREDITS.md) — a soft semi-realistic owl / lion cub — animated in code by
 * turning its bones, so one model covers every mood: breathing and a gentle
 * sway, an arm/wing wave, a cheering hop with both arms up, a nod, a point,
 * and the head turning to follow the child's finger.
 */
const MODELS: Record<BuddyId, ModelSource> = {
  lulu: { glb: require('../assets/models/lulu.glb'), rgba: require('../assets/models/lulu.rgba'), sheen: 0.5 },
  zain: { glb: require('../assets/models/zain.glb'), rgba: require('../assets/models/zain.rgba'), sheen: 0.5 },
};

/**
 * Model height in scene units; where the wardrobe sits on each head (head-bone
 * space, scene units, then scaled by `wear`); and how far to lower the arms
 * from the rig's A-pose so they hang naturally.
 */
const BUDDY_FIT: Record<
  BuddyId,
  { height: number; hat: [number, number, number]; glasses: [number, number, number]; wear: number; armRest: number }
> = {
  lulu: { height: 1.4, hat: [0, -0.12, 0], glasses: [0, 0.06, -0.25], wear: 1.2, armRest: -0.2 },
  zain: { height: 1.5, hat: [0, 0.26, 0], glasses: [0, 0.15, -0.13], wear: 0.85, armRest: -0.4 },
};

/** Where the feet stand: the bottom of the camera's view, with a little room. */
const FEET_Y = -0.84;

const BONES = ['Hips', 'Spine', 'Spine01', 'neck', 'Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm'] as const;
type BoneName = (typeof BONES)[number];
type BoneRig = { bone: Bone; rest: Quaternion; world: Quaternion; worldInv: Quaternion };

const tmpQ = new Quaternion();
const tmpE = new Euler();

/**
 * Rotate a bone by a model-space euler (x = nod down, y = turn toward +x,
 * z = roll / raise an arm on the +x side), on top of its rest pose. Working in
 * model space keeps the moods readable whatever the rig's local bone axes are.
 */
function pose(r: BoneRig | undefined, x: number, y: number, z: number) {
  if (!r) return;
  tmpE.set(x, y, z, 'YXZ');
  tmpQ.setFromEuler(tmpE);
  // local = rest · (worldRestInv · Δ · worldRest)
  r.bone.quaternion.copy(r.rest).multiply(tmpQ.premultiply(r.worldInv).multiply(r.world));
}

function useBones(obj: Object3D | null) {
  return useMemo(() => {
    const rig: Partial<Record<BoneName, BoneRig>> = {};
    if (!obj) return rig;
    obj.updateMatrixWorld(true);
    const rootInv = obj.getWorldQuaternion(new Quaternion()).invert();
    obj.traverse((o) => {
      const name = o.name as BoneName;
      if (!(o instanceof Bone) || !BONES.includes(name) || rig[name]) return;
      const world = o.getWorldQuaternion(new Quaternion()).premultiply(rootInv);
      rig[name] = { bone: o, rest: o.quaternion.clone(), world, worldInv: world.clone().invert() };
    });
    return rig;
  }, [obj]);
}

function BuddyBody({ buddy, mood, wearing, pointer, reaction, spin }: RigProps & { buddy: BuddyId }) {
  const fit = BUDDY_FIT[buddy];
  const obj = useModel3D(MODELS[buddy], fit.height, 'height');
  const rig = useBones(obj);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const turned = useRef(0); // eased copy of `spin`, so letting go glides back
  const look = useRef({ x: 0, y: 0 });

  // The wardrobe rides on the head bone, undoing the rig's own scale.
  const wear = useMemo(() => {
    const head = rig.Head?.bone;
    if (!head || !obj) return null;
    const g = new GroupImpl();
    // Undo the bone's rest rotation and scale, so wear is authored upright in scene units.
    g.quaternion.copy(rig.Head!.worldInv);
    g.scale.setScalar(1 / Math.max(head.getWorldScale(new Vector3()).x, 1e-6));
    head.add(g);
    return g;
  }, [rig, obj]);
  useEffect(() => () => {
    wear?.removeFromParent();
  }, [wear]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    const r = root.current;
    const b = body.current;
    if (!r || !b) return;

    let y = 0;
    let sy = 1 + Math.sin(t * 2.2) * 0.012;
    let rotY = Math.sin(t * 0.7) * 0.15;
    let rotZ = 0;
    let nod = 0;
    let tilt = Math.sin(t * 0.9) * 0.04;
    // Arms: [raise, forearm bend] — raise lifts the arm out to the side.
    let lArm = 0.08 + Math.sin(t * 2.2) * 0.03;
    let rArm = 0.08 + Math.sin(t * 2.2 + 0.4) * 0.03;
    let lFore = 0;
    let rFore = 0;
    let lFwd = 0;
    let rFwd = 0;

    if (mood === 'cheer') {
      const hop = Math.abs(Math.sin(t * 5));
      y = hop * 0.22;
      sy = 0.94 + hop * 0.1;
      lArm = rArm = 2.0 + Math.sin(t * 14) * 0.25;
      lFwd = rFwd = 0.45;
      rotY = Math.sin(t * 2) * 0.35;
      nod = -0.15;
    } else if (mood === 'wave') {
      // Upper arm out at shoulder height and a little forward, forearm up,
      // waving from the elbow.
      lArm = 1.25;
      lFwd = 0.55;
      lFore = 1.1 + Math.sin(t * 7) * 0.4;
      tilt = 0.08;
    } else if (mood === 'encourage') {
      nod = Math.max(0, Math.sin(t * 4)) * 0.25;
      lArm = 1.2;
      lFore = 1.2;
      lFwd = 0.6;
      tilt = 0.12;
    } else if (mood === 'point') {
      rotZ = -0.06;
      lArm = 1.45;
      lFwd = 0.35;
      rotY = 0.3;
    }

    // Tap reaction: squash, jump, full spin over ~0.8 s.
    const since = t - reaction.current.at;
    if (reaction.current.at > 0 && since < 0.8) {
      const k = since / 0.8;
      y += Math.sin(k * Math.PI) * 0.45;
      sy *= k < 0.15 ? 1 - k : 1 + Math.sin(k * Math.PI) * 0.06;
      rotY += k * Math.PI * 2;
      lArm = rArm = 1.6 + Math.sin(since * 30) * 0.3;
      lFwd = rFwd = 0.4;
    }
    if (reaction.current.at < 0) reaction.current.at = t; // a pending tap starts now

    r.position.y = FEET_Y + y;
    turned.current += (spin.current - turned.current) * 0.2;
    r.rotation.y = rotY + turned.current;
    r.rotation.z = rotZ;
    b.scale.set(1 + (1 - sy) * 0.5, sy, 1 + (1 - sy) * 0.5);

    // Head follows the finger while it's down, else glances about.
    const p = pointer.current;
    const k = 1 - Math.exp(-dt * 8);
    look.current.x += ((p.active ? p.x : Math.sin(t * 0.5) * 0.25) - look.current.x) * k;
    look.current.y += ((p.active ? p.y : 0) - look.current.y) * k;
    pose(rig.Head, nod - look.current.y * 0.35, look.current.x * 0.55, tilt);
    pose(rig.Spine, 0, look.current.x * 0.12, -tilt * 0.4);
    // Arms: the character's left arm is on +x (it faces the camera).
    // Raise = roll about the front axis; forward = swing about the vertical
    // axis, so a raised paw comes out in front of the mane, not behind it.
    pose(rig.LeftArm, 0, -lFwd, lArm + fit.armRest);
    pose(rig.RightArm, 0, rFwd, -(rArm + fit.armRest));
    pose(rig.LeftForeArm, 0, 0, lFore);
    pose(rig.RightForeArm, 0, 0, -rFore);
  });

  if (!obj) return null;
  return (
    <group ref={root} position={[0, FEET_Y, 0]}>
      <group ref={body}>
        <primitive object={obj} />
      </group>
      {wear
        ? createPortal(
            <group scale={fit.wear}>
              <group position={fit.hat}>
                <Hat id={wearing.hat} />
              </group>
              <group position={fit.glasses}>
                <Glasses id={wearing.glasses} />
              </group>
            </group>,
            wear,
          )
        : null}
    </group>
  );
}

type Lulu3DProps = {
  size?: number;
  mood?: LuluMood;
  /** Tap for a hop + giggle, drag to spin her and make her look at your finger. */
  interactive?: boolean;
  /** Pause rendering while she's off screen. */
  active?: boolean;
  /** What she wears; defaults to the child's saved outfit. */
  wearing?: Wearing;
  /** Which buddy to draw; defaults to the child's chosen one. */
  buddy?: BuddyId;
  style?: ViewStyle;
};

export function Lulu3D({
  size = 140,
  mood = 'idle',
  interactive = false,
  active = true,
  wearing,
  buddy,
  style,
}: Lulu3DProps) {
  const saved = useWearing();
  const chosen = useBuddy();
  const who = buddy ?? chosen;
  const { t } = useTranslation();
  const { play, prewarm } = useSound();
  const pointer = useRef<Pointer>({ x: 0, y: 0, active: false });
  const reaction = useRef<Reaction>({ at: 0 });
  const spin = useRef(0);
  const box = useRef({ w: size, h: size });
  const line = useRef(0);
  const drag = useRef({ x0: 0, spin0: 0, moved: false });

  useEffect(() => {
    if (!interactive) return;
    const lang = currentLanguage();
    prewarm(Array.from({ length: LULU_TAP_LINES }, (_, i) => `${who}.tap.${lang}.${i + 1}`));
  }, [interactive, prewarm, who]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        // Claim only sideways drags so a parent ScrollView keeps vertical scrolls.
        onMoveShouldSetPanResponder: (_, g) =>
          interactive && Math.abs(g.dx) > DRAG_SLOP && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => !drag.current.moved,
        onPanResponderGrant: (e) => {
          drag.current = { x0: e.nativeEvent.locationX, spin0: spin.current, moved: false };
          pointer.current = {
            x: (e.nativeEvent.locationX / box.current.w) * 2 - 1,
            y: 1 - (e.nativeEvent.locationY / box.current.h) * 2,
            active: true,
          };
        },
        onPanResponderMove: (e, g) => {
          if (Math.abs(g.dx) > 6) drag.current.moved = true;
          spin.current = drag.current.spin0 + (g.dx / box.current.w) * Math.PI * 1.5;
          pointer.current = {
            x: Math.max(-1, Math.min(1, (e.nativeEvent.locationX / box.current.w) * 2 - 1)),
            y: Math.max(-1, Math.min(1, 1 - (e.nativeEvent.locationY / box.current.h) * 2)),
            active: true,
          };
        },
        onPanResponderRelease: () => {
          pointer.current.active = false;
          spin.current = 0; // she turns back to face the child
          if (!drag.current.moved) {
            reaction.current.at = -1; // start the hop on the next frame
            line.current = (line.current % LULU_TAP_LINES) + 1;
            play(`${who}.tap.${currentLanguage()}.${line.current}`, { haptic: true });
          }
        },
        onPanResponderTerminate: () => {
          pointer.current.active = false;
          spin.current = 0;
        },
      }),
    [interactive, play, who],
  );

  return (
    <View
      style={[{ width: size, height: size }, style]}
      pointerEvents={interactive ? 'auto' : 'none'}
      onLayout={(e: LayoutChangeEvent) => {
        box.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height };
      }}
      accessible={interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={interactive ? t(`buddy.${who}.name`) : undefined}
      {...(interactive ? responder.panHandlers : {})}
    >
      <Canvas
        style={StyleSheet.absoluteFill}
        frameloop={active ? 'always' : 'never'}
        gl={{ alpha: true }}
        camera={{ position: [0, 0.3, 3.8], fov: 34 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        {/* Soft sky/ground fill, a warm key and a cool rim that lifts the fur edge. */}
        <hemisphereLight args={[0xfff6e8, 0x8a7a9a, 1.1]} />
        <directionalLight position={[2, 3, 4]} intensity={1.5} color={0xfff1dc} />
        <directionalLight position={[-3, 2, -3]} intensity={0.9} color={0xdfe8ff} />
        <BuddyBody buddy={who} mood={mood} wearing={wearing ?? saved} pointer={pointer} reaction={reaction} spin={spin} />
      </Canvas>
    </View>
  );
}

/** Alias that reads better at new call sites: the chosen buddy in 3D. */
export const Buddy3D = Lulu3D;
