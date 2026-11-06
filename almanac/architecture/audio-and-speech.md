---
title: "Audio and Speech Architecture"
summary: "useSound and useLoopSound resolve plain intent tags against the shared asset manifest and play them through expo-audio, gated on settings.soundEnabled; useSpeech wraps expo-speech with the same graceful degradation but is deliberately never gated by any sound setting, since spoken prompts are game content in the listen-and-find games. useSound mirrors settingsStore into a ref instead of reading it per call, and exposes prewarm() to load audio players before a level starts, both changes made for games that call play() from a per-frame motion loop. Every AudioPlayer created by useSound or useLoopSound is freed through releasePlayer/releaseWhenDone rather than expo-audio's own remove(), because on Android remove() alone leaks the native AudioTrack until JS GC runs, and past roughly 40 live tracks a new player hangs silently in buffering instead of erroring."
topics: [architecture, audio, assets]
sources:
  - id: use-sound
    type: file
    path: src/sdk/audio/useSound.ts
  - id: use-sound-test
    type: file
    path: src/sdk/audio/__tests__/useSound.test.tsx
  - id: use-loop-sound
    type: file
    path: src/sdk/audio/useLoopSound.ts
  - id: use-speech
    type: file
    path: src/sdk/speech/useSpeech.ts
  - id: query-ts
    type: file
    path: src/sdk/assets/query.ts
  - id: manifest-ts
    type: file
    path: src/sdk/assets/manifest.ts
  - id: never-muted-test
    type: file
    path: src/sdk/speech/__tests__/never-muted.test.ts
  - id: settings-store
    type: file
    path: src/sdk/settings/store.ts
  - id: create-store
    type: file
    path: src/sdk/storage/createStore.ts
  - id: sound-overrides-context
    type: file
    path: src/sdk/audio/SoundOverridesContext.ts
  - id: game-player-screen
    type: file
    path: src/screens/GamePlayerScreen.tsx
  - id: win-jingles-test
    type: file
    path: src/games/__tests__/winJingles.test.ts
  - id: animal-credits
    type: file
    path: src/sdk/assets/audio/animals/CREDITS.md
  - id: release-player
    type: file
    path: src/sdk/audio/releasePlayer.ts
  - id: release-player-test
    type: file
    path: src/sdk/audio/__tests__/releasePlayer.test.ts
  - id: use-loop-sound-test
    type: file
    path: src/sdk/audio/__tests__/useLoopSound.test.tsx
  - id: track-stress
    type: file
    path: src/sdk/audio/dev/trackStress.ts
---

Games never load a sound file or ask for a specific voice directly. They call
`useSound().play('pop')` or `useSpeech().speak('A is for Apple')` and the SDK
resolves the rest: whether sound is on, whether haptics should fire, which of
several interchangeable clips to play, and which locale to speak in. Both
`useSound` and `useLoopSound` sit on top of `expo-audio`, and `useSpeech` sits
on top of `expo-speech`; all three degrade to a silent no-op on any failure
and never throw into the calling game, but only `useSound`/`useLoopSound`
actually gate playback on a setting — `useSpeech` deliberately does not, for
reasons covered in its own section below. The layer that ties sound requests
to actual audio files is the asset manifest's tag vocabulary, queried through
`src/sdk/assets/query.ts`.

## Intent tags, not manifest keys

Games ask for sounds by a small vocabulary of intent tags — `'pop'`,
`'success'`, `'win'`, `'wrong'`, `'powerup'`, `'transition'`, and so on — not
by the manifest's own keys like `'sfx.pop'`. `manifest.ts` defines `ASSETS` as
a map from an asset id (e.g. `'sfx.pop'`) to an entry with a `modules` array
of one or more `require()`'d clips and a `tags` array that includes the
intents that resolve to it; `'sfx.pop'`'s tags are `['pop', 'flip', 'tap',
'ui', 'select']`, so any of those five words plays one of its `drop_*.wav`
variants [@manifest-ts]. `query.ts`'s `pickAsset(intent)` finds the first
asset id whose `tags` include the given intent, and `pickModule(intent)`
takes that asset's `modules` array and returns one entry at random
[@query-ts]. Picking randomly among several clips for the same intent — most
entries in the manifest carry two to four near-identical variants — exists
so that repeated taps or matches in a game don't all trigger the exact same
sample back to back [@manifest-ts]. Every clip in the manifest is normalized
to one loudness (−25 dBFS active RMS, peak ≤ −6 dBFS) so switching between
intents in the same play session never makes one sound jump out over
another; the full tag table and the CC0 sourcing behind it are on the
[Asset manifest tags](../reference/asset-manifest-tags) reference page. An
intent that matches nothing in the manifest makes `pickAsset` return
`undefined`, and every caller downstream treats that as a graceful no-op
rather than an error.

The manifest also holds a second, unrelated vocabulary: real animal sound
clips keyed like `'animal.lion'`, each with a single fixed module rather than
several variants, used by name (`useSound().play('animal.lion')`) in Animal
Safari's "which sound" rounds [@manifest-ts]. These entries don't participate
in the random-variant behavior at all, since each has only one clip in its
`modules` array. Each clip ships as AAC `.m4a`, not the Ogg Vorbis format it
was originally sourced in, because iOS only plays Ogg starting at version
18.4 and this app supports older iPhones; see
[Licensing and attribution](../reference/licensing-and-attribution) for the
per-clip credits and the [Add a game asset](../guides/add-a-game-asset) guide
for the WAV-vs-`.m4a` rule any new audio asset should follow
[@animal-credits].

## `useSound`: one-shot effects

`useSound()` returns `{ play(intent, options?), prewarm(intents) }`. `play` is
synchronous now, not `async`: on mount, the hook fires `settingsStore.get()`
once and also calls `settingsStore.subscribe()`, mirroring whatever comes back
into a plain `useRef<Settings>` rather than re-reading storage inside `play`
itself [@use-sound] [@create-store]. `play` fires an `Haptics.impactAsync(Light)`
if the mirrored `hapticsEnabled` is true and the caller didn't pass
`{ haptic: false }` — haptics and sound are gated independently, so haptics
can still fire even when sound playback is skipped a line later because
`soundEnabled` is false [@use-sound]. If sound is enabled, `play`
calls `pickModule(intent)`; a returned `undefined` means an unknown intent
and `play` returns immediately, silently [@use-sound]. Otherwise it either
replays a cached `AudioPlayer` for that exact module — calling `seekTo(0)`
first, since `expo-audio` does not auto-rewind on finish — or creates one via
`createAudioPlayer(module)` and caches it keyed by module identity
[@use-sound]. The whole call is wrapped in a `try/catch` that swallows any
playback failure, and the effect's cleanup unsubscribes from the store and
calls `releaseWhenDone` — not `expo-audio`'s own `remove()` — on every cached
player on unmount, so a round that unmounts right after playing its own win
sound doesn't cut that clip short while every other, already-finished cached
player still frees its native track at once [@use-sound] [@release-player].
`setAudioModeAsync({ playsInSilentMode: true })` is called once on mount so
effects still play even when the device's hardware mute switch is on
[@use-sound].

The settings mirror exists because `play()` is called from places where an
`AsyncStorage` round-trip plus a JSON parse is expensive: repeatedly during a
drag gesture, and — since the
[motion and game loop](../architecture/motion-and-game-loop) subsystem shipped in the same
range — from inside a `useGameLoop` `step` worklet via `runOnJS`, on the same
JS thread the loop's own event handling runs on [@use-sound]. Reading a ref
instead of awaiting the store keeps that hot path free of both costs, while
`settingsStore.subscribe()` still keeps the mirrored value current if the
setting changes elsewhere in the app while the game stays mounted
[@use-sound]. `useSound.test.tsx` pins this as a regression test: calling
`play()` 25 times in a row must not add any `AsyncStorage.getItem` calls
beyond what mounting already cost, and a `soundEnabled: false` write made
through `settingsStore` after mount must still reach an already-mounted
caller's next `play()` [@use-sound-test].

`prewarm(intents)` loads every variant module for a list of intents up front
via `createAudioPlayer`, so no player is constructed for the first time in the
middle of a level [@use-sound]. Before this existed, the first occurrence of
each sound variant during play created its `AudioPlayer` on the spot — a file
load landing mid-gameplay. `candy-catch` calls `prewarm` once, with its full
list of sound intents, right after mount [@use-sound]. `useSound.test.tsx`
confirms that after a `prewarm` call, up to 30 further `play()` calls create no
additional `AudioPlayer` instances [@use-sound-test].

## The Android AudioTrack ceiling: why `remove()` alone is wrong

`expo-audio`'s own `AudioPlayer.remove()` only unregisters the JS-side object;
on Android the underlying ExoPlayer, its native `AudioTrack`, and its
`MediaSession` keep running until the JS object is garbage-collected, which on
a long-lived `useSound` cache can be much later than the call site expects
[@release-player]. Past the OS's per-process track ceiling — 39 on a Redmi
Note 8 Pro — a new player that tries to claim a track fails, but not by
throwing or by reporting an error: it sits in
`isBuffering: true` with `status.error` unset forever, so `play()` keeps
"succeeding" from the caller's point of view while nothing is heard
[@release-player] [@track-stress]. `useSpeech`'s bundled clips and
`useSound`'s jingles share the same process-wide track budget, so a long
session that never frees sound-effect players can leave no room for a voice
clip to play even though `useSpeech` itself has no leak of its own.

`src/sdk/audio/releasePlayer.ts` is the fix, and every player `useSound` or
`useLoopSound` creates now goes through it instead of a bare `remove()`
[@release-player] [@use-sound] [@use-loop-sound]. `releasePlayer(player)`
calls both `remove()` and `release()` — `release()` is the call that actually
frees the native track — each wrapped in its own `try/catch` since a player
can legitimately already be gone by the time cleanup runs
[@release-player] [@release-player-test]. `releaseWhenDone(player)` adds one
thing on top: if the player is still `playing`, it schedules the same release
for `(duration - currentTime) * 1000 + 100ms` later instead of releasing (and
thereby stopping) a clip mid-playback — this is what `useSound`'s unmount
cleanup calls, so a round that ends right as its win sound starts doesn't cut
it off [@release-player] [@release-player-test]. `onPlayerFailed(player,
handler)` is the detector: it listens for `playbackStatusUpdate` events
reporting a nonzero `status.error`, and separately arms a `STALL_MS` (1500ms)
timeout that calls `handler` if the player is still `isBuffering` once that
time passes, covering the silent-buffering failure the ceiling actually
produces [@release-player] [@release-player-test]. `useSound.playerFor`
wires this in: when a cached player reports failure, it is dropped from the
cache and released, so the *next* `play()` call for that module builds a
fresh `AudioPlayer` rather than retrying a player that can never recover
[@use-sound] [@use-sound-test]. `useLoopSound.test.tsx` and the player-lifetime
tests in `useSound.test.tsx` pin both the release-on-unmount and
rebuild-after-failure behavior as regressions [@use-loop-sound-test]
[@use-sound-test].

`src/sdk/audio/dev/trackStress.ts` is a device-only harness for reproducing
and measuring the ceiling itself, compiled in only when a build sets
`EXPO_PUBLIC_AUDIO_STRESS=1`, wired from a `useEffect` in `App.tsx` so it never
ships in a normal build [@track-stress]. It creates players from
`clips.generated.ts`'s speech clips, holding every one in an array so JS GC
can't hide the leak, first releasing each with `releasePlayer` and then
repeating the same run calling only `remove()` — the logcat tag
`[track-stress]` and `dumpsys media.audio_flinger`'s track count are read
together on-device to confirm `release()` is the call that actually frees a
track and that a player past the ceiling plays nothing when asked to
[@track-stress].

## Per-game sound overrides: `SoundOverridesContext`

By default every game resolves the same intent to the same shared asset —
`play('win')` always picks among `sfx.win`'s own three clips, so two games
finishing a level back to back can sound identical. `GameConfig.sounds` (a
`SoundOverrides` map of `{ [fromAssetId]: toAssetId }`, e.g. `{ 'sfx.win':
'jingle.sax-10' }`) lets one game redirect an intent to a different manifest
asset without touching any of its own `play()` call sites [@query-ts]. The
map is keyed by asset id, not by intent string, so it also catches every
other intent tag that resolves to the same asset — `'celebration'` would be
redirected along with `'win'`, since both tags sit on `sfx.win`
[@query-ts].

`GamePlayerScreen` is the one place this map is read off a game's config: it
takes `game.sounds ?? {}` and wraps the whole rendered game tree —
both the `layout.mode === 'bare'` branch and the `GameShell`-wrapped
`'shell'` branch — in `SoundOverridesContext.Provider`, so every component
under the game, including shared engines like `_shared/listen-find` that a
game never customizes itself, sees the same override map [@game-player-screen]
[@sound-overrides-context]. `useSound` reads that context with
`useContext(SoundOverridesContext)` and copies the current value into a
`ref` on every render — the same pattern already used for the `settingsStore`
mirror above — so `play` and `prewarm` keep a stable callback identity across
re-renders for games that pass them as hook dependencies [@use-sound]. Both
functions then pass that ref's value through to `pickModule`/`modulesFor` in
`query.ts`, which look up `overrides[id] ?? id` after resolving the intent to
an asset id, so an unset override is a no-op and the whole feature degrades
to today's shared-asset behavior for any game that omits `sounds` entirely
[@query-ts].

The concrete use case driving this is a distinct win jingle per game. A
dedicated manifest family, `jingle.*` (twelve ids — three instruments times
four melodies — detailed on the
[Asset manifest tags](../reference/asset-manifest-tags) reference page),
exists only as override targets: every entry carries `tags: []`, so none of
them is ever reachable by `play(intent)` on its own, only by a game's
`sounds` override [@manifest-ts]. `src/games/__tests__/winJingles.test.ts`
enforces that every registered game which ever calls `play('win')` sets one
of these ids, and that no two games share the same one — reading each
`config.ts` as plain text rather than importing every game's component tree
[@win-jingles-test]. `count-and-pop` is the one deliberate exception: it only
ever plays `'success'` on a correct pop and never reaches a `'win'` state, so
the test instead asserts it carries no override at all, since one would be
dead config [@win-jingles-test]. `validateGameConfig` separately checks that
every key and value in `sounds` is a real asset id, covered on the
[Game config schema](../reference/game-config-schema) reference page.

## `useLoopSound`: ambient sound tied to a lifecycle

Some games want a continuous background sound — an engine rumble, wind — that
tracks a boolean rather than firing once. `useLoopSound(intent, {active,
volume, rate})` lazily creates a single looping `AudioPlayer` the first time
`active && settings.soundEnabled` becomes true, and from then on just calls
`.play()` or `.pause()` on that same player as the combined condition flips,
rather than tearing it down and recreating it every toggle [@use-loop-sound].
If the `intent` argument itself changes while a player is loaded, the hook
drops the old player and lazily creates a new one on the next sync, since a
different intent means a different clip entirely [@use-loop-sound]. Volume
and playback rate are pushed onto the live player through their own effects,
and the `rate` write is wrapped in a `try/catch` specifically because
`setPlaybackRate` is not supported on every platform — an unsupported rate
call degrades silently instead of crashing the loop [@use-loop-sound]. An
in-flight `creatingRef` guard prevents two overlapping create calls from ever
racing if `active` toggles rapidly during the async `createAudioPlayer` call,
and a `mountedRef` check discards a player created after the component has
already unmounted [@use-loop-sound].

## `useSpeech`: text-to-speech that no sound setting can silence

`useSpeech()` wraps `expo-speech`, and unlike `useSound`/`useLoopSound` it is
deliberately **not** gated by `settings.soundEnabled` or by any dedicated voice
toggle — `Settings` has no field for muting speech at all [@use-speech]
[@settings-store]. The reasoning is specific to this app: in the
listen-and-find games (`letter-land`, `numbers-land`, `animal-safari`) the
spoken prompt *is* the question — "which letter is this?" has no other way to
reach the child — so a setting that could mute it would make those three games
literally unplayable while looking like an ordinary sound toggle. An earlier
version of this hook added a separate `voiceEnabled` setting to split spoken
content from sound-effect decoration, but that still left a control a parent
could flip to break those games; the shipped design removes the toggle
entirely instead. `src/sdk/speech/__tests__/never-muted.test.ts` enforces this
by reading `useSpeech.ts`'s own source and asserting it contains neither a
`soundEnabled` check nor any reference to `voiceEnabled`, and separately
asserts `'voiceEnabled' in DEFAULT_SETTINGS` is `false` — a regression test
written against the source text itself, not just behavior, so a future PR
can't quietly reintroduce a mute path [@never-muted-test]. `speak` still
`await`s `settingsStore.get()` before speaking, but only to preserve timing
for the mounted-ref guard described next — the returned settings value itself
is not read for gating [@use-speech].

The one guard `useSpeech` does keep is a mounted-ref check placed *after* that
await: if the component unmounted while the store read was in flight, `speak`
returns without calling `Speech.speak` at all [@use-speech]. That guard exists
to close a specific race — the hook's own unmount cleanup calls
`Speech.stop()` synchronously, and without the guard a `speak()` call that was
already in flight when the unmount happened could resolve afterward and start
talking on whatever screen replaced it [@use-speech]. Every call to `speak`
also calls `Speech.stop()` immediately
before `Speech.speak()`, because `expo-speech` queues utterances by default —
without that stop, rapid repeated `speak` calls (for example, replaying a
letter prompt) would stack up and play back to back instead of each call
replacing the last [@use-speech]. Locale is resolved from
`currentLanguage()` through a small lookup table, `{en: 'en-US', ar: 'ar'}`
[@use-speech], and `rate`/`pitch` default to `0.7`/`1.1` — deliberately
slower and higher-pitched than a natural adult voice, chosen for clarity when
speaking single letters or words to young children [@use-speech]. This hook
backs every game with a spoken prompt: `letter-land`, `numbers-land`, and
`animal-safari` all speak through the shared `_shared/listen-find` engine
rather than each calling `expo-speech` independently.

## Consequence: adding a sound or a spoken game means touching the manifest, not the game

Because both hooks resolve everything through `pickModule`/`pickAsset`
against the manifest's `tags`, adding a new sound effect a game can use never
requires new code in the game itself — it requires a new entry (or a new tag
on an existing entry) in `manifest.ts`, described in full by the
[Asset manifest tags](../reference/asset-manifest-tags) reference page and
the [Add a game asset](../guides/add-a-game-asset) guide. Speech has no
manifest step at all, since `Speech.speak` takes arbitrary text rather than a
pre-recorded clip — the only shared state it reads is `settingsStore` and
`currentLanguage()`, covered by the
[Storage and progress](../architecture/storage-and-progress) and
[i18n and RTL](../architecture/i18n-and-rtl) architecture pages respectively.
