// Animal Safari — the 3D model of each animal (Higgsfield SAM 3D clay toys,
// see /CREDITS.md), prepared with scripts/3d/prep_glb.py. Keyed by `Animal.id`.
import type { ModelSource } from '@/sdk';

export const ANIMAL_MODELS: Record<string, ModelSource> = {
  lion: { glb: require('./assets/models/lion.glb'), roughness: 0.95, rgba: require('./assets/models/lion.rgba') },
  elephant: { glb: require('./assets/models/elephant.glb'), roughness: 0.95, rgba: require('./assets/models/elephant.rgba') },
  cow: { glb: require('./assets/models/cow.glb'), roughness: 0.95, rgba: require('./assets/models/cow.rgba') },
  dog: { glb: require('./assets/models/dog.glb'), roughness: 0.95, rgba: require('./assets/models/dog.rgba') },
  cat: { glb: require('./assets/models/cat.glb'), roughness: 0.95, rgba: require('./assets/models/cat.rgba') },
  frog: { glb: require('./assets/models/frog.glb'), roughness: 0.95, rgba: require('./assets/models/frog.rgba') },
  horse: { glb: require('./assets/models/horse.glb'), roughness: 0.95, rgba: require('./assets/models/horse.rgba') },
  sheep: { glb: require('./assets/models/sheep.glb'), roughness: 0.95, rgba: require('./assets/models/sheep.rgba') },
  rooster: { glb: require('./assets/models/rooster.glb'), roughness: 0.95, rgba: require('./assets/models/rooster.rgba') },
  duck: { glb: require('./assets/models/duck.glb'), roughness: 0.95, rgba: require('./assets/models/duck.rgba') },
  bird: { glb: require('./assets/models/bird.glb'), roughness: 0.95, rgba: require('./assets/models/bird.rgba') },
  bee: { glb: require('./assets/models/bee.glb'), roughness: 0.95, rgba: require('./assets/models/bee.rgba') },
};
