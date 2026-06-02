import type { AssetEntry } from './types';

// Audio sourced from "Sound Effects Mini Pack 1.5" (8-bit / chiptune SFX).
// Each entry maps an intent-tag vocabulary to a kid-friendly sound. Games play
// these by intent via useSound().play(<tag>); see pickAsset/findAssets in query.ts.
export const ASSETS = {
  'sfx.pop': {
    module: require('./audio/Blip.wav'),
    type: 'audio',
    tags: ['pop', 'flip', 'tap', 'ui', 'select'],
  },
  'sfx.success': {
    module: require('./audio/Coin.wav'),
    type: 'audio',
    tags: ['success', 'match', 'reward', 'correct', 'collect'],
  },
  'sfx.win': {
    module: require('./audio/1up.wav'),
    type: 'audio',
    tags: ['win', 'celebration', 'complete', 'levelup'],
  },
  'sfx.wrong': {
    module: require('./audio/Lose.wav'),
    type: 'audio',
    tags: ['wrong', 'mismatch', 'error', 'incorrect', 'lose'],
  },
  'sfx.powerup': {
    module: require('./audio/Powerup.wav'),
    type: 'audio',
    tags: ['powerup', 'boost', 'upgrade'],
  },
  'sfx.jump': {
    module: require('./audio/Jump.wav'),
    type: 'audio',
    tags: ['jump', 'hop', 'bounce'],
  },
  'sfx.transition': {
    module: require('./audio/Teleport.wav'),
    type: 'audio',
    tags: ['transition', 'teleport', 'whoosh', 'appear', 'next'],
  },
} as const satisfies Record<string, AssetEntry>;

export type AssetId = keyof typeof ASSETS;
