// Voice Studio: a local page to listen to every voice clip, pick or re-record takes,
// record missing phrases and flag clips for Claude. See docs/VOICE.md.
//
//   npm run voice:studio
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paths, pickTake, recordTakes, setFlag, slug, status, readState } from './core.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const LISTEN_HOST = '127.0.0.1';
const PORT = 4317;
const PAGE_FILES = { '/': ['index.html', 'text/html; charset=utf-8'], '/sections.mjs': ['sections.mjs', 'text/javascript; charset=utf-8'], '/queue.mjs': ['queue.mjs', 'text/javascript; charset=utf-8'] };
const CLIP_RE = /^[a-z]{2}-[0-9a-f]{10}\.m4a$/;
const SLUG_RE = /^[a-z]{2}-[0-9a-f]{10}$/;

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function sendFile(res, file, type) {
  if (!existsSync(file)) return send(res, 404, { error: 'not found' });
  // Headers wait for a successful open: a take folder can be swapped mid-recording.
  createReadStream(file)
    .on('open', function () {
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      this.pipe(res);
    })
    .on('error', () => (res.headersSent ? res.destroy() : send(res, 404, { error: 'not found' })));
}

/**
 * Only the studio's own page may talk to it: a web page elsewhere could otherwise
 * POST here (a "simple" text/plain request needs no preflight) and re-record clips,
 * spend quota or plant flag notes — or read state through DNS rebinding.
 */
function isOwnPage(req, port) {
  const host = req.headers.host ?? '';
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return false;
  const origin = req.headers.origin;
  if (origin && origin !== `http://${host}`) return false;
  return req.method !== 'POST' || (req.headers['content-type'] ?? '').startsWith('application/json');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 64 * 1024) {
        req.destroy(); // stop reading; nothing this page sends is that big
        reject(new Error('body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('invalid JSON'));
      }
    });
  });
}

/** The clips as the page sees them: no absolute paths, just take numbers. */
const pageClips = (ctx) => status(ctx).map(({ takes, ...c }) => ({ ...c, slug: slug(c.key), takes: takes.map((t) => t.n) }));

/**
 * The studio's HTTP server (not yet listening). keyReady says whether recording
 * can reach Google; the key itself never reaches the page.
 */
export function createStudioServer({ root, synthesize, warning = null, keyReady }) {
  const ctx = { root, synthesize };
  let job = { running: false, keys: [], total: 0, done: 0, takesDone: 0, takesTotal: 0, current: null, written: [], failed: [] };

  const server = createServer(async (req, res) => {
    if (!isOwnPage(req, server.address()?.port)) return send(res, 403, { error: 'forbidden' });
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname;
    try {
      if (req.method === 'GET' && PAGE_FILES[route]) {
        const [file, type] = PAGE_FILES[route];
        return sendFile(res, join(HERE, 'studio', file), type);
      }
      if (req.method === 'GET' && route === '/api/state') {
        const { games, config } = readState(ctx);
        return send(res, 200, { games, takes: config.takes, clips: pageClips(ctx), warning, keyReady, job });
      }
      if (req.method === 'GET' && route === '/api/job') return send(res, 200, job);

      const audio = route.match(/^\/audio\/(clip|take)\/(.+)$/);
      if (req.method === 'GET' && audio) {
        const parts = audio[2].split('/');
        if (audio[1] === 'clip' && parts.length === 1 && CLIP_RE.test(parts[0])) {
          return sendFile(res, join(paths(root).clips, parts[0]), 'audio/mp4');
        }
        if (audio[1] === 'take' && parts.length === 2 && SLUG_RE.test(parts[0]) && /^\d+$/.test(parts[1])) {
          return sendFile(res, join(paths(root).takes, parts[0], `take-${parts[1]}.mp3`), 'audio/mpeg');
        }
        return send(res, 404, { error: 'not found' });
      }

      if (req.method === 'POST' && route === '/api/pick') {
        const { key, n } = await readBody(req);
        if (typeof key !== 'string' || !Number.isInteger(n)) return send(res, 400, { error: 'pick needs { key, n }' });
        if (job.running) return send(res, 409, { error: 'a recording is running — try again when it finishes' });
        try {
          return send(res, 200, { ok: true, clip: pickTake(ctx, key, n) });
        } catch (e) {
          return send(res, 400, { error: e.message });
        }
      }

      if (req.method === 'POST' && route === '/api/record') {
        const { keys } = await readBody(req);
        if (!keyReady) return send(res, 400, { error: 'GOOGLE_TTS_API_KEY is not set — add it to .env.local and restart the studio.' });
        if (!Array.isArray(keys) || !keys.length || !keys.every((k) => typeof k === 'string')) return send(res, 400, { error: 'record needs { keys: [...] }' });
        if (job.running) return send(res, 409, { error: 'a recording is already running' });
        const unique = [...new Set(keys)];
        job = { running: true, keys: unique, total: unique.length, done: 0, takesDone: 0, takesTotal: 0, current: unique[0], written: [], failed: [] };
        recordTakes(ctx, unique, (p) => {
          if (p.phase === 'takes') Object.assign(job, { takesDone: p.done, takesTotal: p.total });
          else Object.assign(job, { done: p.done, current: unique[p.done] ?? null });
        })
          .then(({ written, failed }) => Object.assign(job, { written, failed }))
          .catch((e) => job.failed.push(e.message))
          .finally(() => Object.assign(job, { running: false, current: null }));
        return send(res, 202, job);
      }

      if (req.method === 'POST' && route === '/api/flag') {
        const { key, note } = await readBody(req);
        if (typeof key !== 'string' || !(note === null || typeof note === 'string')) return send(res, 400, { error: 'flag needs { key, note }' });
        setFlag(ctx, key, note === null ? null : note.trim());
        return send(res, 200, { ok: true });
      }

      return send(res, 404, { error: 'not found' });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  });
  return server;
}

/**
 * Refresh catalog.json from the games. On failure, say why: a writing-rule test can
 * fail after the catalog was written, a build error before — either way, check first.
 */
export function refreshCatalog(run = spawnSync) {
  const res = run('npm', ['run', 'voice:catalog'], { cwd: ROOT, encoding: 'utf8', timeout: 120000 });
  if (res.status === 0) return null;
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`.trim().split('\n').slice(-20).join('\n');
  return `The catalog refresh failed (a writing rule or a build error) — new or changed phrases may be missing or wrong here. Fix it and restart the studio before recording.\n\n${out || (res.error ? res.error.message : '')}`;
}

/** Listen on 127.0.0.1 only, trying the next port when one is taken. Resolves to the port. */
export function listen(server, port, tries = 20) {
  return new Promise((resolve, reject) => {
    server.once('error', (e) => {
      if (e.code === 'EADDRINUSE' && tries > 0) resolve(listen(server, port + 1, tries - 1));
      else reject(e);
    });
    server.listen(port, LISTEN_HOST, () => resolve(server.address().port));
  });
}

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : ['xdg-open', [url]];
  try {
    spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  } catch {
    // the URL is printed anyway
  }
}

async function main() {
  console.log('Refreshing the voice catalog…');
  const warning = refreshCatalog();
  if (warning) console.warn(warning);
  const server = createStudioServer({ root: ROOT, warning, keyReady: Boolean(process.env.GOOGLE_TTS_API_KEY) });
  const port = await listen(server, PORT);
  const url = `http://localhost:${port}`;
  console.log(`Voice Studio: ${url}  (Ctrl+C to stop)`);
  openBrowser(url);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
