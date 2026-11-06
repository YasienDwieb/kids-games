import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { CLIPS } from '@/sdk/speech/clips.generated';
import { onPlayerFailed, releasePlayer } from '../releasePlayer';

/**
 * Device harness for the AudioTrack leak, compiled in only when a build sets
 * EXPO_PUBLIC_AUDIO_STRESS=1 (see App.tsx). No audio is heard: a prepared player
 * already holds its track. Every player stays referenced, so JS GC can't hide
 * the result. Read `[track-stress]` in logcat and the count in
 * `dumpsys media.audio_flinger`.
 */
const COUNT = 45;
const STEP_MS = 250;
const REST_MS = 8000;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(mode: 'release' | 'remove'): Promise<void> {
  const held: AudioPlayer[] = [];
  let errors = 0;
  for (const module of Object.values(CLIPS).slice(0, COUNT)) {
    const player = createAudioPlayer(module);
    held.push(player);
    onPlayerFailed(player, () => {
      errors += 1;
    });
    await wait(STEP_MS);
    if (mode === 'release') releasePlayer(player);
    else player.remove();
    console.log(`[track-stress] mode=${mode} players=${held.length} errors=${errors}`);
  }
  await wait(REST_MS);
  console.log(`[track-stress] done mode=${mode} players=${held.length} errors=${errors}`);
  if (mode === 'remove') await probe(held[held.length - 1]);
}

/** What a player that lost the track race does when a game actually plays it. */
async function probe(player: AudioPlayer): Promise<void> {
  player.addListener('playbackStatusUpdate', (s) => {
    console.log(`[track-stress] status state=${s.playbackState} playing=${s.playing} error=${s.error}`);
  });
  const report = (at: string) =>
    console.log(
      `[track-stress] probe ${at} playing=${player.playing} loaded=${player.isLoaded} ` +
        `buffering=${player.isBuffering} time=${player.currentTime} duration=${player.duration}`,
    );
  report('before');
  void player.seekTo(0);
  player.play();
  for (const ms of [300, 1200, 3000, 8000]) {
    await wait(ms);
    report(`+${ms}`);
  }
}

export async function runTrackStress(): Promise<void> {
  await wait(REST_MS);
  await run('release');
  await run('remove');
}
