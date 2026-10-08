/**
 * Low-poly 3D models for the 3D road (Kenney Car Kit / Racing Kit, CC0 — see
 * CREDITS.md). The car models' palette texture was baked into vertex colors
 * offline, so loading needs no image decoding (React Native has no DOM Image).
 *
 * Loaded once per file via expo-asset + expo-file-system and parsed with
 * three's GLTFLoader; each use gets a clone, normalised to a target size,
 * standing on y = 0 and centred on x/z.
 */
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Box3, Vector3, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { CarId } from '../types';

export const MODELS = {
  race: require('../assets/models/race.glb'),
  hatchback: require('../assets/models/hatchback-sports.glb'),
  suv: require('../assets/models/suv.glb'),
  taxi: require('../assets/models/taxi.glb'),
  police: require('../assets/models/police.glb'),
  truck: require('../assets/models/truck.glb'),
  tractor: require('../assets/models/tractor.glb'),
  raceFuture: require('../assets/models/race-future.glb'),
  sedan: require('../assets/models/sedan.glb'),
  sedanSports: require('../assets/models/sedan-sports.glb'),
  delivery: require('../assets/models/delivery.glb'),
  cone: require('../assets/models/cone.glb'),
  treeLarge: require('../assets/models/treeLarge.glb'),
  treeSmall: require('../assets/models/treeSmall.glb'),
  finishArch: require('../assets/models/overheadRoundColored.glb'),
} as const;

export type ModelName = keyof typeof MODELS;

/** Garage car → model. The motorbike has no model, so it gets the future racer. */
export const CAR_MODEL: Record<CarId, ModelName> = {
  turbo: 'race',
  zippy: 'hatchback',
  buggy: 'suv',
  taxi: 'taxi',
  patrol: 'police',
  truck: 'truck',
  tractor: 'tractor',
  moto: 'raceFuture',
};

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

const cache = new Map<ModelName, Promise<Object3D>>();

function load(name: ModelName): Promise<Object3D> {
  let p = cache.get(name);
  if (!p) {
    p = (async () => {
      const asset = await Asset.fromModule(MODELS[name]).downloadAsync();
      const buffer = await new File(asset.localUri ?? asset.uri).arrayBuffer();
      const gltf = await new GLTFLoader().parseAsync(buffer, '');
      return gltf.scene;
    })();
    cache.set(name, p);
    p.catch(() => cache.delete(name)); // allow a retry after a failed load
  }
  return p;
}

/** Start loading models ahead of the race so they pop in together. */
export function preloadModels(names: readonly ModelName[]): void {
  names.forEach((n) => void load(n));
}

/**
 * A fresh, size-normalised copy of a model, or null while it loads. `size` is
 * in metres: the longest horizontal side (`fit: 'length'`, for vehicles and
 * props) or the height (`fit: 'height'`, for tall things like trees).
 */
export function useModel(
  name: ModelName,
  size: number,
  fit: 'length' | 'height' = 'length',
): Object3D | null {
  const [obj, setObj] = useState<Object3D | null>(null);
  useEffect(() => {
    let alive = true;
    load(name)
      .then((scene) => {
        if (!alive) return;
        const copy = scene.clone(true);
        const box = new Box3().setFromObject(copy);
        const dims = box.getSize(new Vector3());
        const s = size / Math.max(fit === 'height' ? dims.y : Math.max(dims.x, dims.z), 1e-6);
        copy.scale.setScalar(s);
        const centre = box.getCenter(new Vector3());
        copy.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
        setObj(copy);
      })
      .catch(() => {}); // no model → the caller's primitive fallback stays
    return () => {
      alive = false;
    };
  }, [name, size, fit]);
  return obj;
}
