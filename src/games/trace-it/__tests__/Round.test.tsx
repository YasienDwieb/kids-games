import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import '@/games/_shared/letters/i18n';
import '../i18n';
import { charsFor } from '../catalog';
import { MascotHelper } from '@/sdk';
import { DONE_HOLD_MS, Round } from '../components/Round';
import { TraceBoard } from '../components/TraceBoard';
import { WinSticker } from '../components/WinSticker';
import { progressStore } from '../progress';

// Celebrations resolve at once unless a test holds one open.
const mockCelebrate = jest.fn((..._args: unknown[]) => Promise.resolve());
jest.mock('@/sdk', () => ({ ...jest.requireActual('@/sdk'), useCelebrate: () => mockCelebrate }));

const flush = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});
// Waits out the pause that keeps a finished glyph on screen.
const held = () => act(async () => {
  await new Promise((r) => setTimeout(r, DONE_HOLD_MS + 20));
});

async function mount(el: React.ReactElement) {
  let tree: ReturnType<typeof create>;
  await act(async () => {
    tree = create(el);
  });
  await act(async () => {
    tree!.root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.onLayout === 'function')[0].props.onLayout({
      nativeEvent: { layout: { width: 800, height: 400 } },
    });
  });
  return tree!;
}

it('walks guided then solo, takes the min stars and records them', async () => {
  const one = charsFor('numbers', 'latin').find((c) => c.id === 'd1')!;
  let tree: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Round char={one} mode="full" onFinished={jest.fn()} />);
  });
  // Lay out a landscape area so the board mounts.
  await act(async () => {
    tree!.root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.onLayout === 'function')[0].props.onLayout({
      nativeEvent: { layout: { width: 800, height: 400 } },
    });
  });
  const texts = () => tree!.root.findAllByType(Text).map((n: { props: { children?: unknown } }) => n.props.children);
  expect(texts()).toContain('Follow the arrow!');
  const board = () => tree!.root.findByType(TraceBoard);
  expect(board().props.step.pass).toBe('guided');
  await act(async () => board().props.onDone(2));
  // The finished glyph stays up for a moment before the next pass.
  expect(board().props.step.pass).toBe('guided');
  await held();
  expect(board().props.step.pass).toBe('solo');
  expect(texts()).toContain('Now on your own!');
  await act(async () => board().props.onDone(3));
  await held();
  await flush();
  expect((await progressStore.get()).done.d1).toBe(2);
  expect(tree!.root.findAllByType(WinSticker)).toHaveLength(1);
  act(() => tree!.unmount());
});

it('in a flow, records stars and finishes at once without its own sticker', async () => {
  const a = charsFor('letters', 'latin')[0];
  const onFinished = jest.fn();
  let tree: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Round char={a} mode="guidedOnly" inFlow onFinished={onFinished} />);
  });
  await act(async () => {
    tree!.root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.onLayout === 'function')[0].props.onLayout({
      nativeEvent: { layout: { width: 800, height: 400 } },
    });
  });
  const steps = tree!.root.findByType(TraceBoard).props.step;
  expect(steps.pass).toBe('guided');
  for (let i = 0; i < a.glyphs.length; i++) {
    // Only the last glyph leaves its chime to the flow's own success sound.
    expect(tree!.root.findByType(TraceBoard).props.quietDone).toBe(i === a.glyphs.length - 1);
    await act(async () => tree!.root.findByType(TraceBoard).props.onDone(3));
    await held();
  }
  await flush();
  expect(onFinished).toHaveBeenCalledWith(3);
  expect(tree!.root.findAllByType(WinSticker)).toHaveLength(0);
  act(() => tree!.unmount());
});

it('waits for the celebration burst before the sticker, so they never overlap', async () => {
  let release!: () => void;
  mockCelebrate.mockImplementationOnce(() => new Promise<void>((r) => (release = r)));
  const one = charsFor('numbers', 'latin').find((c) => c.id === 'd1')!;
  let tree: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Round char={one} mode="full" onFinished={jest.fn()} />);
  });
  await act(async () => {
    tree!.root.findAll((n: { props: Record<string, unknown> }) => typeof n.props.onLayout === 'function')[0].props.onLayout({
      nativeEvent: { layout: { width: 800, height: 400 } },
    });
  });
  await act(async () => tree!.root.findByType(TraceBoard).props.onDone(3));
  await held();
  await act(async () => tree!.root.findByType(TraceBoard).props.onDone(3));
  await held();
  await flush();
  expect(mockCelebrate).toHaveBeenCalled();
  expect(tree!.root.findAllByType(WinSticker)).toHaveLength(0);
  await act(async () => release());
  await flush();
  expect(tree!.root.findAllByType(WinSticker)).toHaveLength(1);
  act(() => tree!.unmount());
});

it('Lulu encourages from the side pane after two misses, and never cheers over the finish', async () => {
  const one = charsFor('numbers', 'latin').find((c) => c.id === 'd1')!;
  const tree = await mount(<Round char={one} mode="full" onFinished={jest.fn()} />);
  const pose = () => tree.root.findByType(MascotHelper).props.pose;
  expect(tree.root.findByType(MascotHelper).props.side).toBe('end');
  expect(pose()).toBeNull();
  await act(async () => tree.root.findByType(TraceBoard).props.onMisses(2));
  expect(pose()).toBe('encourage');
  await act(async () => tree.root.findByType(TraceBoard).props.onMisses(0));
  for (let i = 0; i < 2; i++) {
    await act(async () => tree.root.findByType(TraceBoard).props.onDone(3));
    await held();
  }
  await flush();
  expect(tree.root.findAllByType(MascotHelper).every((m: { props: { pose?: unknown } }) => m.props.pose !== 'cheer')).toBe(true);
  act(() => tree.unmount());
});

it('a warm-up sticker says "I can draw", a letter sticker "I can write"', () => {
  const zig = charsFor('warmup', 'latin').find((c) => c.id === 'w:zigzag')!;
  const a = charsFor('letters', 'latin')[0];
  const caption = (c: typeof a) => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<WinSticker char={c} onDone={jest.fn()} />);
    });
    const texts = tree!.root.findAllByType(Text).map((n: { props: { children?: unknown } }) => n.props.children);
    act(() => tree!.unmount());
    return texts;
  };
  expect(caption(zig)).toContain('I can draw a zigzag!');
  expect(caption(a)).toContain(`I can write ${a.label}!`);
});
