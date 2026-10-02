import type { AssetEntry } from './types';

// Feedback sounds are soft CC0 clips from Kenney + OpenGameArt (see CREDITS.md;
// original file names kept under audio/cc0/).
// Each entry maps an intent-tag vocabulary to a kid-friendly sound. Most intents
// carry several interchangeable variants; useSound().play(<tag>) picks one at
// random so repeated taps/matches don't feel monotonous. See pickAsset/pickModule
// /findAssets in query.ts.
// Every clip is normalized to the same loudness (-25 dBFS active RMS, peak <= -6
// dBFS) so no intent jumps out over another; keep new clips at that level.
export const ASSETS = {
  'sfx.pop': {
    modules: [
      require('./audio/cc0/drop_002.wav'),
      require('./audio/cc0/drop_003.wav'),
      require('./audio/cc0/drop_004.wav'),
    ],
    type: 'audio',
    tags: ['pop', 'flip', 'tap', 'ui', 'select'],
  },
  'sfx.success': {
    modules: [
      require('./audio/cc0/confirmation_001.wav'),
      require('./audio/cc0/confirmation_004.wav'),
    ],
    type: 'audio',
    tags: ['success', 'match', 'reward', 'correct', 'collect'],
  },
  'sfx.win': {
    modules: [
      require('./audio/cc0/jingles_PIZZI10.wav'),
      require('./audio/cc0/jingles_STEEL10.wav'),
      require('./audio/cc0/jingles_PIZZI02.wav'),
    ],
    type: 'audio',
    tags: ['win', 'celebration', 'complete', 'levelup'],
  },
  'sfx.wrong': {
    modules: [
      require('./audio/cc0/error_007.wav'),
      require('./audio/cc0/error_008.wav'),
    ],
    type: 'audio',
    tags: ['wrong', 'mismatch', 'error', 'incorrect', 'lose'],
  },
  'sfx.powerup': {
    modules: [
      require('./audio/cc0/phaserUp1.wav'),
      require('./audio/cc0/phaserUp2.wav'),
      require('./audio/cc0/phaserUp3.wav'),
      require('./audio/cc0/phaserUp7.wav'),
    ],
    type: 'audio',
    tags: ['powerup', 'boost', 'upgrade'],
  },
  'sfx.transition': {
    modules: [
      require('./audio/cc0/jingles_PIZZI16.wav'),
      require('./audio/cc0/jingles_PIZZI04.wav'),
      require('./audio/cc0/jingles_PIZZI08.wav'),
    ],
    type: 'audio',
    tags: ['transition', 'teleport', 'whoosh', 'appear', 'next'],
  },
  'sfx.balloon': {
    modules: [require('./audio/cc0/balloon_pop.wav')],
    type: 'audio',
    tags: ['balloon'],
  },
  'sfx.hit': {
    modules: [
      require('./audio/cc0/impactGeneric_light_000.wav'),
      require('./audio/cc0/impactGeneric_light_002.wav'),
      require('./audio/cc0/impactGeneric_light_004.wav'),
    ],
    type: 'audio',
    tags: ['hit', 'bump', 'thud', 'hurt', 'damage'],
  },
  'sfx.engine': {
    modules: [require('./audio/EngineLoop.wav')],
    type: 'audio',
    tags: ['engine', 'motor', 'drive', 'road'],
  },
  // Real CC0/PD animal sounds (see audio/animals/CREDITS.md). One specific clip
  // each — played by id via useSound().play('animal.<id>') in Animal Safari's
  // 'whichSound' rounds. (Cow has no clip, so there is no 'animal.cow' entry.)
  'animal.lion': {
    modules: [require('./audio/animals/lion.ogg')],
    type: 'audio',
    tags: ['lion'],
  },
  'animal.elephant': {
    modules: [require('./audio/animals/elephant.ogg')],
    type: 'audio',
    tags: ['elephant'],
  },
  'animal.dog': {
    modules: [require('./audio/animals/dog.ogg')],
    type: 'audio',
    tags: ['dog'],
  },
  'animal.cat': {
    modules: [require('./audio/animals/cat.ogg')],
    type: 'audio',
    tags: ['cat'],
  },
  'animal.frog': {
    modules: [require('./audio/animals/frog.ogg')],
    type: 'audio',
    tags: ['frog'],
  },
  'animal.horse': {
    modules: [require('./audio/animals/horse.ogg')],
    type: 'audio',
    tags: ['horse'],
  },
  'animal.sheep': {
    modules: [require('./audio/animals/sheep.ogg')],
    type: 'audio',
    tags: ['sheep'],
  },
  'animal.rooster': {
    modules: [require('./audio/animals/rooster.ogg')],
    type: 'audio',
    tags: ['rooster'],
  },
  'animal.duck': {
    modules: [require('./audio/animals/duck.ogg')],
    type: 'audio',
    tags: ['duck'],
  },
  'animal.bird': {
    modules: [require('./audio/animals/bird.ogg')],
    type: 'audio',
    tags: ['bird'],
  },
  'animal.bee': {
    modules: [require('./audio/animals/bee.ogg')],
    type: 'audio',
    tags: ['bee'],
  },
} as const satisfies Record<string, AssetEntry>;

export type AssetId = keyof typeof ASSETS;
