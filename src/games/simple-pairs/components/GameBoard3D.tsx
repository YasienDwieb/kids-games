/**
 * Simple Pairs in 3D — a drop-in for <GameBoard> (same props, same game hook):
 * real cards with rounded edges that lift, turn over and land, a green back
 * with a star emblem, the animal's art on the face, a happy bounce when a pair
 * matches and a little shake when it doesn't.
 *
 * One Canvas draws the whole board; the camera maps the z = 0 plane 1:1 onto
 * the board's pixels, so each card's touch target is a plain Pressable laid out
 * at the same rectangle. Card art is the bundled Noto emoji PNG, loaded as a
 * texture through react-three-fiber's native TextureLoader.
 */
import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, LogBox, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import {
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type PerspectiveCamera,
  type Texture,
} from 'three';
import { getEmojiImage } from '@/sdk';
import { SPACING } from '../../../constants';
import { GAME_COLORS, LAYOUT, TIMING } from '../constants';
import type { Card as CardType } from '../types';

LogBox.ignoreLogs(['THREE.Clock']);

const FOV = 35;
const BOARD_PADDING = SPACING.lg;
const BACK_EMBLEM = '⭐';

type Props = {
  cards: CardType[];
  onCardPress: (cardId: string) => void;
  disabled: boolean;
  columns: number;
};

type Rect = { x: number; y: number; size: number };

/** Card rectangles in board pixels: rows centred, spread evenly in landscape. */
function layoutCards(count: number, columns: number, w: number, h: number, landscape: boolean): Rect[] {
  const rows = Math.ceil(count / columns);
  const padV = (landscape ? SPACING.xs : BOARD_PADDING) * 2;
  const widthSize = Math.floor((w - BOARD_PADDING * 2) / columns - LAYOUT.CARD_GAP);
  const heightSize = Math.floor((h - padV) / rows - LAYOUT.CARD_GAP);
  const size = Math.max(0, Math.min(widthSize, heightSize, LAYOUT.CARD_SIZE));
  const gridH = rows * size + (rows - 1) * LAYOUT.CARD_GAP;
  const top = (h - gridH) / 2;
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / columns);
    const c = i % columns;
    const inRow = Math.min(columns, count - r * columns);
    let x: number;
    if (landscape) {
      const space = (w - BOARD_PADDING * 2 - inRow * size) / (inRow + 1);
      x = BOARD_PADDING + space + c * (size + space);
    } else {
      const rowW = inRow * size + (inRow - 1) * LAYOUT.CARD_GAP;
      x = (w - rowW) / 2 + c * (size + LAYOUT.CARD_GAP);
    }
    return { x, y: top + r * (size + LAYOUT.CARD_GAP), size };
  });
}

/** Puts the camera where the z = 0 plane fills the view pixel for pixel. */
function CameraRig({ height }: { height: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useMemo(() => {
    const dist = height / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);
    camera.fov = FOV;
    camera.near = 1;
    camera.far = dist * 3;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, height]);
  return null;
}

function roundedShape(size: number, radius: number): Shape {
  const s = size / 2;
  const r = Math.min(radius, s);
  const shape = new Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r);
  shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s);
  shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r);
  shape.quadraticCurveTo(-s, -s, -s + r, -s);
  return shape;
}

const roundedRect = (size: number, radius: number) => new ShapeGeometry(roundedShape(size, radius), 6);

/** A card blank: a rounded rectangle extruded to `depth`, edges softly bevelled, centred. */
function cardBody(size: number, radius: number, depth: number): ExtrudeGeometry {
  const bevel = Math.min(2, depth / 3);
  const g = new ExtrudeGeometry(roundedShape(size - bevel * 2, radius), {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.center();
  return g;
}

const textures = new Map<number, Texture>();
/** One texture per bundled emoji image, shared by every card that shows it. */
function emojiTexture(emoji: string): Texture | null {
  const src = getEmojiImage(emoji);
  if (typeof src !== 'number') return null;
  let tex = textures.get(src);
  if (!tex) {
    tex = new TextureLoader().load(src as unknown as string);
    tex.colorSpace = SRGBColorSpace;
    textures.set(src, tex);
  }
  return tex;
}

/** Per-card animation state, eased every frame toward the card's game state. */
type Motion = { flip: number; lift: number; press: number; matchAt: number; missAt: number; wasFront: boolean; wasMatched: boolean };

function CardMesh({ card, rect, map, pressed }: { card: CardType; rect: Rect; map: (r: Rect) => [number, number]; pressed: boolean }) {
  const group = useRef<Group>(null);
  const turn = useRef<Group>(null);
  const m = useRef<Motion>({ flip: 0, lift: 0, press: 0, matchAt: -10, missAt: -10, wasFront: false, wasMatched: false });
  const s = rect.size;
  const depth = Math.max(4, s * 0.07);

  const geo = useMemo(
    () => ({
      body: cardBody(s, s * 0.14, depth),
      face: roundedRect(s * 0.88, s * 0.11),
      art: new PlaneGeometry(s * 0.56, s * 0.56),
      emblem: new PlaneGeometry(s * 0.42, s * 0.42),
    }),
    [s, depth],
  );
  const mats = useMemo(() => {
    const art = emojiTexture(card.image);
    const star = emojiTexture(BACK_EMBLEM);
    return {
      body: new MeshStandardMaterial({ color: GAME_COLORS.cardBack, roughness: 0.55 }),
      // Faces are unlit so the card colours and the art stay true; the lit
      // body around them carries the 3D shading.
      back: new MeshBasicMaterial({ color: GAME_COLORS.cardBack }),
      front: new MeshBasicMaterial({ color: GAME_COLORS.cardFace }),
      art: new MeshBasicMaterial({ map: art, transparent: true }),
      emblem: new MeshBasicMaterial({ map: star, transparent: true }),
    };
  }, [card.image]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const g = group.current;
    const tn = turn.current;
    if (!g || !tn) return;
    const v = m.current;
    const front = card.isFlipped || card.isMatched;
    if (card.isMatched && !v.wasMatched) v.matchAt = t;
    // Turned back face-down without matching → that was a miss.
    if (v.wasFront && !front) v.missAt = t;
    v.wasFront = front;
    v.wasMatched = card.isMatched;

    const k = 1 - Math.exp(-dt / (TIMING.FLIP_DURATION / 1000 / 4));
    v.flip += ((front ? 1 : 0) - v.flip) * k;
    v.press += ((pressed ? 1 : 0) - v.press) * Math.min(1, dt * 20);
    // Lift while turning: highest half-way through the flip.
    const lift = Math.sin(Math.min(1, Math.max(0, v.flip)) * Math.PI) * s * 0.35;

    const [x, y] = map(rect);
    g.position.set(x, y, lift);
    tn.rotation.y = v.flip * Math.PI;
    tn.rotation.x = Math.sin(v.flip * Math.PI) * -0.15;

    let scale = 1 - v.press * 0.06;
    let rotZ = 0;
    const mt = t - v.matchAt;
    if (mt < 0.6) {
      // Matched: a happy bounce and wiggle.
      scale *= 1 + Math.sin((mt / 0.6) * Math.PI) * 0.14;
      rotZ = Math.sin(mt * 25) * 0.08 * (1 - mt / 0.6);
    }
    const ms = t - v.missAt;
    if (ms < 0.35) rotZ += Math.sin(ms * 45) * 0.06 * (1 - ms / 0.35);
    g.scale.setScalar(scale);
    g.rotation.z = rotZ;
    mats.front.color.set(card.isMatched ? GAME_COLORS.matched : GAME_COLORS.cardFace);
    mats.body.color.set(card.isMatched ? GAME_COLORS.matchedBorder : GAME_COLORS.cardBack);
  });

  const z = depth / 2 + 0.5;
  return (
    <group ref={group}>
      <group ref={turn}>
        <mesh geometry={geo.body} material={mats.body} />
        {/* Back (towards the camera at rest): green with a star emblem. */}
        <mesh geometry={geo.face} material={mats.back} position={[0, 0, z]} />
        <mesh geometry={geo.emblem} material={mats.emblem} position={[0, 0, z + 0.5]} />
        {/* Face (shown after half a turn): white card with the animal. */}
        <group rotation={[0, Math.PI, 0]}>
          <mesh geometry={geo.face} material={mats.front} position={[0, 0, z]} />
          <mesh geometry={geo.art} material={mats.art} position={[0, 0, z + 0.5]} />
        </group>
      </group>
    </group>
  );
}

export function GameBoard3D({ cards, onCardPress, disabled, columns }: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const landscape = screenW > screenH;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pressed, setPressed] = useState<string | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };
  const rects = useMemo(
    () => layoutCards(cards.length, columns, box.w, box.h, landscape),
    [cards.length, columns, box.w, box.h, landscape],
  );
  // Board pixels (top-left origin, y down) → scene units at a card's centre.
  const map = useMemo(
    () => (r: Rect): [number, number] => [r.x + r.size / 2 - box.w / 2, box.h / 2 - (r.y + r.size / 2)],
    [box.w, box.h],
  );

  return (
    <View style={styles.container} onLayout={onLayout}>
      {box.w > 0 && box.h > 0 ? (
        <>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Canvas flat gl={{ alpha: true }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
              <CameraRig height={box.h} />
              <hemisphereLight args={[0xffffff, 0xd8e6c8, 1.3]} />
              <directionalLight position={[-200, 400, 600]} intensity={1.4} />
              {cards.map((card, i) =>
                rects[i] ? (
                  <CardMesh key={card.id} card={card} rect={rects[i]} map={map} pressed={pressed === card.id} />
                ) : null,
              )}
            </Canvas>
          </View>
          {cards.map((card, i) => {
            const r = rects[i];
            if (!r) return null;
            const front = card.isFlipped || card.isMatched;
            return (
              <Pressable
                key={card.id}
                style={[styles.cell, { left: r.x, top: r.y, width: r.size, height: r.size }]}
                disabled={disabled || front}
                onPressIn={() => setPressed(card.id)}
                onPressOut={() => setPressed(null)}
                onPress={() => {
                  if (disabled || front) return;
                  onCardPress(card.id);
                }}
                accessibilityRole="button"
              />
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Pinned LTR: card rectangles are physical (left-origin) pixels.
  container: { flex: 1, direction: 'ltr' },
  cell: { position: 'absolute' },
});

