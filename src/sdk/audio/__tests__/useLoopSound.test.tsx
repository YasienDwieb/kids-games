import { createAudioPlayer } from 'expo-audio';
import { act, create } from 'react-test-renderer';
import { useLoopSound } from '../useLoopSound';

function Probe() {
  useLoopSound('turbo', { active: true });
  return null;
}

it('frees the loop player on unmount', async () => {
  let tree!: ReturnType<typeof create>;
  await act(async () => {
    tree = create(<Probe />);
    await new Promise((r) => setTimeout(r, 0));
  });
  const player = (createAudioPlayer as jest.Mock).mock.results.at(-1)?.value;
  expect(player).toBeDefined();
  act(() => tree.unmount());
  expect(player.release).toHaveBeenCalled();
});
