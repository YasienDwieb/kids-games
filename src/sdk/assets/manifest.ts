import type { AssetEntry } from './types';

// Audio sourced from "Sound Effects Mini Pack 1.5" (8-bit / chiptune SFX).
// Each entry maps an intent-tag vocabulary to a kid-friendly sound. Most intents
// carry several interchangeable variants; useSound().play(<tag>) picks one at
// random so repeated taps/matches don't feel monotonous. See pickAsset/pickModule
// /findAssets in query.ts.
export const ASSETS = {
  'sfx.pop': {
    modules: [
      require('./audio/Blip.wav'),
      require('./audio/Blip1.wav'),
      require('./audio/Blip2.wav'),
      require('./audio/Blip3.wav'),
      require('./audio/Blip4.wav'),
    ],
    type: 'audio',
    tags: ['pop', 'flip', 'tap', 'ui', 'select'],
  },
  'sfx.success': {
    modules: [
      require('./audio/Coin.wav'),
      require('./audio/Coin1.wav'),
      require('./audio/Coin2.wav'),
      require('./audio/Coin3.wav'),
      require('./audio/Coin4.wav'),
    ],
    type: 'audio',
    tags: ['success', 'match', 'reward', 'correct', 'collect'],
  },
  'sfx.win': {
    modules: [
      require('./audio/1up.wav'),
      require('./audio/1up1.wav'),
      require('./audio/1up2.wav'),
      require('./audio/1up3.wav'),
      require('./audio/1up4.wav'),
    ],
    type: 'audio',
    tags: ['win', 'celebration', 'complete', 'levelup'],
  },
  'sfx.wrong': {
    modules: [
      require('./audio/Lose.wav'),
      require('./audio/Lose1.wav'),
      require('./audio/Lose2.wav'),
      require('./audio/Lose3.wav'),
      require('./audio/Lose4.wav'),
    ],
    type: 'audio',
    tags: ['wrong', 'mismatch', 'error', 'incorrect', 'lose'],
  },
  'sfx.powerup': {
    modules: [
      require('./audio/Powerup.wav'),
      require('./audio/Powerup1.wav'),
      require('./audio/Powerup2.wav'),
      require('./audio/Powerup3.wav'),
      require('./audio/Powerup4.wav'),
    ],
    type: 'audio',
    tags: ['powerup', 'boost', 'upgrade'],
  },
  'sfx.jump': {
    modules: [
      require('./audio/Jump.wav'),
      require('./audio/Jump1.wav'),
      require('./audio/Jump2.wav'),
      require('./audio/Jump3.wav'),
      require('./audio/Jump4.wav'),
    ],
    type: 'audio',
    tags: ['jump', 'hop', 'bounce'],
  },
  'sfx.transition': {
    modules: [
      require('./audio/Teleport.wav'),
      require('./audio/Teleport1.wav'),
      require('./audio/Teleport2.wav'),
      require('./audio/Teleport3.wav'),
      require('./audio/Teleport4.wav'),
    ],
    type: 'audio',
    tags: ['transition', 'teleport', 'whoosh', 'appear', 'next'],
  },
  'sfx.explosion': {
    modules: [
      require('./audio/Explosion.wav'),
      require('./audio/Explosion1.wav'),
      require('./audio/Explosion2.wav'),
      require('./audio/Explosion3.wav'),
      require('./audio/Explosion4.wav'),
    ],
    type: 'audio',
    tags: ['explosion', 'blast', 'boom', 'destroy', 'pop-big'],
  },
  'sfx.hit': {
    modules: [
      require('./audio/Hit.wav'),
      require('./audio/Hit1.wav'),
      require('./audio/Hit2.wav'),
      require('./audio/Hit3.wav'),
      require('./audio/Hit4.wav'),
    ],
    type: 'audio',
    tags: ['hit', 'bump', 'thud', 'hurt', 'damage'],
  },
  'sfx.laser': {
    modules: [
      require('./audio/Laser-weapon.wav'),
      require('./audio/Laser-weapon1.wav'),
      require('./audio/Laser-weapon2.wav'),
      require('./audio/Laser-weapon3.wav'),
      require('./audio/Laser-weapon4.wav'),
    ],
    type: 'audio',
    tags: ['laser', 'shoot', 'zap', 'fire', 'beam'],
  },
  'sfx.random': {
    modules: [
      require('./audio/Random.wav'),
      require('./audio/Random1.wav'),
      require('./audio/Random2.wav'),
      require('./audio/Random3.wav'),
      require('./audio/Random4.wav'),
    ],
    type: 'audio',
    tags: ['random', 'misc', 'surprise', 'blip-alt'],
  },
} as const satisfies Record<string, AssetEntry>;

export type AssetId = keyof typeof ASSETS;
