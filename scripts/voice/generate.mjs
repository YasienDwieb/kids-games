// Bundled voice clips: scripts/voice/catalog.json → Google Chirp 3 HD takes →
// normalized .m4a clips + src/sdk/speech/clips.generated.ts. See docs/VOICE.md.
//
//   npm run voice:generate                         # record what's new or changed
//   npm run voice:generate -- --dry-run            # show what would be recorded
//   npm run voice:generate -- --redo "<key>"       # fresh takes for a clip
//   npm run voice:generate -- --pick "<key>=<n>"   # use take n instead
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, paths, pickTake, prune, readState, recordTakes, status } from './core.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ctx = { root: ROOT };

const esc = (s) => s.replace(/[<&>"]/g, (c) => `&#${c.charCodeAt(0)};`);

function writeReview(rows, takesDir) {
  const body = rows
    .map(({ key, takes, chosen }) => {
      const cells = takes
        .map((t) => `<td class="${t.n === chosen ? 'chosen' : ''}"><audio controls preload="none" src="${relative(takesDir, t.file)}"></audio><br>take ${t.n}${t.n === chosen ? ' ✓' : ''}</td>`)
        .join('');
      const cmd = `npm run voice:generate -- --pick "${key}=N"`;
      return `<tr><th dir="auto">${esc(key)}</th>${cells}<td><code>${esc(cmd)}</code><br><code>npm run voice:generate -- --redo "${esc(key)}"</code></td></tr>`;
    })
    .join('\n');
  writeFileSync(
    join(takesDir, 'review.html'),
    `<!doctype html><meta charset="utf-8"><title>Voice clips review</title>
<style>body{font:15px system-ui;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px;vertical-align:middle}
th{text-align:start;font-size:18px}.chosen{background:#e6f4e6}audio{width:150px}code{font-size:12px}</style>
<h1>Voice clips review</h1><p>✓ = the take in the app. Listen, then copy a command to swap or re-record — or use <code>npm run voice:studio</code>.</p>
<table>${body}</table>`,
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { config, lines } = readState(ctx);
  for (const k of [...args.redo, ...args.pick.keys()]) if (!lines.has(k)) throw new Error(`not in catalog: ${k}`);

  // --redo / --pick touch only the clips they name; a plain run fills in what's missing or stale.
  const targeted = args.redo.size > 0 || args.pick.size > 0;
  const todo = status(ctx).filter((c) => (targeted ? args.redo.has(c.key) : c.state !== 'ok'));
  if (args.dryRun) {
    todo.forEach((c) => console.log(`record  ${c.key}`));
    console.log(`${todo.length} clip(s) × ${config.takes} takes, ${todo.reduce((n, c) => n + c.chars, 0)} characters`);
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

  const { written, failed } = await recordTakes(ctx, todo.map((c) => c.key), () => process.stdout.write('.'));
  for (const [key, n] of args.pick) {
    try {
      pickTake(ctx, key, n);
      written.push(key);
    } catch (e) {
      failed.push(`${key}: ${e.message}`);
    }
  }
  if (!targeted) for (const key of prune(ctx)) console.log(`\nremoved ${key}`);

  // The review page always shows every clip, newest run first.
  const all = status(ctx).filter((c) => c.clip);
  const touched = new Set(written);
  writeReview(
    [...all.filter((c) => touched.has(c.key)), ...all.filter((c) => !touched.has(c.key))].map((c) => ({ key: c.key, takes: c.takes, chosen: c.clip.take })),
    paths(ROOT).takes,
  );

  console.log(`\n${written.length} clip(s) written, ${all.length} total.`);
  console.log(`Review: ${join(paths(ROOT).takes, 'review.html')} (or npm run voice:studio)`);
  if (failed.length) {
    console.error(`${failed.length} failure(s):\n  ${failed.join('\n  ')}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
