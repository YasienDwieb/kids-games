import { overlayClosed, overlayOpened, whenOverlayClear } from '../overlayGate';

it('runs at once when nothing covers the game', () => {
  const fn = jest.fn();
  whenOverlayClear(fn);
  expect(fn).toHaveBeenCalledTimes(1);
});

it('waits for every open overlay to close, and can be cancelled', () => {
  const fn = jest.fn();
  const cancelled = jest.fn();
  overlayOpened();
  overlayOpened();
  whenOverlayClear(fn);
  whenOverlayClear(cancelled)();
  overlayClosed();
  expect(fn).not.toHaveBeenCalled();
  overlayClosed();
  expect(fn).toHaveBeenCalledTimes(1);
  expect(cancelled).not.toHaveBeenCalled();
});
