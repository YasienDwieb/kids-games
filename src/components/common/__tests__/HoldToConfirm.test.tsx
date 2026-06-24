import { act, create } from 'react-test-renderer';
import { HoldToConfirm } from '../HoldToConfirm';

jest.useFakeTimers();

// Find the node carrying the hold handlers (the Pressable) by prop, not by
// type — jest-expo's Pressable can't be matched by reference via findByType.
function holdProps(tree: ReturnType<typeof create>) {
  const nodes = tree.root.findAll(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (n: any) => Boolean(n.props) && typeof n.props.onPressIn === 'function',
  );
  return nodes[0].props as { onPressIn: () => void; onPressOut: () => void };
}

it('fires onConfirm after the full hold duration', () => {
  const onConfirm = jest.fn();
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<HoldToConfirm label="Hold" onConfirm={onConfirm} duration={1000} />);
  });
  act(() => holdProps(tree).onPressIn());
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(onConfirm).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

it('does not fire if released before the duration', () => {
  const onConfirm = jest.fn();
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<HoldToConfirm label="Hold" onConfirm={onConfirm} duration={1000} />);
  });
  act(() => holdProps(tree).onPressIn());
  act(() => {
    jest.advanceTimersByTime(500);
  });
  act(() => holdProps(tree).onPressOut());
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(onConfirm).not.toHaveBeenCalled();
  act(() => tree.unmount());
});
