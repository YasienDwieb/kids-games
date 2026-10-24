import type { Glyph, Pt, Stroke } from '../types';

export function line(a: Pt, b: Pt): Pt[] {
  return [a, b];
}

/** Degrees clockwise on screen from +x (y points down). toDeg < fromDeg goes counter-clockwise. */
export function arc(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  ry: number = r,
): Pt[] {
  const sweep = toDeg - fromDeg;
  const n = Math.max(2, Math.ceil(Math.abs(sweep) / 4));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const th = ((fromDeg + (sweep * i) / n) * Math.PI) / 180;
    out.push([cx + r * Math.cos(th), cy + ry * Math.sin(th)]);
  }
  return out;
}

export function curve(p0: Pt, c1: Pt, c2: Pt, p1: Pt): Pt[] {
  const n = 24;
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([
      a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0],
      a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1],
    ]);
  }
  return out;
}

const EPS = 1e-6;

export function join(...parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1];
      if (last && Math.abs(last[0] - p[0]) < EPS && Math.abs(last[1] - p[1]) < EPS) continue;
      out.push(p);
    }
  }
  return out;
}

export function path(...parts: Pt[][]): Stroke {
  return { kind: 'path', points: join(...parts) };
}

export function dot(x: number, y: number): Stroke {
  return { kind: 'dot', at: [x, y] };
}

export function mirrorX(g: Glyph): Glyph {
  return {
    id: g.id,
    strokes: g.strokes.map((s): Stroke =>
      s.kind === 'dot'
        ? { kind: 'dot', at: [100 - s.at[0], s.at[1]] }
        : { kind: 'path', points: s.points.map((p): Pt => [100 - p[0], p[1]]) },
    ),
  };
}
