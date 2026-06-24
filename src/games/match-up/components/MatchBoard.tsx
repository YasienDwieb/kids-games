/**
 * MatchBoard — the connect-the-pairs surface, shared by the standalone game and
 * the guided-flow adapter.
 *
 * Interaction: press an unmatched tile in either row and drag a line to its
 * partner in the opposite row. A correct release commits the line (it stays, the
 * two tiles get a check); a wrong release flashes red and snaps back — no fail
 * state. When every top item is linked, `onSolved` fires.
 *
 * Coordinate contract (mirrors shape-detective/SortPuzzle + mouse-maze):
 *   • ONE surface View owns the GestureDetector → event.x/y are surface-local.
 *   • Every tile is measured via measureLayout(surfaceRef) into the SAME space,
 *     so hit-testing and line geometry are direct numeric comparisons.
 *   • `direction:'ltr'` pins the physical-left origin so RTL never flips the
 *     coordinate math (only the visual row order mirrors, which is fine).
 *   • Gesture.Pan().runOnJS(true) — reanimated is not installed; all callbacks
 *     run on the JS thread so setState is safe.
 */
import { useEffect, useRef, useState } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  useSound,
  useTranslation,
  type AccentName,
} from '@/sdk';
import { Tile, type TileState } from './Tile';
import { TILE_SIZE, LINE_THICKNESS, SNAP_RADIUS, TAP_THRESHOLD } from '../constants';
import { nearestLooseIndex, lineColorFor } from '../utils/board';
import type { RoundData } from '../types';

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };
type Row = 'top' | 'bottom';
type Connection = { topIdx: number; botIdx: number };

// Per-connection colors (coral reserved for the wrong-flash).
const LINE_PALETTE = [
  ACCENTS.green.base,
  ACCENTS.orange.base,
  ACCENTS.blue.base,
  ACCENTS.purple.base,
  ACCENTS.pink.base,
];

type MatchBoardProps = {
  round: RoundData;
  accent?: AccentName;
  /** Called on each correct link (for standalone scoring). */
  onCorrect?: () => void;
  /** Called on each wrong drop. */
  onWrong?: () => void;
  /** Called once every top item is linked. */
  onSolved: () => void;
};

const hitTest = (rects: (Rect | null)[], x: number, y: number): number => {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return i;
  }
  return -1;
};

/** A straight line between two surface-local points, drawn as a rotated View. */
function ConnectLine({
  from,
  to,
  color,
  dots = false,
}: {
  from: Point;
  to: Point;
  color: string;
  dots?: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const DOT = LINE_THICKNESS + 4;
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.line,
          {
            left: (from.x + to.x) / 2 - length / 2,
            top: (from.y + to.y) / 2 - LINE_THICKNESS / 2,
            width: length,
            height: LINE_THICKNESS,
            backgroundColor: color,
            transform: [{ rotate: `${angle}rad` }],
          },
        ]}
      />
      {dots
        ? [from, to].map((p, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: p.x - DOT / 2,
                top: p.y - DOT / 2,
                width: DOT,
                height: DOT,
                borderRadius: DOT / 2,
                backgroundColor: color,
              }}
            />
          ))
        : null}
    </>
  );
}

export function MatchBoard({
  round,
  accent = 'purple',
  onCorrect,
  onWrong,
  onSolved,
}: MatchBoardProps) {
  const { t } = useTranslation();
  const { play } = useSound();
  const accentColor = ACCENTS[accent].base;

  const surfaceRef = useRef<View>(null);
  const topRefs = useRef<(View | null)[]>(round.top.map(() => null));
  const botRefs = useRef<(View | null)[]>(round.bottom.map(() => null));
  const topRects = useRef<(Rect | null)[]>(round.top.map(() => null));
  const botRects = useRef<(Rect | null)[]>(round.bottom.map(() => null));

  // Anchor points (edge-of-tile, in surface coords) drive the rendered lines.
  // Stored in state so the overlay redraws once tiles have been measured.
  const [topAnchors, setTopAnchors] = useState<(Point | null)[]>(round.top.map(() => null));
  const [botAnchors, setBotAnchors] = useState<(Point | null)[]>(round.bottom.map(() => null));

  const [connections, setConnections] = useState<Connection[]>([]);
  const [drag, setDrag] = useState<{ from: Point; to: Point } | null>(null);
  const [wrongLine, setWrongLine] = useState<{ from: Point; to: Point } | null>(null);
  const [selected, setSelected] = useState<{ row: Row; idx: number } | null>(null);

  const connectionsRef = useRef<Connection[]>([]);
  connectionsRef.current = connections;
  const selectedRef = useRef<{ row: Row; idx: number } | null>(null);
  selectedRef.current = selected;
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dragOrigin = useRef<{ row: Row; idx: number; anchor: Point; start: Point } | null>(null);

  useEffect(() => () => clearTimeout(wrongTimer.current), []);
  useEffect(() => setSelected(null), [round]);

  const measure = (row: Row, idx: number) => {
    const ref = row === 'top' ? topRefs.current[idx] : botRefs.current[idx];
    const surface = surfaceRef.current;
    if (!ref || !surface) return;
    ref.measureLayout(surface, (left, top, width, height) => {
      const rect = { x: left, y: top, width, height };
      const anchor: Point =
        row === 'top'
          ? { x: left + width / 2, y: top + height } // bottom-center
          : { x: left + width / 2, y: top }; //           top-center
      if (row === 'top') {
        topRects.current[idx] = rect;
        setTopAnchors((prev) => prev.map((p, i) => (i === idx ? anchor : p)));
      } else {
        botRects.current[idx] = rect;
        setBotAnchors((prev) => prev.map((p, i) => (i === idx ? anchor : p)));
      }
    });
  };

  const isTopMatched = (i: number) => connectionsRef.current.some((c) => c.topIdx === i);
  const isBotMatched = (i: number) => connectionsRef.current.some((c) => c.botIdx === i);

  const anchorFor = (row: Row, idx: number): Point | null =>
    row === 'top' ? topAnchors[idx] : botAnchors[idx];

  // --- gesture handlers (kept fresh via a ref so the gesture is built once) ---
  const handlers = useRef({
    begin: (_x: number, _y: number) => {},
    update: (_x: number, _y: number) => {},
    end: (_x: number, _y: number) => {},
  });

  const tryConnect = (topIdx: number, botIdx: number, flashTo: Point) => {
    setSelected(null);
    if (round.solution[topIdx] === botIdx) {
      const next = [...connectionsRef.current, { topIdx, botIdx }];
      setConnections(next);
      void play('pop');
      onCorrect?.();
      if (next.length === round.top.length) {
        void play('win');
        onSolved();
      }
      return;
    }
    void play('wrong');
    onWrong?.();
    const fromP = anchorFor('top', topIdx) ?? flashTo;
    const toP = anchorFor('bottom', botIdx) ?? flashTo;
    setWrongLine({ from: fromP, to: toP });
    clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrongLine(null), 380);
  };

  handlers.current = {
    begin: (x, y) => {
      // Only loose tiles can start an interaction.
      const looseTop = topRects.current.map((r, i) => (isTopMatched(i) ? null : r));
      const looseBot = botRects.current.map((r, i) => (isBotMatched(i) ? null : r));
      let row: Row = 'top';
      let idx = hitTest(looseTop, x, y);
      if (idx === -1) {
        idx = hitTest(looseBot, x, y);
        row = 'bottom';
      }
      if (idx === -1) {
        dragOrigin.current = null;
        return;
      }
      const anchor = (row === 'top' ? topAnchors : botAnchors)[idx];
      if (!anchor) return;
      // Remember the real touch-down point — tap-vs-drag is classified by how far
      // the finger actually travels, NOT distance to the tile's edge-anchor.
      dragOrigin.current = { row, idx, anchor, start: { x, y } };
      // No drag line on touch-down — only once the finger actually moves (update).
    },
    update: (x, y) => {
      if (!dragOrigin.current) return;
      setDrag({ from: dragOrigin.current.anchor, to: { x, y } });
    },
    end: (x, y) => {
      const origin = dragOrigin.current;
      dragOrigin.current = null;
      setDrag(null);
      if (!origin) return;

      const moved = Math.hypot(x - origin.start.x, y - origin.start.y);
      const targetRow: Row = origin.row === 'top' ? 'bottom' : 'top';

      if (moved >= TAP_THRESHOLD) {
        // DRAG: snap to the nearest loose tile in the opposite row within range.
        const rects = (targetRow === 'top' ? topRects : botRects).current.map((r, i) =>
          (targetRow === 'top' ? isTopMatched(i) : isBotMatched(i)) ? null : r,
        );
        const targetIdx = nearestLooseIndex(rects, { x, y }, SNAP_RADIUS);
        if (targetIdx === -1) return; // released in empty space — no-op, keeps prior tap-selection
        const topIdx = origin.row === 'top' ? origin.idx : targetIdx;
        const botIdx = origin.row === 'top' ? targetIdx : origin.idx;
        const flashTo = anchorFor(targetRow, targetIdx) ?? { x, y };
        tryConnect(topIdx, botIdx, flashTo);
        return;
      }

      // TAP: drive selection.
      const sel = selectedRef.current;
      if (!sel) {
        setSelected({ row: origin.row, idx: origin.idx });
        return;
      }
      if (sel.row === origin.row) {
        // Same row: toggle off if same tile, else move selection.
        setSelected(sel.idx === origin.idx ? null : { row: origin.row, idx: origin.idx });
        return;
      }
      // Opposite rows: attempt a connection between the selected and tapped tiles.
      const topIdx = sel.row === 'top' ? sel.idx : origin.idx;
      const botIdx = sel.row === 'top' ? origin.idx : sel.idx;
      const flashTo = anchorFor(origin.row, origin.idx) ?? { x, y };
      tryConnect(topIdx, botIdx, flashTo);
    },
  };

  const pan = useRef(
    Gesture.Pan()
      .runOnJS(true)
      .onBegin((e) => handlers.current.begin(e.x, e.y))
      .onUpdate((e) => handlers.current.update(e.x, e.y))
      .onEnd((e) => handlers.current.end(e.x, e.y))
      .onFinalize((e) => {
        if (dragOrigin.current) handlers.current.end(e.x, e.y);
      }),
  ).current;

  const tileState = (row: Row, i: number): TileState => {
    if (row === 'top' ? isTopMatched(i) : isBotMatched(i)) return 'matched';
    if (dragOrigin.current?.row === row && dragOrigin.current?.idx === i) return 'active';
    if (selected?.row === row && selected?.idx === i) return 'active';
    return 'idle';
  };

  const lineColorForTile = (row: Row, i: number): string | undefined => {
    const idx = connections.findIndex((c) => (row === 'top' ? c.topIdx === i : c.botIdx === i));
    return idx === -1 ? undefined : lineColorFor(idx, LINE_PALETTE);
  };

  return (
    <GestureDetector gesture={pan}>
      <View
        ref={surfaceRef}
        style={[styles.surface, I18nManager.isRTL && styles.ltr]}
      >
        <Text style={styles.prompt}>{t(`match-up:${round.promptKey}`)}</Text>

        <View style={styles.row}>
          {round.top.map((item, i) => (
            <View
              key={`top-${i}`}
              ref={(v) => {
                topRefs.current[i] = v;
              }}
              onLayout={() => measure('top', i)}
            >
              <Tile
                item={item}
                size={TILE_SIZE}
                state={tileState('top', i)}
                accentColor={accentColor}
                lineColor={lineColorForTile('top', i)}
              />
            </View>
          ))}
        </View>

        <View style={styles.gap} />

        <View style={styles.row}>
          {round.bottom.map((item, i) => (
            <View
              key={`bot-${i}`}
              ref={(v) => {
                botRefs.current[i] = v;
              }}
              onLayout={() => measure('bottom', i)}
            >
              <Tile
                item={item}
                size={TILE_SIZE}
                state={tileState('bottom', i)}
                accentColor={accentColor}
                lineColor={lineColorForTile('bottom', i)}
              />
            </View>
          ))}
        </View>

        {/* Line overlay — surface-local coords, non-interactive. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {connections.map((c, i) => {
            const from = topAnchors[c.topIdx];
            const to = botAnchors[c.botIdx];
            return from && to ? (
              <ConnectLine
                key={`${c.topIdx}-${c.botIdx}`}
                from={from}
                to={to}
                color={lineColorFor(i, LINE_PALETTE)}
                dots
              />
            ) : null;
          })}
          {drag ? <ConnectLine from={drag.from} to={drag.to} color={COLORS.inkFaint} /> : null}
          {wrongLine ? (
            <ConnectLine from={wrongLine.from} to={wrongLine.to} color={ACCENTS.coral.base} />
          ) : null}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  // Pin physical-left origin so RTL doesn't flip the drag/line coordinate math.
  ltr: { direction: 'ltr' },
  prompt: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    // Keep the prompt readable for the reader regardless of pinned LTR surface.
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  gap: { flex: 1, minHeight: SPACING.xl },
  line: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS.pill,
  },
});
