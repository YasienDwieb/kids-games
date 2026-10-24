// Bundled voice clips: scripts/voice/catalog.json → Google Chirp 3 HD takes →
// normalized .m4a clips + src/sdk/speech/clips.generated.ts. See docs/VOICE.md.
//
//   npm run voice:generate                         # record what's new or changed
//   npm run voice:generate -- --dry-run            # show what would be recorded
//   npm run voice:generate -- --redo "<key>"       # fresh takes for a clip
//   npm run voice:generate -- --pick "<key>=<n>"   # use take n instead
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'scripts/voice/voice.config.json'), 'utf8'));
const CATALOG = JSON.parse(readFileSync(join(ROOT, 'scripts/voice/catalog.json'), 'utf8'));
const CLIP_DIR = join(ROOT, 'src/sdk/assets/audio/speech');
const TAKES_DIR = join(ROOT, 'scripts/voice/.takes');
const LOCK = join(ROOT, 'src/sdk/speech/clips.lock.json');
const MAP = join(ROOT, 'src/sdk/speech/clips.generated.ts');
const CONCURRENCY = 8;

// Same rule as src/sdk/speech/clipKey.ts (voiceClips.test.ts catches drift).
const clipKey = (lang, text) => `${lang}:${text.normalize('NFC').trim()}`;
const slug = (key) => `${key.slice(0, 2)}-${createHash('sha1').update(key).digest('hex').slice(0, 10)}`;

function parseArgs(argv) {
  const args = { dryRun: false, redo: new Set(), pick: new Map() };
  const value = (flag, i) => {
    if (argv[i] === undefined || argv[i].startsWith('--')) throw new Error(`${flag} needs a value, e.g. ${flag} "ar:كَاف. كُرَة"`);
    return argv[i];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--redo') args.redo.add(value(a, ++i).normalize('NFC').trim());
    else if (a === '--pick') {
      const m = value(a, ++i).match(/^(.+)=([1-9]\d*)$/);
      if (!m) throw new Error(`--pick takes "<key>=<take number>", e.g. --pick "ar:كَاف. كُرَة=2"`);
      args.pick.set(m[1].normalize('NFC').trim(), Number(m[2]));
    } else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

// Google rate-limits Chirp per minute; wait it out instead of failing the run.
async function synthesize(lang, text, attempt = 1) {
  try {
    return await request(lang, text);
  } catch (e) {
    if (!e.message.startsWith('HTTP 429') || attempt >= 6) throw e;
    await new Promise((r) => setTimeout(r, 15000 * attempt));
    return synthesize(lang, text, attempt + 1);
  }
}

async function request(lang, text) {
  const voice = CONFIG.voices[lang];
  // Key in a header, not the URL, so it stays out of proxy and access logs.
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': process.env.GOOGLE_TTS_API_KEY },
    body: JSON.stringify({ input: { text }, voice: { languageCode: voice.split('-').slice(0, 2).join('-'), name: voice }, audioConfig: { audioEncoding: 'MP3' } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from((await res.json()).audioContent, 'base64');
}

async function pool(jobs, limit) {
  const queue = [...jobs];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await queue.shift()();
  }));
}

const ffmpeg = (args) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
const duration = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

/** Mean volume of the speech only (silence trimmed), like the SFX "active RMS". */
function activeDb(file) {
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB:stop_duration=0.1';
  const out = execFileSync('sh', ['-c', `ffmpeg -v info -i "${file}" -af "${trim},volumedetect" -f null - 2>&1 | grep mean_volume || true`]).toString();
  const m = out.match(/(-?[\d.]+) dB/);
  if (!m) throw new Error(`no audio level for ${file}`);
  return Number(m[1]);
}

/** Normalize a take into the committed clip. */
function finalize(take, out) {
  const gain = CONFIG.loudness.rmsDb - activeDb(take);
  const limit = (10 ** (CONFIG.loudness.peakDb / 20)).toFixed(3);
  const { sampleRate, codec, bitrate } = CONFIG.format;
  ffmpeg(['-i', take, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit}:level=false`, '-ac', '1', '-ar', String(sampleRate), '-c:a', codec, '-b:a', bitrate, out]);
}

/** A clip's takes as { n, file }, numbered by file name (take-3.mp3 is take 3 even if take 2 failed). */
const takeFiles = (key, dir = join(TAKES_DIR, slug(key))) =>
  existsSync(dir)
    ? readdirSync(dir)
        .map((f) => ({ n: Number(f.match(/^take-(\d+)\.mp3$/)?.[1]), file: join(dir, f) }))
        .filter((t) => t.n > 0)
        .sort((a, b) => a.n - b.n)
    : [];

const esc = (s) => s.replace(/[<&>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function writeReview(rows) {
  const body = rows
    .map(({ key, takes, chosen }) => {
      const cells = takes
        .map((t) => `<td class="${t.n === chosen ? 'chosen' : ''}"><audio controls preload="none" src="${relative(TAKES_DIR, t.file)}"></audio><br>take ${t.n}${t.n === chosen ? ' ✓' : ''}</td>`)
        .join('');
      const cmd = `npm run voice:generate -- --pick "${key}=N"`;
      return `<tr><th dir="auto">${esc(key)}</th>${cells}<td><code>${esc(cmd)}</code><br><code>npm run voice:generate -- --redo "${esc(key)}"</code></td></tr>`;
    })
    .join('\n');
  writeFileSync(
    join(TAKES_DIR, 'review.html'),
    `<!doctype html><meta charset="utf-8"><title>Voice clips review</title>
<style>body{font:15px system-ui;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px;vertical-align:middle}
th{text-align:start;font-size:18px}.chosen{background:#e6f4e6}audio{width:150px}code{font-size:12px}</style>
<h1>Voice clips review</h1><p>✓ = the take in the app. Listen, then copy a command to swap or re-record.</p>
<table>${body}</table>`,
  );
}

function writeMap(lock) {
  const lines = Object.keys(lock)
    .sort()
    .map((k) => `  ${JSON.stringify(k)}: require('../assets/audio/speech/${lock[k].file}'),`);
  writeFileSync(
    MAP,
    `// Generated by scripts/voice/generate.mjs — do not edit.\n// Bundled voice clips keyed by clipKey(lang, text); see docs/VOICE.md.\nexport const CLIPS: Record<string, number> = {\n${lines.join('\n')}${lines.length ? '\n' : ''}};\n`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {};
  const lines = new Map(CATALOG.map((l) => [clipKey(l.lang, l.text), l]));
  for (const k of [...args.redo, ...args.pick.keys()]) if (!lines.has(k)) throw new Error(`not in catalog: ${k}`);

  // --redo / --pick touch only the clips they name; a plain run fills in what's missing or stale.
  const targeted = args.redo.size > 0 || args.pick.size > 0;
  const todo = [...lines].filter(([k, l]) =>
    targeted ? args.redo.has(k) : !lock[k] || lock[k].voice !== CONFIG.voices[l.lang],
  );
  const chars = todo.reduce((n, [, l]) => n + l.text.length * CONFIG.takes, 0);
  if (args.dryRun) {
    todo.forEach(([k]) => console.log(`record  ${k}`));
    console.log(`${todo.length} clip(s) × ${CONFIG.takes} takes, ${chars} characters`);
    return;
  }
  for (const tool of ['ffmpeg', 'ffprobe']) {
    try {
      execFileSync(tool, ['-version'], { stdio: 'ignore' });
    } catch {
      console.error(`${tool} is required (install ffmpeg) — nothing was recorded.`);
      process.exit(1);
    }
  }
  if (todo.length && !process.env.GOOGLE_TTS_API_KEY) {
    console.error('GOOGLE_TTS_API_KEY is not set — add it to .env.local (see docs/VOICE.md).');
    process.exit(1);
  }

  mkdirSync(CLIP_DIR, { recursive: true });
  const review = [];
  const failed = [];

  // Record takes into a fresh folder; the old takes stay until the new set is accepted.
  const jobs = [];
  const fresh = (key) => join(TAKES_DIR, `${slug(key)}.new`);
  for (const [key, l] of todo) {
    const dir = fresh(key);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (let n = 1; n <= CONFIG.takes; n++) {
      jobs.push(async () => {
        try {
          writeFileSync(join(dir, `take-${n}.mp3`), await synthesize(l.lang, l.text));
        } catch (e) {
          failed.push(`${key} take ${n}: ${e.message}`);
        }
      });
    }
  }
  await pool(jobs, CONCURRENCY);

  // A clip already in the app is only replaced by a full set of takes; a new
  // phrase takes whatever was recorded (better than the device voice).
  const accepted = [];
  for (const [key] of todo) {
    const got = takeFiles(key, fresh(key)).length;
    if (got === CONFIG.takes || (!lock[key] && got > 0)) {
      rmSync(join(TAKES_DIR, slug(key)), { recursive: true, force: true });
      renameSync(fresh(key), join(TAKES_DIR, slug(key)));
      accepted.push(key);
    } else {
      rmSync(fresh(key), { recursive: true, force: true });
      if (lock[key]) failed.push(`${key}: only ${got}/${CONFIG.takes} takes recorded — kept the current clip`);
    }
  }

  // A clip and its lock entry change together, and one bad take never stops the
  // run before the lock and map are written.
  const install = (key, takes, n) => {
    const file = `${slug(key)}.m4a`;
    try {
      const take = takes.find((t) => t.n === n);
      if (!take) throw new Error(`no take ${n} (have ${takes.map((t) => t.n).join(', ') || 'none'}; run --redo first)`);
      finalize(take.file, join(CLIP_DIR, file));
      lock[key] = { file, voice: CONFIG.voices[lines.get(key).lang], take: n, durationS: Number(duration(join(CLIP_DIR, file)).toFixed(2)), generatedAt: new Date().toISOString().slice(0, 10) };
      review.push({ key, takes, chosen: n });
    } catch (e) {
      failed.push(`${key}: ${e.message}`);
    }
  };

  // Auto-pick the median-length take; outliers are the rushed or drawn-out ones.
  for (const key of accepted) {
    const takes = takeFiles(key);
    const byLength = takes.map((t) => ({ n: t.n, d: duration(t.file) })).sort((a, b) => a.d - b.d);
    install(key, takes, byLength[Math.floor((byLength.length - 1) / 2)].n);
    process.stdout.write('.');
  }

  // Manual picks.
  for (const [key, n] of args.pick) install(key, takeFiles(key), n);

  // Drop clips whose phrase left the catalog.
  for (const key of Object.keys(lock)) {
    if (lines.has(key)) continue;
    rmSync(join(CLIP_DIR, lock[key].file), { force: true });
    delete lock[key];
    console.log(`\nremoved ${key}`);
  }

  const sorted = Object.fromEntries(Object.keys(lock).sort().map((k) => [k, lock[k]]));
  writeFileSync(LOCK, JSON.stringify(sorted, null, 1) + '\n');
  writeMap(sorted);
  // The review page always shows every clip, newest run first.
  const touched = new Set(review.map((r) => r.key));
  writeReview([
    ...review,
    ...Object.keys(sorted)
      .filter((k) => !touched.has(k))
      .map((key) => ({ key, takes: takeFiles(key), chosen: sorted[key].take })),
  ]);

  console.log(`\n${review.length} clip(s) written, ${Object.keys(sorted).length} total.`);
  console.log(`Review: ${join(TAKES_DIR, 'review.html')}`);
  if (failed.length) {
    console.error(`${failed.length} failure(s):\n  ${failed.join('\n  ')}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
