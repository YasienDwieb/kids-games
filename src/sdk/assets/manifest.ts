import type { AssetEntry } from './types';

// Feedback sounds are soft CC0 clips from Kenney (see CREDITS.md;
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
  // A soft tonal bloop on a major-pentatonic note per pop, not a realistic bang
  // (noisy when repeated): a level fires many pops, and random notes from this
  // scale always sound consonant together. 2 dB under the other SFX.
  'sfx.balloon': {
    modules: [
      require('./audio/cc0/balloon_note1.wav'),
      require('./audio/cc0/balloon_note2.wav'),
      require('./audio/cc0/balloon_note3.wav'),
      require('./audio/cc0/balloon_note4.wav'),
      require('./audio/cc0/balloon_note5.wav'),
    ],
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
  // Per-game win jingles (Kenney Music Jingles): the four rising/happy melodies
  // (02, 06, 10, 15) on three instruments. A game picks one through its config's
  // `sounds: { 'sfx.win': 'jingle.<id>' }`, so every game has its own fanfare.
  // Selected by id only, never by intent — hence no tags.
  'jingle.pizzi-02': {
    modules: [require('./audio/cc0/jingles_PIZZI02.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.pizzi-06': {
    modules: [require('./audio/cc0/jingles_PIZZI06.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.pizzi-10': {
    modules: [require('./audio/cc0/jingles_PIZZI10.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.pizzi-15': {
    modules: [require('./audio/cc0/jingles_PIZZI15.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.steel-02': {
    modules: [require('./audio/cc0/jingles_STEEL02.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.steel-06': {
    modules: [require('./audio/cc0/jingles_STEEL06.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.steel-10': {
    modules: [require('./audio/cc0/jingles_STEEL10.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.steel-15': {
    modules: [require('./audio/cc0/jingles_STEEL15.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.sax-02': {
    modules: [require('./audio/cc0/jingles_SAX02.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.sax-06': {
    modules: [require('./audio/cc0/jingles_SAX06.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.sax-10': {
    modules: [require('./audio/cc0/jingles_SAX10.wav')],
    type: 'audio',
    tags: [],
  },
  'jingle.sax-15': {
    modules: [require('./audio/cc0/jingles_SAX15.wav')],
    type: 'audio',
    tags: [],
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
    modules: [require('./audio/animals/lion.m4a')],
    type: 'audio',
    tags: ['lion'],
  },
  'animal.elephant': {
    modules: [require('./audio/animals/elephant.m4a')],
    type: 'audio',
    tags: ['elephant'],
  },
  'animal.dog': {
    modules: [require('./audio/animals/dog.m4a')],
    type: 'audio',
    tags: ['dog'],
  },
  'animal.cat': {
    modules: [require('./audio/animals/cat.m4a')],
    type: 'audio',
    tags: ['cat'],
  },
  'animal.frog': {
    modules: [require('./audio/animals/frog.m4a')],
    type: 'audio',
    tags: ['frog'],
  },
  'animal.horse': {
    modules: [require('./audio/animals/horse.m4a')],
    type: 'audio',
    tags: ['horse'],
  },
  'animal.sheep': {
    modules: [require('./audio/animals/sheep.m4a')],
    type: 'audio',
    tags: ['sheep'],
  },
  'animal.rooster': {
    modules: [require('./audio/animals/rooster.m4a')],
    type: 'audio',
    tags: ['rooster'],
  },
  'animal.duck': {
    modules: [require('./audio/animals/duck.m4a')],
    type: 'audio',
    tags: ['duck'],
  },
  'animal.bird': {
    modules: [require('./audio/animals/bird.m4a')],
    type: 'audio',
    tags: ['bird'],
  },
  'animal.bee': {
    modules: [require('./audio/animals/bee.m4a')],
    type: 'audio',
    tags: ['bee'],
  },
} as const satisfies Record<string, AssetEntry>;

export type AssetId = keyof typeof ASSETS;
