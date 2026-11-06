---
title: "Celebration, Combo Streaks, and the Hint Ladder"
summary: "useCelebrate/CelebrationProvider replaces the tap-to-continue modal after small wins with a confetti-and-praise burst that also drives a combo streak counter; useHintLadder implements the shared three-step hint policy (retry, highlight, reveal) that decides both what a game shows after a wrong answer and how many stars a clean solve is worth."
topics: [architecture, sdk, engagement]
sources:
  - id: celebration
    type: file
    path: src/sdk/feedback/Celebration.tsx
  - id: combo
    type: file
    path: src/sdk/feedback/combo.ts
  - id: hints
    type: file
    path: src/sdk/feedback/hints.ts
  - id: use-hint-ladder
    type: file
    path: src/sdk/feedback/useHintLadder.ts
  - id: hints-test
    type: file
    path: src/sdk/feedback/__tests__/hints.test.ts
  - id: game-player-screen
    type: file
    path: src/screens/GamePlayerScreen.tsx
  - id: flow-player-screen
    type: file
    path: src/screens/FlowPlayerScreen.tsx
  - id: count-and-pop-index
    type: file
    path: src/games/count-and-pop/index.tsx
  - id: gdd-readme
    type: file
    path: docs/gdd/README.md
  - id: claude-md
    type: file
    path: CLAUDE.md
---

Before this subsystem existed, every small win in every game ended the same
way: a `wrong`/`success` sound, then a modal card with a button the child had
to tap before the game would continue. The project's own audit of all twelve
games names this directly as an engagement gap — "Same tap-to-continue modal
after every short round" — alongside two related gaps: no hint escalation
for repeated mistakes, and wrong answers that revealed the correct answer
with full credit and no stars penalty [@gdd-readme]. `useCelebrate` and
`useHintLadder` are the SDK's answer to both: a celebration kit that plays a
confetti-and-praise burst over the game instead of interrupting it, and a
shared hint-ladder policy that gives a struggling child escalating help while
still rewarding a clean, first-try solve more than a revealed one. The two
are wired together through a small combo-streak counter, so a game that only
calls `useCelebrate` for its wins and `useHintLadder` for its misses gets a
"×N COMBO!" streak display for free.

## `useCelebrate`: a burst over the game, not a modal in its way

`useCelebrate()` returns a `celebrate(size?, options?)` function; calling
`celebrate('small')` or `celebrate('big')` shows a confetti burst plus a
spoken praise line and resolves its promise once the burst (and any praise
voice still talking) has finished [@celebration]. A game that wants the
burst without interrupting play can `await` it and then call its own
`advance()`; a game that wants a milestone to still show a win card can pass
`{ praise: false }` to keep the confetti silent and show its own overlay
underneath it. Both patterns appear in `count-and-pop`'s single win handler:
an ordinary solve calls `celebrate('small')` and advances automatically once
it resolves, while every `MILESTONE_EVERY`-th level calls `celebrate('big',
{ praise: false })` and then opens a `LevelSolvedOverlay` instead
[@count-and-pop-index].

`CelebrationProvider` is mounted once by `GamePlayerScreen` and once by
`FlowPlayerScreen`, so both the ordinary per-game player and the guided
[flow](../concepts/flow) player get it automatically [@game-player-screen]
[@flow-player-screen]. `useCelebrate()` resolves to a no-op function from a
context default when no provider is mounted, so a game or a unit test that
renders a component calling it never has to guard for a missing provider
[@celebration].

A burst does four things at once, all rendered inside the provider so a game
component never has to assemble them itself [@celebration]:

- **Confetti.** `makePieces(size)` scatters 18 (`small`) or 36 (`big`)
  rounded/square pieces outward from center with per-piece jitter so a burst
  never looks gridded, animated with `Animated.parallel` over 1.15s or 1.9s.
- **A spoken praise line.** One of `PRAISE_COUNT` (8) recorded praise clips
  per language plays via `useSound`, chosen so it never repeats the previous
  line back-to-back; `stopSpeech()` is called first so an in-progress TTS
  prompt doesn't talk over the praise, and `holdVoice(voiceMs)` reserves the
  voice channel for the clip's measured length (`PRAISE_MS`) so a sticker
  toast or the next round's prompt waits its turn.
- **A cheering mascot.** A 3D `Lulu3D` mounted up front (before the first
  burst, so creating its GL context can't hitch the confetti) hops up from
  the corner in `mood="cheer"` while any burst is showing, and renders at a
  larger size for a `'big'` burst.
- **Reward toasts.** `StickerToast` and `LevelUp` are mounted inside the same
  overlay, listening for sticker-unlock and daily-goal events independently
  of any particular `celebrate()` call — see
  [Rewards, stars, and stickers](rewards-and-stickers) for that state.

## The combo streak

`feedback/combo.ts` is a tiny module-level counter, not a React hook:
`bumpCombo(now?)` increments the streak if the time since the last bump is
within `COMBO_WINDOW_MS` (20 seconds), otherwise it restarts the streak at 1;
`breakCombo()` resets it to zero [@combo]. `celebrate()` calls `bumpCombo()`
on every burst and stores the result on that burst's `combo` field
[@celebration]; the burst's praise bubble shows a "×N COMBO!" badge once
`combo >= 2`. `useHintLadder`'s `miss()` calls `breakCombo()` on every wrong
attempt [@use-hint-ladder], so a streak only ever counts an unbroken run of
clean wins across however many games the child plays in one sitting — a
20-second gap between rounds (thinking, reading a new prompt) does not end
it, but a wrong answer does.

## The shared hint ladder

`hints.ts` defines the policy as two pure functions with no React or storage
involved, which is what makes it "shared" rather than per-game [@hints]:

- `hintStepFor(misses)` returns `'retry'` for a first miss, `'highlight'`
  for a second, and `'reveal'` for a third or any later miss.
- `starsForMisses(misses)` returns `3` for a first-try solve (zero misses),
  `2` after exactly one miss, and `1` for two or more.

`hints.test.ts` pins both as the literal escalation and reward table above,
including the boundary cases (`hintStepFor(9)` is still `'reveal'`;
`starsForMisses(5)` is still `1`) [@hints-test]. A game is expected to read
`'retry'` as "say try again, reveal nothing"; `'highlight'` as "point at the
answer (pulse/glow) but still make the child tap it"; and `'reveal'` as "show
the answer outright so nobody gets permanently stuck" [@hints].
`count-and-pop` follows exactly this: on a wrong choice it calls `hints.miss()`,
shows the correct answer only `if (step === 'reveal')`, and from the second
miss on (`step !== 'retry'`) sets a highlight index that stays lit until the
correct tile is tapped [@count-and-pop-index].

`useHintLadder(roundKey)` is the stateful wrapper most games actually call.
It keeps the miss count in both a `ref` and `useState`: the ref is the source
of truth so `miss()` can return the right `HintStep` synchronously even if
two taps land in the same frame, while the state value exists only to force a
re-render [@use-hint-ladder]. The counter resets whenever `roundKey` changes
— a game passes its current level number or round id so a fresh round always
starts at zero misses — and the hook exposes `misses`, `step` (`null` until
the first miss), `firstTry`, and `stars` (the live `starsForMisses(misses)`
value) so a game can read "what would a solve earn right now" at any point,
not only after the round ends [@use-hint-ladder].

## Why these three pieces are one page

Hints, combo, and celebration read as three small, independent files, but
they are one runtime loop: a miss through `useHintLadder` both steps the hint
ladder and silently ends any combo streak in progress, and a clean solve
both earns the full three stars from `starsForMisses` and, if the game calls
`celebrate()` to announce it, bumps that same streak back up. A game wiring
only one half — hints without celebration, or celebration without hints —
still works, but loses the cross-system payoff the audit asked for: a child
who strings together several clean, hint-free solves sees that reflected
back as a rising combo number, not just as silently-higher per-round stars.
See [First-run tutorials](first-run-tutorials) for the companion onboarding
kit from the same engagement effort, and
[Rewards, stars, and stickers](rewards-and-stickers) for where the stars a
round earns actually go. `CLAUDE.md`'s "Feedback" bullet is the terse,
up-to-date version of this same contract for a reader who only needs the
function signatures [@claude-md].
