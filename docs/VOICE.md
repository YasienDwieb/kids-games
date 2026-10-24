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

1. Edit the locale string (or add the phrase to the game's builder and `src/games/voiceCatalog.ts`).
2. `npm run voice:catalog` — rewrites `scripts/voice/catalog.json`.
3. `npm run voice:generate` — records only what's new or changed (key in `.env.local` as
   `GOOGLE_TTS_API_KEY`); `-- --dry-run` shows what it would do.
4. Open `scripts/voice/.takes/review.html`, listen, then fix any take you don't like:
   - `npm run voice:generate -- --pick "ar:كَاف. كُرَة=2"` — use take 2 instead
   - `npm run voice:generate -- --redo "ar:كَاف. كُرَة"` — record fresh takes
5. Commit the clips with `src/sdk/speech/clips.generated.ts` and `clips.lock.json`.

`src/games/__tests__/voiceClips.test.ts` fails if a spoken phrase has no clip, so a locale
edit can't silently fall back to the robot voice, and `speakCallSites.test.ts` fails if a game
passes `speak()` anything but a phrase builder's result.

## Takes are random

The same text and settings give a different recording each time (one test: 1.40 s, 0.96 s,
1.12 s). The generator records `takes` versions of each phrase and keeps the one with the
median length — the short outliers are the rushed ones. A committed clip never changes
unless you `--pick` another take or `--redo` it.
