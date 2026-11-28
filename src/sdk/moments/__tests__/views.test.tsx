import { act, create } from 'react-test-renderer';
import { AyahView } from '../components/AyahView';
import { HowToView } from '../components/HowToView';
import type { AyahMoment, HowToMoment } from '../types';

// One fake player per test; `finish()` fires the recitation's end.
let listeners: ((s: any) => void)[] = [];
const mockPlayer = {
  addListener: (_: string, cb: (s: any) => void) => listeners.push(cb),
  play: jest.fn(),
  seekTo: jest.fn(),
};
jest.mock('expo-audio', () => ({ createAudioPlayer: () => mockPlayer }));
jest.mock('@/sdk/audio/releasePlayer', () => ({ releasePlayer: jest.fn() }));
const mockPlaySound = jest.fn();
jest.mock('@/sdk/audio/useSound', () => ({ useSound: () => ({ play: mockPlaySound }) }));
const mockSpeak = jest.fn(() => Promise.resolve());
jest.mock('@/sdk/speech/useSpeech', () => ({ useSpeech: () => ({ speak: mockSpeak, stop: jest.fn() }), stopSpeech: jest.fn() }));
jest.mock('@/sdk/feedback/useHintLadder', () => {
  let misses = 0;
  return {
    useHintLadder: () => ({
      misses,
      firstTry: misses === 0,
      miss: () => {
        misses += 1;
        return misses === 1 ? 'retry' : misses === 2 ? 'highlight' : 'reveal';
      },
    }),
  };
});

const finish = () => act(() => listeners.forEach((cb) => cb({ didJustFinish: true })));
const mounted: any[] = [];
afterEach(() => {
  act(() => mounted.splice(0).forEach((t) => t.unmount()));
  listeners = [];
  jest.clearAllMocks();
});
const render = (el: React.ReactElement) => {
  let tree: any;
  act(() => {
    tree = create(el);
  });
  mounted.push(tree);
  return tree;
};
const doneButtons = (tree: any) => tree.root.findAll((n: any) => n.props.accessibilityLabel === 'moments.done' && n.props.onPress);

const ayah: AyahMoment = {
  id: 'a1', type: 'ayah', surah: 112, ayahs: [1, 4], textAr: 'قل هو الله أحد', meaningKey: 'a1', image: 1, audio: 2,
  recitation: { reciter: 'R', origin: 'O', permission: 'P' }, reviewedBy: 'X', reviewedOn: '2027-01-01',
};

describe('AyahView', () => {
  // protects=the child can't skip the recitation: the check button appears only after it ends; fails_when=the button shows before didJustFinish or never after; no_claim=expo-audio is mocked, so real playback end events are not exercised
  it('shows the check button only after the recitation ends', () => {
    const onDone = jest.fn();
    const tree = render(<AyahView moment={ayah} onDone={onDone} size={200} />);
    expect(mockPlayer.play).toHaveBeenCalled();
    expect(doneButtons(tree)).toHaveLength(0);
    finish();
    const [button] = doneButtons(tree);
    act(() => button.props.onPress());
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  // protects=no effect sound plays over the Quran; fails_when=the ayah view plays any sound effect; no_claim=celebration timing is MomentUnit's (it waits for onDone)
  it('plays no sound effects', () => {
    render(<AyahView moment={ayah} onDone={jest.fn()} size={200} />);
    finish();
    expect(mockPlaySound).not.toHaveBeenCalled();
  });
});

describe('HowToView', () => {
  const steps = [1, 2, 3, 4].map((n) => ({ image: n, phraseKey: `s${n}` }));
  const wudu: HowToMoment = {
    id: 'w', type: 'howto', topic: 'wudu', image: 9, source: { book: 'B', number: '1' }, steps, reviewedBy: 'X', reviewedOn: '2027-01-01',
  };
  const tap = (tree: any, id: string) => {
    const [btn] = tree.root.findAll((n: any) => n.props.testID === id && n.props.onPress);
    act(() => btn.props.onPress());
  };

  // protects=placing all steps in order finishes the unit once, with the miss count; fails_when=onDone fires early, twice, or with the wrong misses; no_claim=sound and speech are mocked
  it('finishes after the last correct step and reports misses', () => {
    const onDone = jest.fn();
    const tree = render(<HowToView moment={wudu} before={[]} steps={steps.slice(0, 3)} onDone={onDone} size={300} />);
    tap(tree, 'howto-wrong');
    tap(tree, 'howto-correct');
    tap(tree, 'howto-correct');
    expect(onDone).not.toHaveBeenCalled();
    tap(tree, 'howto-correct');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(1);
    expect(mockSpeak).toHaveBeenCalledWith('moments:s1');
  });

  // protects=from the 2nd miss the right picture is highlighted; fails_when=no choice is highlighted after two misses; no_claim=the hint ladder itself is mocked here (it has its own tests)
  it('highlights the answer after the second miss', () => {
    const tree = render(<HowToView moment={wudu} before={[]} steps={steps.slice(0, 3)} onDone={jest.fn()} size={300} />);
    tap(tree, 'howto-wrong');
    tap(tree, 'howto-wrong');
    const pulses = tree.root.findAll((n: any) => n.props.active === true && 'active' in n.props);
    expect(pulses.length).toBeGreaterThan(0);
  });
});
