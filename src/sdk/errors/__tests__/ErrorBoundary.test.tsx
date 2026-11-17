import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { ErrorBoundary } from '../ErrorBoundary';
import * as report from '../report';

function Boom(): never {
  throw new Error('kaboom');
}

it('shows the fallback and reports instead of throwing', () => {
  const spy = jest.spyOn(report, 'reportError').mockImplementation(() => undefined);
  const onError = jest.fn();
  const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  let tree!: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <ErrorBoundary where="game:test" fallback={<Text>safe</Text>} onError={onError}>
        <Boom />
      </ErrorBoundary>,
    );
  });
  expect(tree.root.findByType(Text).props.children).toBe('safe');
  expect(spy).toHaveBeenCalledWith(expect.any(Error), 'game:test');
  expect(onError).toHaveBeenCalledTimes(1);
  spy.mockRestore();
  quiet.mockRestore();
});
