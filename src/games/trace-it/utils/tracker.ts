import { COMPLETE_AT, LOOKAHEAD, TOLERANCE } from "../constants";
import type { Glyph, Pt } from "../types";

export type TraceState = {
  stroke: number;
  progress: number;
  grabbed: boolean;
  advancedThisDrag: boolean;
  last: Pt | null;
  done: boolean;
};
export type TraceEvent =
  "none" | "grab" | "advance" | "strokeDone" | "glyphDone" | "miss";
export type Step = { state: TraceState; event: TraceEvent };

const SUB_STEP = 2;

export function initTrace(): TraceState {
  return {
    stroke: 0,
    progress: 0,
    grabbed: false,
    advancedThisDrag: false,
    last: null,
    done: false,
  };
}

const near = (a: Pt, b: Pt) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]) <= TOLERANCE;

/** Finish the current stroke: move on (or finish the glyph); the drag ends. */
function finishStroke(g: Glyph, s: TraceState, p: Pt): Step {
  const last = s.stroke >= g.strokes.length - 1;
  return {
    event: last ? "glyphDone" : "strokeDone",
    state: {
      ...s,
      stroke: last ? s.stroke : s.stroke + 1,
      progress: 0,
      grabbed: false,
      advancedThisDrag: true,
      last: p,
      done: last,
    },
  };
}

export function down(g: Glyph, s: TraceState, p: Pt): Step {
  if (s.done) return { state: s, event: "none" };
  const stroke = g.strokes[s.stroke];
  const base = { ...s, advancedThisDrag: false, last: p, grabbed: false };
  if (stroke.kind === "dot") {
    return near(stroke.at, p)
      ? finishStroke(g, base, p)
      : { state: base, event: "miss" };
  }
  if (near(stroke.points[s.progress], p)) {
    return { state: { ...base, grabbed: true }, event: "grab" };
  }
  return { state: base, event: "none" };
}

export function move(g: Glyph, s: TraceState, p: Pt): Step {
  if (s.done || !s.grabbed || !s.last) return { state: s, event: "none" };
  const stroke = g.strokes[s.stroke];
  if (stroke.kind !== "path") return { state: s, event: "none" };
  const pts = stroke.points;
  const end = pts.length - 1;
  const from = s.last;
  const n = Math.max(
    1,
    Math.ceil(Math.hypot(p[0] - from[0], p[1] - from[1]) / SUB_STEP),
  );
  let progress = s.progress;
  for (let i = 1; i <= n; i++) {
    const q: Pt = [
      from[0] + ((p[0] - from[0]) * i) / n,
      from[1] + ((p[1] - from[1]) * i) / n,
    ];
    const hi = Math.min(end, progress + LOOKAHEAD);
    // closest in-tolerance point at or past progress (the furthest would lead the finger by TOLERANCE)
    let best = -1;
    let bestD = Math.min(
      TOLERANCE,
      Math.hypot(pts[progress][0] - q[0], pts[progress][1] - q[1]),
    );
    for (let k = progress + 1; k <= hi; k++) {
      const d = Math.hypot(pts[k][0] - q[0], pts[k][1] - q[1]);
      if (d <= bestD) {
        best = k;
        bestD = d;
      }
    }
    if (best > progress) progress = best;
    if (progress >= COMPLETE_AT * end) {
      return finishStroke(g, { ...s, progress: end }, p);
    }
  }
  const advanced = progress > s.progress;
  return {
    state: {
      ...s,
      progress,
      last: p,
      advancedThisDrag: s.advancedThisDrag || advanced,
    },
    event: advanced ? "advance" : "none",
  };
}

export function up(g: Glyph, s: TraceState): Step {
  const state: TraceState = { ...s, grabbed: false, last: null };
  if (s.done || g.strokes[s.stroke].kind === "dot")
    return { state, event: "none" };
  return { state, event: s.advancedThisDrag ? "none" : "miss" };
}

export function strokeFraction(g: Glyph, s: TraceState): number {
  if (s.done) return 1;
  const stroke = g.strokes[s.stroke];
  if (stroke.kind !== "path" || stroke.points.length < 2) return 0;
  return s.progress / (stroke.points.length - 1);
}
