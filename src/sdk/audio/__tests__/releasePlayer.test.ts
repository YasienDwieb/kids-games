import type { AudioPlayer } from 'expo-audio';
import { onPlayerFailed, releasePlayer, releaseWhenDone, STALL_MS } from '../releasePlayer';

function fakePlayer(state: Partial<AudioPlayer> = {}) {
  return {
    remove: jest.fn(),
    release: jest.fn(),
    playing: false,
    currentTime: 0,
    duration: 0,
    ...state,
  } as unknown as jest.Mocked<AudioPlayer>;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('releasePlayer', () => {
  it('frees the native player, which remove() alone does not', () => {
    const player = fakePlayer();
    releasePlayer(player);
    expect(player.remove).toHaveBeenCalled();
    expect(player.release).toHaveBeenCalled();
  });

  it('survives a player that is already gone', () => {
    const player = fakePlayer();
    player.remove.mockImplementation(() => {
      throw new Error('released');
    });
    player.release.mockImplementation(() => {
      throw new Error('released');
    });
    expect(() => releasePlayer(player)).not.toThrow();
  });

  it('still releases when remove() throws', () => {
    const player = fakePlayer();
    player.remove.mockImplementation(() => {
      throw new Error('released');
    });
    releasePlayer(player);
    expect(player.release).toHaveBeenCalled();
  });
});

describe('releaseWhenDone', () => {
  it('releases a stopped player at once', () => {
    const player = fakePlayer();
    releaseWhenDone(player);
    expect(player.release).toHaveBeenCalled();
  });

  it('waits for the rest of a clip that is still playing', () => {
    const player = fakePlayer({ playing: true, duration: 2, currentTime: 0.5 });
    releaseWhenDone(player);
    jest.advanceTimersByTime(1400);
    expect(player.release).not.toHaveBeenCalled();
    jest.advanceTimersByTime(600);
    expect(player.release).toHaveBeenCalled();
  });

  it('does not wait on a player with no known length', () => {
    const player = fakePlayer({ playing: true, duration: 0 });
    releaseWhenDone(player);
    expect(player.release).toHaveBeenCalled();
  });

  it('never throws reading a player that is already gone', () => {
    const player = fakePlayer();
    Object.defineProperty(player, 'playing', {
      get() {
        throw new Error('released');
      },
    });
    expect(() => releaseWhenDone(player)).not.toThrow();
    expect(player.release).toHaveBeenCalled();
  });
});

describe('onPlayerFailed', () => {
  const listening = (state: Partial<AudioPlayer> = {}) => {
    const player = fakePlayer(state);
    const addListener = jest.fn();
    Object.assign(player, { addListener });
    const handler = jest.fn();
    onPlayerFailed(player, handler);
    return { player, handler, emit: (status: object) => addListener.mock.calls[0][1](status) };
  };

  // Seen on a device: past the track ceiling a player stays in `buffering`
  // with error=null, forever.
  it('catches a player that never leaves buffering', () => {
    const { handler } = listening({ isBuffering: true });
    jest.advanceTimersByTime(STALL_MS);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('leaves a healthy player alone', () => {
    const { handler } = listening();
    jest.advanceTimersByTime(STALL_MS);
    expect(handler).not.toHaveBeenCalled();
  });

  it('catches a reported playback error', () => {
    const { handler, emit } = listening();
    emit({ error: 'decoder failed' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fires once when both signs appear', () => {
    const { handler, emit } = listening({ isBuffering: true });
    emit({ error: 'decoder failed' });
    jest.advanceTimersByTime(STALL_MS);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores a player released before the check', () => {
    const { player, handler } = listening();
    Object.defineProperty(player, 'isBuffering', {
      get() {
        throw new Error('released');
      },
    });
    expect(() => jest.advanceTimersByTime(STALL_MS)).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});
