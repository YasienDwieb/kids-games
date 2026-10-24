import '@/games'; // side-effect: registers every game's translations
import { voiceCatalog } from '@/games/voiceCatalog';
import { clipKey } from '@/sdk/speech/clipKey';
import { CLIPS } from '@/sdk/speech/clips.generated';

// A locale edit changes the spoken text and with it the clip key; without this
// guard the game would quietly fall back to the device voice. Fix a failure with
// `npm run voice:catalog && npm run voice:generate` (docs/VOICE.md).
const live = voiceCatalog().map((l) => clipKey(l.lang, l.text));

it('every spoken phrase has a bundled clip', () => {
  expect(live.filter((k) => !(k in CLIPS))).toEqual([]);
});

it('no orphan clips', () => {
  const set = new Set(live);
  expect(Object.keys(CLIPS).filter((k) => !set.has(k))).toEqual([]);
});
