import type { AudioPlayer } from 'expo-audio';

const TAIL_MS = 100;

/** Far past a healthy load, ~200ms on a Redmi Note 8 Pro. */
export const STALL_MS = 1500;

/**
 * Free a player now. On Android `remove()` only unregisters it: the ExoPlayer,
 * its AudioTrack and MediaSession live until JS GC collects the object, and past
 * the OS track ceiling (39 on a Redmi Note 8 Pro) new clips fail in silence.
 * `release()` is what frees them; never use `remove()` alone.
 */
export function releasePlayer(player: AudioPlayer): void {
  try {
    player.remove();
  } catch {
    // already released
  }
  try {
    player.release();
  } catch {
    // already released
  }
}

/** Like releasePlayer, but `release()` stops audio, so let a playing clip finish. */
export function releaseWhenDone(player: AudioPlayer): void {
  let remainingMs = 0;
  try {
    if (player.playing) remainingMs = (player.duration - player.currentTime) * 1000;
  } catch {
    // already released
  }
  if (remainingMs > 0) setTimeout(() => releasePlayer(player), remainingMs + TAIL_MS);
  else releasePlayer(player);
}

/**
 * Calls `handler` once if a new player turns out dead. play() never reports this
 * and keeps "succeeding". Past the track ceiling the player doesn't even error:
 * it sits in `buffering` with error=null forever, so that is checked for too. One
 * check per player, so play() stays cheap for games calling it from a frame loop.
 */
export function onPlayerFailed(player: AudioPlayer, handler: () => void): void {
  let failed = false;
  const fail = () => {
    if (failed) return;
    failed = true;
    handler();
  };
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.error) fail();
  });
  setTimeout(() => {
    try {
      if (player.isBuffering) fail();
    } catch {
      // already released
    }
  }, STALL_MS);
}
