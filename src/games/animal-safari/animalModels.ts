// Animal Safari — the 3D model of each animal (Higgsfield SAM 3D clay toys,
// see /CREDITS.md), prepared with scripts/3d/prep_glb.py. Keyed by `Animal.id`.
import type { ModelSource } from '@/sdk';

export const ANIMAL_MODELS: Record<string, ModelSource> = {
  lion: { glb: require('./assets/models/lion.glb'), roughness: 0.95, rgba: require('./assets/models/lion_tex.rgba') },
  elephant: { glb: require('./assets/models/elephant.glb'), roughness: 0.95, rgba: require('./assets/models/elephant_tex.rgba') },
  cow: { glb: require('./assets/models/cow.glb'), roughness: 0.95, rgba: require('./assets/models/cow_tex.rgba') },
  dog: { glb: require('./assets/models/dog.glb'), roughness: 0.95, rgba: require('./assets/models/dog_tex.rgba') },
  cat: { glb: require('./assets/models/cat.glb'), roughness: 0.95, rgba: require('./assets/models/cat_tex.rgba') },
  frog: { glb: require('./assets/models/frog.glb'), roughness: 0.95, rgba: require('./assets/models/frog_tex.rgba') },
  horse: { glb: require('./assets/models/horse.glb'), roughness: 0.95, rgba: require('./assets/models/horse_tex.rgba') },
  sheep: { glb: require('./assets/models/sheep.glb'), roughness: 0.95, rgba: require('./assets/models/sheep_tex.rgba') },
  rooster: { glb: require('./assets/models/rooster.glb'), roughness: 0.95, rgba: require('./assets/models/rooster_tex.rgba') },
  duck: { glb: require('./assets/models/duck.glb'), roughness: 0.95, rgba: require('./assets/models/duck_tex.rgba') },
  bird: { glb: require('./assets/models/bird.glb'), roughness: 0.95, rgba: require('./assets/models/bird_tex.rgba') },
  bee: { glb: require('./assets/models/bee.glb'), roughness: 0.95, rgba: require('./assets/models/bee_tex.rgba') },
};
