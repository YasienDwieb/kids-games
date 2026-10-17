import { arc, line, path, dot } from "../glyphs/build";
import { prepareGlyph } from "../utils/resample";
import {
  down,
  initTrace,
  move,
  strokeFraction,
  up,
  type TraceState,
} from "../utils/tracker";
import type { Glyph, Pt } from "../types";

const g = prepareGlyph({ id: "t", strokes: [path(line([10, 50], [90, 50]))] });

function drag(glyph: Glyph, s: TraceState, xs: number[], y = 50) {
  let state = s;
  let event = "none";
  for (const x of xs) {
    const r = move(glyph, state, [x, y]);
    state = r.state;
    // moves after a finished stroke are inert; keep the meaningful event
    if (r.event !== "none") event = r.event;
  }
  return { state, event };
}
const range = (a: number, b: number, step = 10) => {
  const out: number[] = [];
  for (let x = a; x <= b; x += step) out.push(x);
  return out;
};

describe("tracker", () => {
  it("perfect trace completes the glyph", () => {
    const d = down(g, initTrace(), [10, 50]);
    expect(d.event).toBe("grab");
    const r = drag(g, d.state, range(20, 90));
    expect(r.event).toBe("glyphDone");
    expect(r.state.done).toBe(true);
  });

  it("reverse start does not grab and misses on up", () => {
    const d = down(g, initTrace(), [90, 50]);
    expect(d.event).toBe("none");
    expect(up(g, d.state).event).toBe("miss");
  });

  it("grab then up without advancing is a miss", () => {
    const d = down(g, initTrace(), [10, 50]);
    expect(d.event).toBe("grab");
    const u = up(g, d.state);
    expect(u.event).toBe("miss");
    expect(u.state.grabbed).toBe(false);
    expect(u.state.progress).toBe(0);
  });

  it("lift and resume keeps progress", () => {
    const d = down(g, initTrace(), [10, 50]);
    const r = drag(g, d.state, range(20, 50));
    const u = up(g, r.state);
    expect(u.event).toBe("none");
    const d2 = down(g, u.state, [50, 50]);
    expect(d2.event).toBe("grab");
    expect(d2.state.progress).toBe(r.state.progress);
  });

  it("fast swipe is limited by look-ahead", () => {
    const d = down(g, initTrace(), [10, 50]);
    const m = move(g, d.state, [40, 50]);
    expect(strokeFraction(g, m.state)).toBeCloseTo(0.375, 1);
    expect(Math.abs(strokeFraction(g, m.state) - 0.375)).toBeLessThanOrEqual(
      0.03,
    );
  });

  it("loop closing does not jump to the end", () => {
    const loop = prepareGlyph({
      id: "o",
      strokes: [path(arc(50, 50, 30, -90, 270))],
    });
    const start: Pt = [50, 20];
    const a = (260 * Math.PI) / 180;
    const near: Pt = [50 + 30 * Math.cos(a), 50 + 30 * Math.sin(a)];
    const d = down(loop, initTrace(), start);
    expect(d.event).toBe("grab");
    const m = move(loop, d.state, near);
    expect(strokeFraction(loop, m.state)).toBeLessThan(0.1);
  });

  it("everything is none after done", () => {
    const d = down(g, initTrace(), [10, 50]);
    const r = drag(g, d.state, range(20, 90));
    expect(down(g, r.state, [10, 50]).event).toBe("none");
    expect(move(g, r.state, [50, 50]).event).toBe("none");
    expect(up(g, r.state).event).toBe("none");
  });

  it("two strokes: strokeDone advances stroke, rest of drag is inert", () => {
    const two = prepareGlyph({
      id: "two",
      strokes: [path(line([10, 20], [90, 20])), path(line([10, 70], [90, 70]))],
    });
    const d = down(two, initTrace(), [10, 20]);
    const r = drag(two, d.state, range(20, 90), 20);
    expect(r.event).toBe("strokeDone");
    expect(r.state.stroke).toBe(1);
    expect(r.state.progress).toBe(0);
    expect(r.state.grabbed).toBe(false);
    expect(move(two, r.state, [20, 70]).event).toBe("none");
    expect(up(two, r.state).event).toBe("none");
  });

  it("dot stroke judged on down", () => {
    const dg = prepareGlyph({
      id: "d",
      strokes: [path(line([10, 50], [90, 50])), dot(50, 20)],
    });
    const d = down(dg, initTrace(), [10, 50]);
    const r = drag(dg, d.state, range(20, 90));
    expect(r.event).toBe("strokeDone");
    expect(down(dg, r.state, [52, 22]).event).toBe("glyphDone");
    const miss = down(dg, r.state, [80, 80]);
    expect(miss.event).toBe("miss");
    expect(up(dg, miss.state).event).toBe("none");
  });

  it("off-track move neither advances nor undoes", () => {
    const d = down(g, initTrace(), [10, 50]);
    const r = drag(g, d.state, range(20, 50));
    const off = move(g, r.state, [50, 80]);
    expect(off.event).toBe("none");
    expect(off.state.progress).toBe(r.state.progress);
  });
});
