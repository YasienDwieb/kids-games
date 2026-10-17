import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import '@/games/_shared/letters/i18n';
import '../i18n';
import { charsFor } from '../catalog';
import { Round } from '../components/Round';
import { TraceBoard } from '../components/TraceBoard';
import { WinSticker } from '../components/WinSticker';
import { progressStore } from '../progress';

const flush = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

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
  expect(board().props.step.pass).toBe('solo');
  expect(texts()).toContain('Now on your own!');
  await act(async () => board().props.onDone(3));
  await flush();
  expect((await progressStore.get()).done.d1).toBe(2);
  expect(tree!.root.findAllByType(WinSticker)).toHaveLength(1);
  act(() => tree!.unmount());
});
