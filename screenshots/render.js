// Composes raw captures into the store galleries + feature graphic.
//
//   node screenshots/render.js
//
// Reads  screenshots/out/raw/<lang>/{phone,tablet,ipad}/<scene>.png (+ .txt)
// Writes screenshots/out/store/<lang>/<form>/NN.png, <form>-panorama.png and
//        screenshots/out/store/<lang>/featureGraphic.png
//
// Each gallery is one wide canvas sliced into frames, so Lulu's star trail
// runs across every seam. Colours and fonts are the app's Pop Quest tokens.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const RAW = path.join(OUT, 'raw');
const BUILD = path.join(OUT, '.build');

// src/constants/colors.ts
const T = {
  zap: '#FFE135', zapDeep: '#F5C400', ink: '#1B1B2F', inkSoft: '#55516B', surface: '#FFFFFF',
  grape: '#7B4DFF', bubblegum: '#FF4FA3', splash: '#2EC4F1', lime: '#7DDB3C', gold: '#FFC61A',
};

const NM = path.join(ROOT, 'node_modules/@expo-google-fonts');
const font = (pkg, file) => `file://${NM}/${pkg}/${file.split('_')[1].replace('.ttf', '')}/${file}`;
const fontFaces = `
@font-face { font-family: 'Display'; src: url('${font('lilita-one', 'LilitaOne_400Regular.ttf')}'); }
@font-face { font-family: 'Body'; font-weight: 800; src: url('${font('nunito', 'Nunito_800ExtraBold.ttf')}'); }
@font-face { font-family: 'DisplayAr'; src: url('${font('baloo-bhaijaan-2', 'BalooBhaijaan2_800ExtraBold.ttf')}'); }
@font-face { font-family: 'BodyAr'; font-weight: 700; src: url('${font('ibm-plex-sans-arabic', 'IBMPlexSansArabic_700Bold.ttf')}'); }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { overflow: hidden; }
`;
const MASCOT = (pose) => `file://${ROOT}/src/sdk/assets/images/mascot/owl-${pose}.png`;

// Store canvases. raw = which capture form feeds it.
// raw = which capture form feeds it, max = the store's frame cap.
const FORMS = {
  'play-phone': { W: 1920, H: 1080, raw: 'phone', max: 8, extras: false },
  'play-tablet': { W: 2560, H: 1600, raw: 'tablet', max: 8 },
  'ios-phone': { W: 2796, H: 1290, raw: 'phone', max: 10 },
  'ios-ipad': { W: 2752, H: 2064, raw: 'ipad', max: 10 },
};

// ================= content =================

const texts = (lang, form, scene) => {
  const file = path.join(RAW, lang, form, `${scene}.txt`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').map(decode) : [];
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const firstMatch = (lines, re) => lines.map((l) => l.match(re)).find(Boolean);

/** Figures lifted from the captured screens so captions match the shots. */
function facts(lang, form) {
  const home = texts(lang, form, 'home');
  const level = firstMatch(home, /^(\d+)$/)?.[1] ?? '';
  const stars = firstMatch(home, /^(\d{2,})$/)?.[1] ?? '';
  return { level, stars };
}

// Frame backgrounds: brand yellow for the bookends, the game's ACCENTS family
// (src/constants/colors.ts) for each game frame. [stripe, band]
const BG = {
  zap: [T.zap, T.zapDeep], blue: ['#2EC4F1', '#0FA5D4'], coral: ['#FF6B5E', '#E84B3D'],
  green: ['#7DDB3C', '#5CB81E'], orange: ['#FFA51F', '#E58600'], purple: ['#9B7BFF', '#7B4DFF'],
};

// extra = App Store / tablet filler: dropped from Play phone, and from any
// gallery over its store's frame cap.
const COPY = {
  en: {
    dir: 'ltr',
    scenes: (f) => [
      { shot: 'home', title: 'Big, bright games for little hands', line: 'No ads · No reading needed', pose: 'wave', bg: 'zap' },
      { shot: 'pairs', title: 'Every win gets a party!', line: 'Stars, cheers and confetti', bg: 'green' },
      { shot: 'letters', title: 'Hear it, then find the letter', line: 'In English & Arabic', bg: 'blue' },
      { shot: 'turbo', title: 'Steer, race and grab the coins', line: 'Simple finger steering', bg: 'coral' },
      { shot: 'mixer', title: 'Mix colors, make new ones', line: 'All the fun of paint, none of the mess', bg: 'blue', phoneOnly: true },
      { shot: 'wardrobe', title: 'Earn stars, dress up Lulu', line: `★ ${f.stars} stars · Level ${f.level}`, pose: 'cheer', phoneOnly: true, bg: 'orange' },
      { shot: 'matchup', title: 'Connect what belongs together', line: 'Little puzzles, big thinking', bg: 'purple' },
      { shot: 'numbers', title: 'Count it, then tap the number', line: 'Early maths, one tap at a time', bg: 'orange', extra: true },
      { shot: 'maze', title: 'Guide the mouse to the cheese', line: 'Puzzles that grow with them', bg: 'green', extra: true },
      { shot: 'parents', title: 'Grown-ups set the daily limit', line: 'Play time and stars, game by game', pose: 'point', bg: 'zap' },
    ],
    word: 'Kids Zone',
    tagline: 'Fun, safe games for little kids',
  },
  ar: {
    dir: 'rtl',
    // Letters leads the Arabic set: Arabic-first kids' content is the hook.
    scenes: (f) => [
      { shot: 'home', title: 'ألعاب كبيرة ومبهجة لأيادٍ صغيرة', line: 'بلا إعلانات · لا تحتاج إلى قراءة', pose: 'wave', bg: 'zap' },
      { shot: 'letters', title: 'اسمع، ثم اعثر على الحرف', line: 'بالعربية والإنجليزية', bg: 'blue' },
      { shot: 'pairs', title: 'كل فوز له احتفال!', line: 'نجوم وتصفيق وقصاصات ملوّنة', bg: 'green' },
      { shot: 'turbo', title: 'قُد وتسابق واجمع العملات', line: 'قيادة سهلة بإصبع واحد', bg: 'coral' },
      { shot: 'mixer', title: 'امزج الألوان واصنع ألوانًا جديدة', line: 'متعة الرسم بلا فوضى', bg: 'blue', phoneOnly: true },
      { shot: 'wardrobe', title: 'اجمع النجوم وألبِس لولو', line: `★ ${f.stars} نجمة · المستوى ${f.level}`, pose: 'cheer', phoneOnly: true, bg: 'orange' },
      { shot: 'matchup', title: 'صِل كل شيء بما يناسبه', line: 'ألغاز صغيرة وتفكير كبير', bg: 'purple' },
      { shot: 'numbers', title: 'عُدّ، ثم اختر الرقم', line: 'حساب مبكر بلمسة واحدة', bg: 'orange', extra: true },
      { shot: 'maze', title: 'ساعد الفأر للوصول إلى الجبن', line: 'ألغاز تكبر مع طفلك', bg: 'green', extra: true },
      { shot: 'parents', title: 'الكبار يحدّدون وقت اللعب', line: 'وقت اللعب والنجوم لكل لعبة', pose: 'point', bg: 'zap' },
    ],
    word: 'Kids Zone', // the brand stays Latin in the Arabic listing title
    tagline: 'ألعاب ممتعة وآمنة للأطفال الصغار',
  },
};

// ================= pieces =================

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const img = (lang, form, shot) => `file://${path.join(RAW, lang, form, `${shot}.png`)}`;
const rawSize = (lang, form, shot) =>
  execFileSync('magick', ['identify', '-format', '%w %h', path.join(RAW, lang, form, `${shot}.png`)]).toString().split(' ').map(Number);

/** Chunky Pop Quest device: ink bezel, hard offset ink shadow, no blur. */
function device(src, w, h, k) {
  const bezel = Math.round(k * 22), radius = Math.round(k * 64);
  return `<div class="device" style="width:${w + bezel * 2}px;height:${h + bezel * 2}px;padding:${bezel}px;border-radius:${radius}px;
    box-shadow:${k * 14}px ${k * 16}px 0 ${T.ink}">
    <div class="screen" style="border-radius:${radius - bezel}px"><img src="${src}"></div></div>`;
}
const deviceCss = `
.device { background: ${T.ink}; position: relative; }
.screen { overflow: hidden; width: 100%; height: 100%; background: #fff; }
.screen img { display: block; width: 100%; height: 100%; }
`;

/** Five-point star path centred on (0,0), radius r. */
const starPath = (r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.48 : r;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};

/**
 * The motif: Lulu's star trail — a dashed ink path weaving behind every
 * device and across every seam, studded with the stars kids collect.
 */
function trail(total, H, n, W) {
  const k = H / 1080;
  const mid = H * 0.62, amp = H * 0.3;
  let d = `M ${-W * 0.1} ${mid}`;
  const stars = [];
  for (let i = 0; i <= n; i++) {
    const x = i * W, up = i % 2 ? -amp : amp;
    d += ` C ${x + W * 0.25} ${mid + up}, ${x + W * 0.75} ${mid - up}, ${x + W} ${mid}`;
  }
  // Stars sit on the trail in the frame margins and on the seams.
  for (let i = 0; i < n; i++) {
    for (const t of [0.02, 0.98]) stars.push({ x: (i + t) * W, i, t });
  }
  const bez = (x) => {
    // Evaluate the cubic for the segment containing x (x-param ≈ t, good enough for placement).
    const i = Math.floor(x / W), t = x / W - i, up = i % 2 ? -amp : amp;
    const y0 = mid, y1 = mid + up, y2 = mid - up, y3 = mid;
    const u = 1 - t;
    return u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
  };
  const colors = [T.gold, T.bubblegum, T.splash, T.lime];
  const starEls = stars.map(({ x }, j) => {
    const y = bez(x), r = (j % 3 === 0 ? 44 : 32) * k;
    return `<path d="${starPath(r)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(j * 23) % 40 - 20})"
      fill="${colors[j % colors.length]}" stroke="${T.ink}" stroke-width="${6 * k}" stroke-linejoin="round"/>`;
  }).join('');
  return `<svg class="motif" width="${total}" height="${H}" viewBox="0 0 ${total} ${H}">
    <path d="${d}" fill="none" stroke="${T.ink}" stroke-width="${10 * k}" stroke-linecap="round" stroke-dasharray="${2 * k} ${30 * k}"/>
    ${starEls}</svg>`;
}

// ================= pages =================

function galleryPage(lang, formName, list) {
  const { W, H, raw } = FORMS[formName];
  const copy = COPY[lang];
  const rtl = copy.dir === 'rtl';
  const total = W * list.length;
  const k = H / 1080;
  // Text scales with the tighter of width and height so 4:3 / 16:10 canvases don't clip.
  const tk = Math.min(H / 1080, W / 1920);
  // Landscape: headline band on top, device filling the rest.
  const [rw, rh] = rawSize(lang, raw, list[0].shot);
  // Device sits between the caption band (top 27%) and a 5% bottom margin,
  // narrow enough that the trail shows on both sides.
  const devTop = H * 0.27, avail = H * 0.95 - devTop;
  const chrome = (h) => (h / 700) * (22 * 2 + 16); // bezel both sides + hard shadow
  let sh = avail - chrome(avail);
  sh = Math.min(sh, W * 0.8 * (rh / rw));
  const sw = sh * (rw / rh);
  const dk = sh / 700; // device chrome scale
  const head = rtl ? 'DisplayAr' : 'Display', body = rtl ? 'BodyAr' : 'Body';
  const bgs = list.map((sc, i) => {
    const [a, b] = BG[sc.bg ?? 'zap'];
    return `<div class="bg" style="left:${i * W}px;background:repeating-linear-gradient(115deg, ${a} 0 ${220 * k}px, ${b}55 ${220 * k}px ${330 * k}px), ${a}"></div>`;
  }).join('');
  const frames = list.map((sc, i) => `
    <section class="frame" style="left:${i * W}px">
      <h1>${escape(sc.title)}</h1>
      <p class="line"><span>${escape(sc.line)}</span></p>
      <div class="dev">${device(img(lang, raw, sc.shot), sw, sh, dk)}</div>
      ${sc.pose ? `<img class="owl" src="${MASCOT(sc.pose)}">` : ''}
    </section>`).join('');
  return `<!doctype html><html dir="${copy.dir}"><head><meta charset="utf-8"><style>${fontFaces}${deviceCss}
  body { width:${total}px; height:${H}px; position:relative; }
  .bg { position:absolute; top:0; width:${W}px; height:${H}px; background-attachment:fixed; }
  svg.motif { position:absolute; inset:0; }
  .frame { position:absolute; top:0; width:${W}px; height:${H}px; direction:${copy.dir}; }
  h1 { position:absolute; left:${W * 0.06}px; right:${W * 0.06}px; top:${H * (rtl ? 0.025 : 0.045)}px; text-align:center;
       font-family:${head}; font-weight:400; color:${T.ink}; font-size:${(rtl ? 78 : 86) * tk}px; line-height:${rtl ? 1.35 : 1.05};
       letter-spacing:${rtl ? 0 : 0.005}em; white-space:nowrap; }
  .line { position:absolute; left:0; right:0; top:${H * 0.165}px; text-align:center; }
  .line span { display:inline-block; background:${T.surface}; color:${T.ink}; font-family:${body}; font-weight:${rtl ? 700 : 800};
       font-size:${34 * tk}px; line-height:1.2; padding:${10 * tk}px ${30 * tk}px ${rtl ? 14 * tk : 12 * tk}px; border-radius:999px;
       border:${4 * tk}px solid ${T.ink}; box-shadow:${5 * tk}px ${6 * tk}px 0 ${T.ink}; }
  .dev { position:absolute; left:50%; top:${devTop}px; transform:translateX(-50%); }
  .owl { position:absolute; height:${Math.min(H * 0.24, W * 0.12)}px; top:${H * 0.02}px;
         ${rtl ? 'left' : 'right'}:${W * 0.03}px; transform:rotate(${rtl ? -8 : 8}deg); filter:drop-shadow(${5 * k}px ${6 * k}px 0 ${T.ink}); }
  </style></head><body>
  ${bgs}
  ${trail(total, H, list.length, W)}
  ${frames}</body></html>`;
}

/** Feature graphic (Play, 1024x500): wordmark + tagline, Lulu, a tilted Home shot. */
function bannerPage(lang) {
  const copy = COPY[lang], rtl = copy.dir === 'rtl';
  const w = 1024, h = 500, k = h / 1080;
  const [rw, rh] = rawSize(lang, 'phone', 'home');
  const sw = 560, sh = sw * (rh / rw);
  return `<!doctype html><html dir="${copy.dir}"><head><meta charset="utf-8"><style>${fontFaces}${deviceCss}
  body { width:${w}px; height:${h}px; position:relative; overflow:hidden;
    background: repeating-linear-gradient(115deg, ${T.zap} 0 110px, ${T.zapDeep}55 110px 165px); }
  svg.motif { position:absolute; inset:0; }
  .txt { position:absolute; top:78px; ${rtl ? 'right' : 'left'}:56px; width:420px; text-align:${rtl ? 'right' : 'left'}; }
  .word { font-family:Display; font-size:84px; line-height:1; color:${T.ink}; }
  .sub { display:inline-block; margin-top:22px; background:#fff; border:3px solid ${T.ink}; border-radius:999px;
         box-shadow:4px 5px 0 ${T.ink}; padding:7px 20px 9px; font-family:${rtl ? 'BodyAr' : 'Body'}; font-weight:800; font-size:23px; color:${T.ink}; }
  .owl { position:absolute; width:150px; top:${rtl ? 300 : 286}px; ${rtl ? 'right' : 'left'}:70px; transform:rotate(${rtl ? 6 : -6}deg);
         filter:drop-shadow(4px 5px 0 ${T.ink}); }
  .dev { position:absolute; top:150px; ${rtl ? 'left' : 'right'}:-70px; transform:rotate(${rtl ? 7 : -7}deg); }
  </style></head><body>
  ${trail(w, h, 1, w)}
  <div class="txt"><div class="word">${escape(copy.word)}</div><div class="sub">${escape(copy.tagline)}</div></div>
  <img class="owl" src="${MASCOT('cheer')}">
  <div class="dev">${device(img(lang, 'phone', 'home'), sw, sh, 0.55)}</div>
  </body></html>`;
}

// ================= rendering =================

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(os.homedir(), '.cache/ms-playwright');
  const cands = fs.existsSync(base)
    ? fs.readdirSync(base).filter((d) => /^chromium(_headless_shell)?-/.test(d)).sort().reverse()
        .flatMap((d) => ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/chrome'].map((p) => path.join(base, d, p)))
    : [];
  const bin = [...cands, '/usr/bin/chromium', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
  if (!bin) throw new Error('no headless Chromium: `npx playwright install chromium-headless-shell` or set CHROME');
  return bin;
}

function render(name, html, width, height, out) {
  const file = path.join(BUILD, `${name}.html`);
  fs.writeFileSync(file, html);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(chrome(), ['--headless', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--virtual-time-budget=4000',
    `--window-size=${width},${height}`, `--screenshot=${out}`, `file://${file}`], { stdio: 'ignore' });
}

const magick = (...args) => execFileSync('magick', args);
const has = (lang, form, shot) => fs.existsSync(path.join(RAW, lang, form, `${shot}.png`));

function main() {
  const only = process.argv[2]; // optional: "en", "ar"
  fs.rmSync(path.join(OUT, 'store'), { recursive: true, force: true });
  fs.mkdirSync(BUILD, { recursive: true });
  for (const lang of Object.keys(COPY).filter((l) => !only || l === only)) {
    for (const [formName, { W, H, raw, max, extras = true }] of Object.entries(FORMS)) {
      // The wardrobe and Color Mixer don't scale up yet (phone-sized UI in empty space), so tablets skip them.
      const list = COPY[lang].scenes(facts(lang, 'phone'))
        .filter((sc) => has(lang, raw, sc.shot) && !(sc.phoneOnly && raw !== 'phone') && (extras || !sc.extra));
      // Over the cap: drop extras from the back, keeping the closing frame.
      for (let i = list.length - 1; list.length > max && i >= 0; i--) if (list[i].extra) list.splice(i, 1);
      if (!list.length) continue;
      const dir = path.join(OUT, 'store', lang);
      const strip = path.join(dir, `${formName}-panorama.png`);
      render(`${lang}-${formName}`, galleryPage(lang, formName, list), W * list.length, H, strip);
      list.forEach((_, i) => {
        const out = path.join(dir, formName, `${String(i + 1).padStart(2, '0')}.png`);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        magick(strip, '-crop', `${W}x${H}+${i * W}+0`, '+repage', '-alpha', 'off', out); // stores reject alpha
      });
      console.log(`${lang}/${formName}: ${list.length} frames`);
    }
    if (has(lang, 'phone', 'home')) {
      const fg = path.join(OUT, 'store', lang, 'featureGraphic.png');
      render(`${lang}-feature`, bannerPage(lang), 1024, 500, fg);
      magick(fg, '-alpha', 'off', fg);
      console.log(`${lang}/featureGraphic.png`);
    }
  }
}

main();
