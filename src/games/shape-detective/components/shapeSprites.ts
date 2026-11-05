/**
 * Shape Detective — the pre-rendered 3D shape sprites, one per kind and palette
 * colour (clay-toy shapes rendered in Blender by scripts/3d/render_shapes.py).
 * Keyed by kind, then by the colour token from SHAPE_COLORS.
 */
import type { ImageSourcePropType } from 'react-native';
import { ACCENTS } from '@/sdk';
import type { ShapeKind } from '../types';

export const SHAPE_SPRITES: Record<ShapeKind, Record<string, ImageSourcePropType>> = {
  circle: {
    [ACCENTS.purple.base]: require('../assets/shapes/circle-purple.png'),
    [ACCENTS.blue.base]: require('../assets/shapes/circle-blue.png'),
    [ACCENTS.green.base]: require('../assets/shapes/circle-green.png'),
    [ACCENTS.coral.base]: require('../assets/shapes/circle-coral.png'),
    [ACCENTS.orange.base]: require('../assets/shapes/circle-orange.png'),
    [ACCENTS.pink.base]: require('../assets/shapes/circle-pink.png'),
    [ACCENTS.purple.deep]: require('../assets/shapes/circle-purpleDeep.png'),
    [ACCENTS.blue.deep]: require('../assets/shapes/circle-blueDeep.png'),
  },
  square: {
    [ACCENTS.purple.base]: require('../assets/shapes/square-purple.png'),
    [ACCENTS.blue.base]: require('../assets/shapes/square-blue.png'),
    [ACCENTS.green.base]: require('../assets/shapes/square-green.png'),
    [ACCENTS.coral.base]: require('../assets/shapes/square-coral.png'),
    [ACCENTS.orange.base]: require('../assets/shapes/square-orange.png'),
    [ACCENTS.pink.base]: require('../assets/shapes/square-pink.png'),
    [ACCENTS.purple.deep]: require('../assets/shapes/square-purpleDeep.png'),
    [ACCENTS.blue.deep]: require('../assets/shapes/square-blueDeep.png'),
  },
  triangle: {
    [ACCENTS.purple.base]: require('../assets/shapes/triangle-purple.png'),
    [ACCENTS.blue.base]: require('../assets/shapes/triangle-blue.png'),
    [ACCENTS.green.base]: require('../assets/shapes/triangle-green.png'),
    [ACCENTS.coral.base]: require('../assets/shapes/triangle-coral.png'),
    [ACCENTS.orange.base]: require('../assets/shapes/triangle-orange.png'),
    [ACCENTS.pink.base]: require('../assets/shapes/triangle-pink.png'),
    [ACCENTS.purple.deep]: require('../assets/shapes/triangle-purpleDeep.png'),
    [ACCENTS.blue.deep]: require('../assets/shapes/triangle-blueDeep.png'),
  },
  star: {
    [ACCENTS.purple.base]: require('../assets/shapes/star-purple.png'),
    [ACCENTS.blue.base]: require('../assets/shapes/star-blue.png'),
    [ACCENTS.green.base]: require('../assets/shapes/star-green.png'),
    [ACCENTS.coral.base]: require('../assets/shapes/star-coral.png'),
    [ACCENTS.orange.base]: require('../assets/shapes/star-orange.png'),
    [ACCENTS.pink.base]: require('../assets/shapes/star-pink.png'),
    [ACCENTS.purple.deep]: require('../assets/shapes/star-purpleDeep.png'),
    [ACCENTS.blue.deep]: require('../assets/shapes/star-blueDeep.png'),
  },
  heart: {
    [ACCENTS.purple.base]: require('../assets/shapes/heart-purple.png'),
    [ACCENTS.blue.base]: require('../assets/shapes/heart-blue.png'),
    [ACCENTS.green.base]: require('../assets/shapes/heart-green.png'),
    [ACCENTS.coral.base]: require('../assets/shapes/heart-coral.png'),
    [ACCENTS.orange.base]: require('../assets/shapes/heart-orange.png'),
    [ACCENTS.pink.base]: require('../assets/shapes/heart-pink.png'),
    [ACCENTS.purple.deep]: require('../assets/shapes/heart-purpleDeep.png'),
    [ACCENTS.blue.deep]: require('../assets/shapes/heart-blueDeep.png'),
  },
  diamond: {
    [ACCENTS.purple.base]: require('../assets/shapes/diamond-purple.png'),
    [ACCENTS.blue.base]: require('../assets/shapes/diamond-blue.png'),
    [ACCENTS.green.base]: require('../assets/shapes/diamond-green.png'),
    [ACCENTS.coral.base]: require('../assets/shapes/diamond-coral.png'),
    [ACCENTS.orange.base]: require('../assets/shapes/diamond-orange.png'),
    [ACCENTS.pink.base]: require('../assets/shapes/diamond-pink.png'),
    [ACCENTS.purple.deep]: require('../assets/shapes/diamond-purpleDeep.png'),
    [ACCENTS.blue.deep]: require('../assets/shapes/diamond-blueDeep.png'),
  },
};
