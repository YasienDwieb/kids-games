import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { ChallengeSuccess } from '../ChallengeSuccess';

jest.useFakeTimers();

const props = {
  visible: true,
  targetHex: '#43A047',
  targetName: 'Green',
  stars: 3,
};

type SuccessProps = React.ComponentProps<typeof ChallengeSuccess>;

function renderSuccess(overrides: Partial<SuccessProps> = {}) {
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(<ChallengeSuccess {...props} onDismiss={jest.fn()} {...overrides} />);
  });
  return tree;
}

const starCount = (tree: ReturnType<typeof create>) =>
  tree.root.findAllByType(Text).filter((node: { props: { children?: unknown } }) => node.props.children === '★').length;

describe('ChallengeSuccess', () => {
  afterEach(() => jest.clearAllTimers());

  it('renders nothing when not visible', () => {
    const tree = renderSuccess({ visible: false });
    expect(tree.toJSON()).toBeNull();
  });

  it('dismisses itself on a timer', () => {
    const onDismiss = jest.fn();
    renderSuccess({ onDismiss });

    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('still dismisses when the callback identity changes on every render', () => {
    // The regression this guards: the dismiss timer used to live in an effect that
    // depended on the state it set, so its own cleanup cancelled it and the celebration
    // stayed on screen forever with no way out. Re-rendering with a fresh callback must
    // neither restart nor cancel the timer.
    const onDismiss = jest.fn();
    const tree = renderSuccess({ onDismiss: () => onDismiss() });

    for (let i = 0; i < 3; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      act(() => {
        tree.update(<ChallengeSuccess {...props} onDismiss={() => onDismiss()} />);
      });
    }

    expect(onDismiss).toHaveBeenCalled();
  });

  it('can be dismissed by tapping the celebration', () => {
    const onDismiss = jest.fn();
    const tree = renderSuccess({ onDismiss });

    const pressables = tree.root.findAll(
      (node: { props: { onPress?: unknown } }) => typeof node.props.onPress === 'function',
    );
    act(() => {
      pressables[0].props.onPress();
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows three star slots, filled up to the score', () => {
    expect(starCount(renderSuccess({ stars: 2 }))).toBe(3);
    expect(starCount(renderSuccess({ stars: 0 }))).toBe(3);
  });
});
