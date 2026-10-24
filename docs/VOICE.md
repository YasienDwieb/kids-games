# Voice

Every phrase a game speaks (letters, numbers, animals, colours, trace-it names) ships as a
pre-generated clip. `useSpeech().speak(text)` plays the clip whose key is `"<lang>:<text>"`
and only falls back to the device's TTS when no clip exists.

## Voice

Google Cloud Text-to-Speech, **Chirp 3 HD "Leda"** — `en-US-Chirp3-HD-Leda` and
`ar-XA-Chirp3-HD-Leda` — chosen in a side-by-side bake-off for being the warmest voice for
young children. Settings live in [`scripts/voice/voice.config.json`](../scripts/voice/voice.config.json);
changing the voice there regenerates every clip on the next run.

## Phrase patterns

Each game builds its spoken text with one phrase builder (`phrase.ts` in the game, or
`src/games/_shared/letters/phrase.ts`); the voice catalog uses the same builders, so the
text in the app and the text that was recorded can't drift apart.

| What | Pattern | English | Arabic |
|---|---|---|---|
| Letter | `<name>! <Word>` (EN) / `<name>. <Word>` (AR) | `V! Van` | `كَاف. كُرَة` |
| Number | `<name>` | `three` | `ثَلاثة` |
| Animal | `<name>` | `Lion` | `أسد` |
| Colour goal | `<makeThisColor> <colour>` | `Make this color: Green` | `اِصنعْ هذا اللون: أخضر` |
| Trace-it warm-up / digit | `<name>` | `a zigzag` | `مَوْجَةْ` |

## Writing rules

Write the text **the way a reader would write it**. The voice gets that text, unchanged.

- **Never respell for pronunciation** (`cue`, `eks`, `Ay`). If a clip sounds wrong, re-roll
  it (`--redo`); the text stays correct.
- English letter name = the uppercase letter itself (`Q`), followed by `!` and the word with a
  capital (`Q! Queen`) — with a period the voice reads `V.` as "versus".
- Arabic letter name = the letter's written name (`كَاف`), never the bare glyph (`ك`) — the
  voice reads glyphs badly.
- Arabic strings that exist only to be spoken (letter names, example words, number names)
  carry full tashkeel. Strings also shown on screen (animal and colour names) stay as they
  are displayed; add tashkeel only if a clip keeps misreading them.
- Arabic spelling is always correct: `ة` not `هْ`, and no extra sukun on the last letter
  added only to coax a TTS engine. A sukun the word really takes is fine: «اِصنعْ», or a
  pausal «ةْ» when the full tashkeel reads better («مَوْجَةْ»).
- When a clip keeps misreading an Arabic word, add the vowel mark that disambiguates it
  (`صِفْر`, `تِسْعة`, `خطٌ`) — a correct spelling, not a respelling.
- Numbers are spelled as words, not digits.

`src/games/__tests__/voiceCatalog.test.ts` enforces the Arabic rules on every spoken phrase.

## Adding or changing a phrase

1. Edit the locale string (or add the phrase to the game's builder and to `src/games/voiceCatalog.ts`,
   tagged with where it's heard: `{ game, where }`).
2. `npm run voice:catalog` — rewrites `scripts/voice/catalog.json`.
3. `npm run voice:generate` — records only what's new or changed (key in `.env.local` as
   `GOOGLE_TTS_API_KEY`) and removes clips whose phrase is gone; `-- --dry-run` shows what it would do.
4. Listen in the studio (`npm run voice:studio`, below), or on `scripts/voice/.takes/review.html`
   and fix from the terminal:
   - `npm run voice:generate -- --pick "ar:كَاف. كُرَة=2"` — use take 2 instead
   - `npm run voice:generate -- --redo "ar:كَاف. كُرَة"` — record fresh takes
5. Commit the clips with `src/sdk/speech/clips.generated.ts` and `clips.lock.json`.

`src/games/__tests__/voiceClips.test.ts` fails if a spoken phrase has no clip, so a locale
edit can't silently fall back to the robot voice, and `speakCallSites.test.ts` fails if a game
passes `speak()` anything but a phrase builder's result.

## Reviewing in the Voice Studio

`npm run voice:studio` refreshes the catalog and opens a local page (http://localhost:4317, this
machine only) with every clip as a card: its text, where it's heard, its waveform and its takes.

- **Play all** (Space) plays everything in view back-to-back — or **Play this section** for one
  game — with an adjustable gap; ←/→ skip.
- Click **1 2 3** to hear a take, then **Use take N** to put it in the app.
- **Re-record** (or **Record** for a phrase with no clip) asks for 3 fresh takes; the cost in
  characters is shown first. **New / missing** at the top lists phrases with no clip yet, with
  **Record all**.
- **⚑ Flag** a clip with a note when picking a take doesn't fix it; Claude takes it from there.
- **Reload** re-reads everything from disk (e.g. after a CLI run). The studio never deletes
  clips; removing clips for phrases that are gone is the CLI's plain run.

The studio and the CLI share `scripts/voice/core.mjs`, so they record, pick and normalize the
same way. Tests: `npm run test:voice`.

## Fixing flagged clips

Flags live in `scripts/voice/flags.json` (committed): `{ "<clip key>": { note, at, reply?, repliedAt? } }`.
To work on them (Claude, when asked to "fix the flagged ones"):

1. Read each note; fix by re-recording (`--redo`), picking a take, or correcting the text
   (vowel marks, spelling — see the writing rules) and regenerating.
2. Add a short `reply` saying what changed, with `repliedAt` — `replyFlag()` in `core.mjs`, or
   edit the file.
3. Never remove a flag: the owner listens again and unflags it in the studio. (A flag whose
   phrase text changed is removed by the CLI's plain run, since its clip is gone.)

## Takes are random

The same text and settings give a different recording each time (one test: 1.40 s, 0.96 s,
1.12 s). The generator records `takes` versions of each phrase and keeps the one with the
median length — the short outliers are the rushed ones. A committed clip never changes
unless you `--pick` another take or `--redo` it.
