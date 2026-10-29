/**
 * Shared 3D model loading for games (react-three-fiber + expo-gl).
 *
 * React Native has no DOM Image, so three's GLTFLoader can't decode textures
 * embedded in a GLB. Models are prepared offline (`scripts/3d/prep_glb.py`):
 * the GLB keeps geometry + UVs, and its base-colour texture ships beside it as
 * raw RGBA8 bytes (`.rgba`, square, power of two) uploaded as a DataTexture.
 * Models without a texture (Kenney kits with baked vertex colours) pass only
 * `glb`.
 *
 *   const MOUSE = { glb: require('./mouse.glb'), rgba: require('./mouse.rgba') };
 *   const obj = useModel3D(MOUSE, 0.8);            // null while loading
 *   return obj ? <primitive object={obj} /> : <Fallback />;
 *
 * Each file loads once and is cached; every use gets a clone normalised to a
 * target size, standing on y = 0 and centred on x/z.
 */
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import {
  Box3,
  DataTexture,
  LinearMipmapLinearFilter,
  Color,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RGBAFormat,
  SkinnedMesh,
  SRGBColorSpace,
  Vector3,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

/**
 * A bundled model: the GLB module and, for textured models, its `.rgba`
 * texture. `sheen` (0..1) adds a soft velvet rim for fur and feathers.
 */
export type ModelSource = { glb: number; rgba?: number; roughness?: number; sheen?: number };

// GLTFLoader decodes the GLB's JSON chunk with TextDecoder; provide a small
// UTF-8 fallback in case the JS engine lacks one.
if (typeof globalThis.TextDecoder === 'undefined') {
  class Utf8Decoder {
    decode(input?: ArrayBufferView | ArrayBuffer): string {
      if (!input) return '';
      const bytes =
        input instanceof ArrayBuffer
          ? new Uint8Array(input)
          : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      let out = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return decodeURIComponent(escape(out));
    }
  }
  (globalThis as { TextDecoder?: unknown }).TextDecoder = Utf8Decoder;
}

async function bytesOf(module: number): Promise<ArrayBuffer> {
  const asset = await Asset.fromModule(module).downloadAsync();
  return new File(asset.localUri ?? asset.uri).arrayBuffer();
}

async function textureOf(module: number): Promise<DataTexture> {
  const data = new Uint8Array(await bytesOf(module));
  const side = Math.round(Math.sqrt(data.length / 4));
  const tex = new DataTexture(data, side, side, RGBAFormat);
  tex.colorSpace = SRGBColorSpace;
  tex.flipY = false; // rows are already in glTF (top-down) order
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const cache = new Map<number, Promise<Object3D>>();

function load(src: ModelSource): Promise<Object3D> {
  let p = cache.get(src.glb);
  if (!p) {
    p = (async () => {
      const [buffer, map] = await Promise.all([
        bytesOf(src.glb),
        src.rgba != null ? textureOf(src.rgba) : Promise.resolve(null),
      ]);
      const gltf = await new GLTFLoader().parseAsync(buffer, '');
      if (map) {
        const material = src.sheen
          ? new MeshPhysicalMaterial({
              map,
              roughness: src.roughness ?? 0.85,
              metalness: 0,
              sheen: src.sheen,
              sheenRoughness: 0.6,
              sheenColor: new Color(1, 1, 1),
            })
          : new MeshStandardMaterial({ map, roughness: src.roughness ?? 0.75, metalness: 0 });
        gltf.scene.traverse((o) => {
          if (o instanceof Mesh) o.material = material;
        });
      }
      return gltf.scene;
    })();
    cache.set(src.glb, p);
    p.catch(() => cache.delete(src.glb)); // allow a retry after a failed load
  }
  return p;
}

/** Start loading models early so they pop in together. */
export function preloadModels3D(sources: readonly ModelSource[]): void {
  sources.forEach((s) => void load(s).catch(() => {}));
}

/**
 * A fresh, size-normalised copy of a model, or null while it loads (or if it
 * failed — keep a primitive fallback). `size` is the longest horizontal side
 * (`fit: 'length'`), the height (`fit: 'height'`) or the largest side
 * (`fit: 'max'`, so tall and wide things fit the same box), in scene units.
 */
export function useModel3D(
  src: ModelSource,
  size: number,
  fit: 'length' | 'height' | 'max' = 'length',
): Object3D | null {
  const [obj, setObj] = useState<Object3D | null>(null);
  useEffect(() => {
    let alive = true;
    load(src)
      .then((scene) => {
        if (!alive) return;
        // SkeletonUtils' clone rebinds skinned meshes to the copy's own bones.
        const copy = cloneSkinned(scene);
        // Skinned bounds need the bone matrices, which normally update at render.
        copy.updateMatrixWorld(true);
        copy.traverse((o) => {
          if (o instanceof SkinnedMesh) o.skeleton.update();
        });
        const box = new Box3().setFromObject(copy, true);
        const dims = box.getSize(new Vector3());
        const extent =
          fit === 'height' ? dims.y : fit === 'max' ? Math.max(dims.x, dims.y, dims.z) : Math.max(dims.x, dims.z);
        const s = size / Math.max(extent, 1e-6);
        copy.scale.setScalar(s);
        const centre = box.getCenter(new Vector3());
        copy.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
        setObj(copy);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src, size, fit]);
  return obj;
}
