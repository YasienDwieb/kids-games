// Renders Animal Safari's sprite sheets (src/games/animal-safari/assets/sprites)
// from its 3D models with three.js in a browser — no Blender needed:
//
//   node scripts/3d/safari_sprites/server.mjs
//   open http://localhost:5781, then in the console: await renderAll()
//   (or renderAll(['lion']) for one, preview('lion') to see the sheet)
//
// Routes:
//   /            -> render.html (this folder)
//   /p/<path>    -> project files (models, node_modules/three)
//   POST /save?name=<id>  -> writes the WebP body to OUT_DIR/<id>.webp
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '../../..');
const OUT_DIR = path.join(ROOT, 'src/games/animal-safari/assets/sprites');
const PORT = 5781;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (req.method === 'POST' && url.pathname === '/save') {
      const name = url.searchParams.get('name') ?? '';
      if (!/^[a-z]+$/.test(name)) return res.writeHead(400).end('bad name');
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        fs.mkdirSync(OUT_DIR, { recursive: true });
        fs.writeFileSync(path.join(OUT_DIR, `${name}.webp`), Buffer.concat(chunks));
        res.writeHead(200).end('ok');
      });
      return;
    }
    let file;
    if (url.pathname === '/') file = path.join(HERE, 'render.html');
    else if (url.pathname.startsWith('/p/')) file = path.join(ROOT, decodeURIComponent(url.pathname.slice(3)));
    if (!file || !file.startsWith(ROOT) && !file.startsWith(HERE) || !fs.existsSync(file)) {
      return res.writeHead(404).end('not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`sprite server on http://localhost:${PORT}`));
