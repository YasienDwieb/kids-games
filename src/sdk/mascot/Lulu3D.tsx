/**
 * Lulu in 3D — the mascot built from soft toon-shaded shapes (no model file),
 * so every part can move: she breathes, blinks, follows the child's finger
 * with her eyes and head, flaps on a cheer, nods to encourage, and reacts to
 * a tap with a hop, a spin and a giggle.
 *
 *   <Lulu3D size={140} mood="cheer" />
 *   <Lulu3D size={120} interactive />   // tap / drag her
 *
 * `active={false}` stops the render loop (keep a mounted Lulu cheap while
 * hidden). Colours match the 2D art: lavender body, cream face and belly.
 */
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type { Group, Mesh } from 'three';
import { ACCENTS, COLORS, POP } from '@/constants/colors';
import { useWearing, type Wearing } from '@/sdk/quests/outfitStore';
import { useSound } from '@/sdk/audio/useSound';
import { currentLanguage } from '@/sdk/i18n';
import { useTranslation } from 'react-i18next';

export type LuluMood = 'idle' | 'wave' | 'cheer' | 'encourage' | 'point';

const PURPLE = ACCENTS.purple.base;
const PURPLE_DEEP = ACCENTS.purple.deep;
const CREAM = ACCENTS.orange.tint;
const BELLY = COLORS.canvas2;
const ORANGE = ACCENTS.orange.base;
const INK = COLORS.ink;
const WHITE = COLORS.surface;
const GOLD = COLORS.gold;
const PINK = POP.bubblegum;
const BLUE = POP.splash;
const DRAG_SLOP = 8;

/** Hats that sit on top of the head hide the crown feathers under them. */
const COVERS_FEATHERS = new Set(['party-hat', 'cap', 'crown', 'top-hat']);

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

/** Number of tap reaction lines per language (`lulu.tap.<lang>.<n>` in the manifest). */
export const LULU_TAP_LINES = 3;

type Reaction = { at: number };

type Pointer = { x: number; y: number; active: boolean };

function Owl({
  mood,
  wearing,
  pointer,
  reaction,
  spin,
}: {
  mood: LuluMood;
  wearing: Wearing;
  pointer: React.MutableRefObject<Pointer>;
  reaction: React.MutableRefObject<Reaction>;
  spin: React.MutableRefObject<number>;
}) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);
  const eyes = useRef<(Mesh | null)[]>([]);
  const pupils = useRef<(Group | null)[]>([]);
  const blinkAt = useRef(1.5);
  const turned = useRef(0); // eased copy of `spin`, so letting go glides back

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const r = root.current;
    const b = body.current;
    const h = head.current;
    if (!r || !b || !h) return;

    // Breathing + idle sway.
    let y = 0;
    let sx = 1;
    let sy = 1 + Math.sin(t * 2.2) * 0.02;
    let rotY = Math.sin(t * 0.7) * 0.18;
    let rotZ = 0;
    let headX = 0;
    let wingL0 = 0.15;
    let wingR0 = 0.15;

    if (mood === 'cheer') {
      // Hop, flap, little spin.
      const hop = Math.abs(Math.sin(t * 5));
      y = hop * 0.28;
      sy = 0.9 + hop * 0.18;
      sx = 1.08 - hop * 0.1;
      wingL0 = wingR0 = 0.6 + Math.sin(t * 18) * 0.5;
      rotY = Math.sin(t * 2) * 0.5;
    } else if (mood === 'wave') {
      wingR0 = 1.4 + Math.sin(t * 7) * 0.45;
    } else if (mood === 'encourage') {
      headX = Math.max(0, Math.sin(t * 4)) * 0.22; // nod
      wingL0 = 1.3; // thumbs-up wing
    } else if (mood === 'point') {
      rotZ = -0.12;
      wingR0 = 1.6;
      rotY = 0.35;
    }

    // Tap reaction: squash, jump, full spin over ~0.8 s.
    const since = t - reaction.current.at;
    if (reaction.current.at > 0 && since < 0.8) {
      const k = since / 0.8;
      y += Math.sin(k * Math.PI) * 0.5;
      sy *= k < 0.15 ? 1 - k * 1.5 : 1 + Math.sin(k * Math.PI) * 0.08;
      rotY += k * Math.PI * 2;
      wingL0 = wingR0 = 1 + Math.sin(since * 30) * 0.4;
    }
    if (reaction.current.at < 0) reaction.current.at = t; // a pending tap starts now

    r.position.y = y - 0.05;
    turned.current += (spin.current - turned.current) * 0.2;
    r.rotation.y = rotY + turned.current;
    r.rotation.z = rotZ;
    b.scale.set(sx, sy, sx);
    if (wingL.current) wingL.current.rotation.z = wingL0;
    if (wingR.current) wingR.current.rotation.z = -wingR0;

    // Head + eyes follow the finger while it's down, else drift home.
    const p = pointer.current;
    const lookX = p.active ? p.x : Math.sin(t * 0.5) * 0.2;
    const lookY = p.active ? p.y : 0;
    h.rotation.y += (lookX * 0.5 - h.rotation.y) * 0.15;
    h.rotation.x += (-lookY * 0.3 + headX - h.rotation.x) * 0.15;
    pupils.current.forEach((pu) => {
      if (!pu) return;
      pu.position.x = lookX * 0.03;
      pu.position.y = lookY * 0.03;
    });

    // Blink every few seconds.
    if (t > blinkAt.current) blinkAt.current = t + 2.5 + Math.random() * 2.5;
    const blink = blinkAt.current - t > 0.12 ? 1 : 0.1;
    eyes.current.forEach((e) => {
      if (e) e.scale.y = blink;
    });
  });

  return (
    <group ref={root}>
      <group ref={body}>
        {/* Body + belly */}
        <mesh scale={[1, 1.02, 0.92]}>
          <sphereGeometry args={[0.55, 32, 24]} />
          <meshToonMaterial color={PURPLE} />
        </mesh>
        <mesh position={[0, -0.16, 0.3]} scale={[0.82, 0.85, 0.5]}>
          <sphereGeometry args={[0.42, 28, 20]} />
          <meshToonMaterial color={BELLY} />
        </mesh>

        {/* Wings, pivoting at the shoulder */}
        <group ref={wingL} position={[-0.5, 0.05, 0]}>
          <mesh position={[-0.05, -0.2, 0]} scale={[0.32, 0.75, 0.5]}>
            <sphereGeometry args={[0.32, 20, 16]} />
            <meshToonMaterial color={PURPLE_DEEP} />
          </mesh>
        </group>
        <group ref={wingR} position={[0.5, 0.05, 0]}>
          <mesh position={[0.05, -0.2, 0]} scale={[0.32, 0.75, 0.5]}>
            <sphereGeometry args={[0.32, 20, 16]} />
            <meshToonMaterial color={PURPLE_DEEP} />
          </mesh>
        </group>

        {/* Feet */}
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, -0.55, 0.18]} scale={[1, 0.45, 1.3]}>
            <sphereGeometry args={[0.1, 14, 10]} />
            <meshToonMaterial color={ORANGE} />
          </mesh>
        ))}

        {/* Head features (turn together) */}
        <group ref={head} position={[0, 0.12, 0]}>
          {/* Face mask */}
          <mesh position={[0, 0.12, 0.36]} scale={[1.05, 0.62, 0.42]}>
            <sphereGeometry args={[0.36, 28, 20]} />
            <meshToonMaterial color={CREAM} />
          </mesh>
          {/* Eyes */}
          {[-0.15, 0.15].map((x, i) => (
            <group key={x} position={[x, 0.15, 0.49]}>
              <mesh ref={(m) => { eyes.current[i] = m; }}>
                <sphereGeometry args={[0.1, 20, 16]} />
                <meshToonMaterial color={WHITE} />
              </mesh>
              <group ref={(g) => { pupils.current[i] = g; }} position={[0, 0, 0.07]}>
                <mesh>
                  <sphereGeometry args={[0.055, 16, 12]} />
                  <meshBasicMaterial color={INK} />
                </mesh>
                <mesh position={[0.02, 0.025, 0.04]}>
                  <sphereGeometry args={[0.015, 8, 6]} />
                  <meshBasicMaterial color={WHITE} />
                </mesh>
              </group>
            </group>
          ))}
          {/* Beak */}
          <mesh position={[0, 0.03, 0.56]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
            <coneGeometry args={[0.06, 0.14, 12]} />
            <meshToonMaterial color={ORANGE} />
          </mesh>
          {/* Ear tufts + crown feathers */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.32, 0.5, 0.02]} rotation={[0, 0, -s * 0.5]}>
              <coneGeometry args={[0.1, 0.26, 10]} />
              <meshToonMaterial color={PURPLE} />
            </mesh>
          ))}
          {COVERS_FEATHERS.has(wearing.hat ?? '')
            ? null
            : [-0.06, 0, 0.06].map((x, i) => (
                <mesh key={x} position={[x, 0.55 + (i === 1 ? 0.04 : 0), 0.05]} rotation={[0, 0, -x * 4]}>
                  <coneGeometry args={[0.04, 0.16, 8]} />
                  <meshToonMaterial color={PURPLE} />
                </mesh>
              ))}
          <Hat id={wearing.hat} />
          <Glasses id={wearing.glasses} />
        </group>
      </group>
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
  style?: ViewStyle;
};

export function Lulu3D({
  size = 140,
  mood = 'idle',
  interactive = false,
  active = true,
  wearing,
  style,
}: Lulu3DProps) {
  const saved = useWearing();
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
    prewarm(Array.from({ length: LULU_TAP_LINES }, (_, i) => `lulu.tap.${lang}.${i + 1}`));
  }, [interactive, prewarm]);

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
            play(`lulu.tap.${currentLanguage()}.${line.current}`, { haptic: true });
          }
        },
        onPanResponderTerminate: () => {
          pointer.current.active = false;
          spin.current = 0;
        },
      }),
    [interactive, play],
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
      accessibilityLabel={interactive ? t('mascot.name') : undefined}
      {...(interactive ? responder.panHandlers : {})}
    >
      <Canvas
        style={StyleSheet.absoluteFill}
        frameloop={active ? 'always' : 'never'}
        gl={{ alpha: true }}
        camera={{ position: [0, 0.22, 3.4], fov: 34 }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} />
        <Owl mood={mood} wearing={wearing ?? saved} pointer={pointer} reaction={reaction} spin={spin} />
      </Canvas>
    </View>
  );
}
