import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * Every phrase a game speaks must come from a phrase builder (docs/VOICE.md), so
 * voiceCatalog lists it and voiceClips.test.ts can demand a clip for it. A speak()
 * fed raw text would quietly fall back to the device voice.
 *
 * Source inspection, like never-muted.test.ts.
 */
const GAMES = join(__dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** The first argument of each `speak(` call that isn't a phrase builder's result. */
function rawSpeakCalls(source: string): string[] {
  // `text` destructured from a builder, e.g. `const { text, lang } = charPhrase(char)`.
  const builtNames = [...source.matchAll(/const \{ ([^}]+) \} = \w+Phrase\(/g)].flatMap((m) =>
    m[1].split(',').map((n) => n.trim()),
  );
  return [...source.matchAll(/\bspeak\(([^,)]*(?:\([^)]*\))?[^,)]*)/g)]
    .map((m) => m[1].trim())
    .filter((arg) => !/^\w+Phrase\(/.test(arg) && !builtNames.includes(arg));
}

it('flags raw text and accepts builder results', () => {
  expect(rawSpeakCalls("void speak(t('animal-safari:names.' + id));")).toEqual(["t('animal-safari:names.' + id"]);
  expect(rawSpeakCalls('void speak(letterPhrase(target, currentLanguage()));')).toEqual([]);
  expect(rawSpeakCalls('const { text, lang } = charPhrase(char);\nvoid speak(text, { language: lang });')).toEqual([]);
});

it('every game speaks only phrase-builder text', () => {
  const offenders = sources(GAMES).flatMap((file) =>
    rawSpeakCalls(readFileSync(file, 'utf8')).map((arg) => `${relative(GAMES, file)}: speak(${arg}`),
  );
  expect(offenders).toEqual([]);
});
