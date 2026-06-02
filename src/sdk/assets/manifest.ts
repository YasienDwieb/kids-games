import type { AssetEntry } from './types';

export const ASSETS = {
  'sfx.pop': {
    module: require('./audio/Blip1.wav'),
    type: 'audio',
    tags: ['pop', 'flip', 'tap', 'ui'],
  },
  'sfx.success': {
    module: require('./audio/Powerup3.wav'),
    type: 'audio',
    tags: ['success', 'match', 'reward'],
  },
  'sfx.win': {
    module: require('./audio/Laser-weapon1.wav'),
    type: 'audio',
    tags: ['win', 'celebration', 'complete'],
  },
  'sfx.wrong': {
    module: require('./audio/sfx-jump.wav'),
    type: 'audio',
    tags: ['wrong', 'mismatch', 'error'],
  },
} as const satisfies Record<string, AssetEntry>;

export type AssetId = keyof typeof ASSETS;
