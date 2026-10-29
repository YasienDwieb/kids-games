/**
 * Candy Catch in 3D — the renderer for <CatchField>'s pooled items and basket.
 * The field's reanimated loop still owns every position (it runs on the UI
 * thread); this scene only reads those shared values each frame and draws
 * them: glossy bevelled candy tiles with the treat's art on the face, tilting
 * as they tumble, and a Higgsfield wicker basket (see CREDITS.md) that leans
 * into its moves and bounces when it catches something.
 *
 * The camera maps the z = 0 plane 1:1 onto the field's pixels (top-left
 * origin, like the loop), so what you see is exactly what the loop collides.
 */
import { useMemo, useRef } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import {
  ExtrudeGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  Shape,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type PerspectiveCamera,
  type Texture,
} from 'three';
import type { SharedValue } from 'react-native-reanimated';
import { COLORS, getEmojiImage, useModel3D, type ModelSource } from '@/sdk';
import {
  BASKET_HEIGHT,
  BASKET_WIDTH,
  BOMB,
  CHILI,
  GOLD_ITEM,
  GOOD_ITEMS,
  ITEM_POOL,
  ITEM_SIZE,
  type ItemKind,
} from '../constants';

LogBox.ignoreLogs(['THREE.Clock']);

const FOV = 38;
const BASKET: ModelSource = {
  glb: require('../assets/models/basket.glb'),
  rgba: require('../assets/models/basket.rgba'),
  roughness: 0.8,
};

/** The loop's channels for one pooled item (see CatchField). */
export type SceneSlot = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rot: SharedValue<number>;
  alpha: SharedValue<number>;
  phase: SharedValue<number>;
};
export type SceneContent = { uid: number; emoji: string; kind: ItemKind } | null;

type Props = {
  width: number;
  height: number;
  slots: SceneSlot[];
  contents: SceneContent[];
  basketX: SharedValue<number>;
  basketTilt: SharedValue<number>;
  /** Clock time (ms, Date.now) of the last catch, for the basket's bounce. */
  caughtAt: React.RefObject<number>;
};

const TILE: Record<ItemKind, string> = {
  good: COLORS.surface,
  gold: COLORS.gold,
  bad: '#FFE1DC',
  bomb: '#FFE1DC',
};

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

/** A soft rounded-square candy tile, bevelled, centred on the origin. */
function tileGeometry(size: number): ExtrudeGeometry {
  const r = size * 0.3;
  const s = size / 2 - 3;
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
  const g = new ExtrudeGeometry(shape, {
    depth: size * 0.22,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 3,
    bevelSegments: 3,
    curveSegments: 8,
  });
  g.center();
  return g;
}

const textures = new Map<number, Texture>();
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

type ItemView = { group: Group | null; tile: MeshPhysicalMaterial; art: MeshBasicMaterial; uid: number };

function Items({
  slots,
  contents,
  toScene,
}: {
  slots: SceneSlot[];
  contents: SceneContent[];
  toScene: (x: number, y: number) => [number, number];
}) {
  const geo = useMemo(() => ({ tile: tileGeometry(ITEM_SIZE), art: new PlaneGeometry(ITEM_SIZE * 0.62, ITEM_SIZE * 0.62) }), []);
  const views = useMemo<ItemView[]>(
    () =>
      Array.from({ length: ITEM_POOL }, () => ({
        group: null,
        tile: new MeshPhysicalMaterial({
          roughness: 0.3,
          clearcoat: 1,
          clearcoatRoughness: 0.2,
          transparent: true,
          // Self-light keeps white tiles white under the shading.
          emissiveIntensity: 0.35,
        }),
        art: new MeshBasicMaterial({ transparent: true }),
        uid: -1,
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    views.forEach((v, i) => {
      const g = v.group;
      const c = contents[i];
      if (!g) return;
      const alpha = slots[i].alpha.value;
      g.visible = !!c && alpha > 0.01;
      if (!c || !g.visible) return;
      if (v.uid !== c.uid) {
        v.uid = c.uid;
        v.tile.color.set(TILE[c.kind]);
        v.tile.emissive.set(TILE[c.kind]);
        v.art.map = emojiTexture(c.emoji);
        v.art.needsUpdate = true;
      }
      // The loop's x/y is the tile's top-left corner.
      const [x, y] = toScene(slots[i].x.value + ITEM_SIZE / 2, slots[i].y.value + ITEM_SIZE / 2);
      g.position.set(x, y, 0);
      const phase = slots[i].phase.value;
      g.rotation.set(Math.sin(t * 1.7 + phase) * 0.35, Math.sin(t * 2.1 + phase) * 0.5, (-slots[i].rot.value * Math.PI) / 180);
      // Caught / missed: shrink away as the loop fades it out.
      g.scale.setScalar(0.6 + 0.4 * alpha);
      v.tile.opacity = alpha;
      v.art.opacity = alpha;
    });
  });

  // Load every treat's art up front, so a tile never shows a blank face.
  useMemo(() => [...GOOD_ITEMS.map((g) => g.emoji), GOLD_ITEM.emoji, CHILI.emoji, BOMB.emoji].forEach(emojiTexture), []);

  const z = ITEM_SIZE * 0.11 + 3.5;
  return (
    <>
      {views.map((v, i) => (
        <group
          key={i}
          visible={false}
          ref={(g) => {
            v.group = g;
          }}
        >
          <mesh geometry={geo.tile} material={v.tile} />
          <mesh geometry={geo.art} material={v.art} position={[0, 0, z]} />
        </group>
      ))}
    </>
  );
}

function Basket3D({
  basketX,
  basketTilt,
  caughtAt,
  toScene,
  height,
}: {
  basketX: SharedValue<number>;
  basketTilt: SharedValue<number>;
  caughtAt: React.RefObject<number>;
  toScene: (x: number, y: number) => [number, number];
  height: number;
}) {
  const obj = useModel3D(BASKET, BASKET_WIDTH * 0.95);
  const g = useRef<Group>(null);
  useFrame(() => {
    const b = g.current;
    if (!b) return;
    // Bottom-centre of the basket box the loop catches with (4 px off the floor).
    const [x, y] = toScene(basketX.value + BASKET_WIDTH / 2, height - 4);
    b.position.set(x, y, -BASKET_WIDTH * 0.25);
    b.rotation.z = (-basketTilt.value * Math.PI) / 180;
    b.rotation.y = (basketTilt.value * Math.PI) / 180;
    // Catch: a quick squash and spring.
    const since = (Date.now() - (caughtAt.current ?? 0)) / 1000;
    const k = since < 0.35 ? Math.sin((since / 0.35) * Math.PI) * (1 - since / 0.35) : 0;
    b.scale.set(1 + k * 0.12, 1 - k * 0.14, 1 + k * 0.12);
  });
  return (
    <group ref={g}>
      {/* Tipped toward the camera so the open top shows. */}
      {obj ? (
        <group rotation={[0.32, 0.5, 0]}>
          <primitive object={obj} />
        </group>
      ) : (
        <mesh position={[0, BASKET_HEIGHT * 0.35, 0]}>
          <cylinderGeometry args={[BASKET_WIDTH / 2, BASKET_WIDTH * 0.4, BASKET_HEIGHT * 0.7, 20]} />
          <meshStandardMaterial color="#D89A5B" />
        </mesh>
      )}
    </group>
  );
}

export function CatchScene3D({ width, height, slots, contents, basketX, basketTilt, caughtAt }: Props) {
  const toScene = useMemo(
    () =>
      (x: number, y: number): [number, number] => [x - width / 2, height / 2 - y],
    [width, height],
  );
  if (width <= 0 || height <= 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas flat gl={{ alpha: true }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
        <CameraRig height={height} />
        <hemisphereLight args={[0xffffff, 0xffd9e6, 1.3]} />
        <directionalLight position={[-200, 500, 600]} intensity={1.5} />
        <Basket3D basketX={basketX} basketTilt={basketTilt} caughtAt={caughtAt} toScene={toScene} height={height} />
        <Items slots={slots} contents={contents} toScene={toScene} />
      </Canvas>
    </View>
  );
}
