import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { i18n } from '@/sdk/i18n';
import { pickAsset } from '@/sdk/assets/query';
import { LULU_TAP_LINES } from '@/sdk/mascot/Lulu3D';
import { voiceBusyRemaining } from '@/sdk/speech/voiceGate';
import { CelebrationProvider, PRAISE_COUNT, useCelebrate, type Celebrate } from '../Celebration';

function Grab({ onReady }: { onReady: (c: Celebrate) => void }) {
  onReady(useCelebrate());
  return <Text>game</Text>;
}

it('is a resolved no-op without a provider', async () => {
  let celebrate!: Celebrate;
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<Grab onReady={(c) => (celebrate = c)} />);
  });
  await expect(celebrate('big')).resolves.toBeUndefined();
  act(() => tree.unmount());
});

it('renders a burst over the game and resolves once it finishes', async () => {
  jest.useFakeTimers();
  let celebrate!: Celebrate;
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <CelebrationProvider>
        <Grab onReady={(c) => (celebrate = c)} />
      </CelebrationProvider>,
    );
  });

  let done = false;
  act(() => {
    void celebrate('small').then(() => {
      done = true;
    });
  });
  // The game stays mounted underneath the burst.
  const texts = tree.root.findAllByType(Text) as { props: { children?: unknown } }[];
  expect(texts.some((node) => node.props.children === 'game')).toBe(true);

  // The burst ends at ~1.15s, but the game waits for the praise voice too.
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(done).toBe(false);
  // Step frame-ish: Animated chains its sequence steps across ticks.
  for (let t = 0; t < 4000 && !done; t += 100) {
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
  }
  expect(done).toBe(true);

  act(() => tree.unmount());
  jest.useRealTimers();
});

it('holds the voice while praise plays, and stays silent with praise: false', async () => {
  jest.useFakeTimers();
  // The gate is module state — step past any hold an earlier test left behind.
  jest.setSystemTime(Date.now() + 60_000);
  let celebrate!: Celebrate;
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <CelebrationProvider>
        <Grab onReady={(c) => (celebrate = c)} />
      </CelebrationProvider>,
    );
  });

  act(() => {
    void celebrate('big', { praise: false });
  });
  expect(voiceBusyRemaining()).toBe(0);

  act(() => {
    void celebrate('small');
  });
  expect(voiceBusyRemaining()).toBeGreaterThan(1000);

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(voiceBusyRemaining()).toBe(0);

  act(() => tree.unmount());
  jest.useRealTimers();
});

it('has every praise line in both languages', () => {
  for (const lng of ['en', 'ar']) {
    for (let n = 1; n <= PRAISE_COUNT; n++) {
      const key = `celebrate.praise.${n}`;
      expect(i18n.t(key, { lng })).not.toBe(key);
    }
  }
});

it('has a recorded voice clip for every praise line in both languages', () => {
  for (const lang of ['en', 'ar']) {
    for (let n = 1; n <= PRAISE_COUNT; n++) {
      expect(pickAsset(`praise.${lang}.${n}`)).toBe(`voice.praise.${lang}.${n}`);
    }
  }
});

it('has a recorded line for every buddy tap reaction in both languages', () => {
  for (const buddy of ['lulu', 'zain']) {
    for (const lang of ['en', 'ar']) {
      for (let n = 1; n <= LULU_TAP_LINES; n++) {
        expect(pickAsset(`${buddy}.tap.${lang}.${n}`)).toBe(`voice.${buddy}.${lang}.${n}`);
      }
    }
  }
});
