/**
 * SortPuzzle — drag each shape into its matching bin.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  instruction label                           │
 *   │                                              │
 *   │  ┌────────────┐   ┌────────────┐            │  ← bins (drop targets)
 *   │  │  Bin A     │   │  Bin B     │            │
 *   │  │            │   │            │            │
 *   │  └────────────┘   └────────────┘            │
 *   │                                              │
 *   │     [ shape ]  [ shape ]  [ shape ]         │  ← draggable tray
 *   └──────────────────────────────────────────────┘
 *
 * Coordinate-space contract (mirrors mouse-maze/index.tsx pattern):
 *   • ONE drag surface View owns the PanResponder.  `e.nativeEvent.locationX/Y`
 *     are always relative to this surface's top-left corner.
 *   • ALL bin rects and tray-item rects are measured relative to the SAME
 *     surface via `childRef.measureLayout(surfaceRef.current, …)` called
 *     inside each child's onLayout.  measureLayout returns (left, top, width,
 *     height) in the ancestor's coordinate space, so drag coords and target
 *     rects share ONE spatial origin.
 *   • The ghost View is `position:'absolute'` with top:0 / start:0 inside the
 *     surface; translateX/Y move it in surface-local coords — same origin.
 *
 * RTL coordinate pinning (same as mouse-maze ltrBoard):
 *   `direction: 'ltr'` on the surface pins locationX to the physical-left
 *   origin even when I18nManager.isRTL is true.  Without this, RTL would flip
 *   the surface's internal coordinate system so locationX counts from the
 *   physical right, breaking all hit-test math.  measureLayout against the
 *   pinned surface ref returns coords in the same physical-left-origin space.
 *
 * Async / stale-state safety:
 *   • Placement is committed synchronously at release using the rects that are
 *     current at that moment — no intermediate setState that could be stale.
 *   • Flash timers are tracked in a ref Set and cleared on unmount (no setState
 *     on unmounted component).
 *   • Touch-DOWN (grant) only PICKS UP a tray item.
 *     Placement into a bin only happens on RELEASE over that bin.
 *
 * Win condition:
 *   Solved when every item[i] is placed in bin assignments[i] — identical to
 *   the previous logic; generate.ts / types.ts are not touched.
 *   Items all start loose in the tray (placements initialised to null[]).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  I18nManager,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  ACCENTS,
  BORDER_RADIUS,
  COLORS,
  FONTS,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  useTranslation,
} from '@/sdk';
import { ShapeView } from './ShapeView';
import { SHAPE_SIZE_PX } from '../constants';
import type { SortPuzzle as SortPuzzleData } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortPuzzleProps = {
  puzzle: SortPuzzleData;
  /** Called every time the player drops a shape on any bin (correct or not). */
  onDrop: (itemIndex: number, binIndex: number) => void;
  /** Called once every item is correctly placed. */
  onSolved: () => void;
};

// Placement state per item: null = in tray, number = placed in that bin index
type Placements = (number | null)[];

// Per-item visual flash: 'correct' | 'wrong' | null
type Flashes = ('correct' | 'wrong' | null)[];

// Surface-local rect (left/top = distance from surface top-left corner)
type Rect = { x: number; y: number; width: number; height: number };

const SHAPE_CELL = SHAPE_SIZE_PX.large + SPACING.md * 2;

// ---------------------------------------------------------------------------
// Color-token → accent-name reverse map.
// Maps every hex value in SHAPE_COLORS back to its accent key so the bin
// label can look up a translated color name rather than showing raw hex.
// ---------------------------------------------------------------------------

const HEX_TO_COLOR_KEY: Record<string, string> = {
  [ACCENTS.purple.base]: 'purple',
  [ACCENTS.purple.deep]: 'purple',
  [ACCENTS.blue.base]: 'blue',
  [ACCENTS.blue.deep]: 'blue',
  [ACCENTS.green.base]: 'green',
  [ACCENTS.coral.base]: 'coral',
  [ACCENTS.orange.base]: 'orange',
  [ACCENTS.pink.base]: 'pink',
};

// ---------------------------------------------------------------------------
// Bin label helper — plain function, not a hook
// ---------------------------------------------------------------------------

function binLabel(
  attribute: 'kind' | 'color' | 'size',
  value: string,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (attribute === 'kind') return t(`shape-detective:shapes.kind.${value}`);
  if (attribute === 'size') return t(`shape-detective:shapes.size.${value}`);
  // color — value is a hex token; map to a named accent key so we never
  // interpolate a raw hex string into user-visible text.
  const colorKey = HEX_TO_COLOR_KEY[value] ?? 'purple';
  return t(`shape-detective:shapes.color.${colorKey}`);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SortPuzzle({ puzzle, onDrop, onSolved }: SortPuzzleProps): React.JSX.Element {
  const { t } = useTranslation();

  // Placement: which bin each item has been placed in (null = in tray)
  const [placements, setPlacements] = useState<Placements>(() =>
    puzzle.items.map(() => null),
  );

  // Visual flash per item
  const [flashes, setFlashes] = useState<Flashes>(() => puzzle.items.map(() => null));

  // -------------------------------------------------------------------------
  // Drag surface ref — the single coordinate origin for ALL measurements.
  // binRects and trayRects are filled via measureLayout relative to this ref
  // so they share the same coordinate space as locationX/locationY.
  // -------------------------------------------------------------------------
  const surfaceRef = useRef<View>(null);

  // Surface-local rects for each bin and each tray slot.
  // Populated by measureLayout(surfaceRef) inside child onLayout callbacks.
  const binRects = useRef<(Rect | null)[]>(puzzle.bins.map(() => null));
  const trayRects = useRef<(Rect | null)[]>(puzzle.items.map(() => null));

  // Per-child View refs so we can call measureLayout on them.
  const binViewRefs = useRef<(View | null)[]>(puzzle.bins.map(() => null));
  const trayViewRefs = useRef<(View | null)[]>(puzzle.items.map(() => null));

  // Currently dragged item index (-1 = none)
  const draggingIdxRef = useRef<number>(-1);
  const [draggingIdx, setDraggingIdx] = useState<number>(-1);

  // Ghost position (surface-local) — mirrors mouse-maze pan.getTranslateTransform()
  const ghostX = useRef(new Animated.Value(0)).current;
  const ghostY = useRef(new Animated.Value(0)).current;
  const ghostOpacity = useRef(new Animated.Value(0)).current;

  // Stable refs so PanResponder closure (created once) always sees current state.
  const placementsRef = useRef(placements);
  placementsRef.current = placements;

  // Collect all pending flash timer ids so we can clear them on unmount.
  const flashTimerIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    return () => {
      flashTimerIds.current.forEach(clearTimeout);
      flashTimerIds.current.clear();
    };
  }, []);

  // -------------------------------------------------------------------------
  // measureLayout helpers
  // Each is called inside an onLayout to (re-)measure in surface coordinates.
  // measureLayout(ancestor, onSuccess) → onSuccess(left, top, width, height)
  // where left/top are relative to the ancestor's top-left corner.
  // -------------------------------------------------------------------------

  function remeasureBin(binIdx: number): void {
    const childRef = binViewRefs.current[binIdx];
    const surface = surfaceRef.current;
    if (!childRef || !surface) return;
    childRef.measureLayout(
      surface,
      (left, top, width, height) => {
        binRects.current[binIdx] = { x: left, y: top, width, height };
      },
      () => {
        // measureLayout failed — keep the previous rect (or null)
      },
    );
  }

  function remeasureTray(idx: number): void {
    const childRef = trayViewRefs.current[idx];
    const surface = surfaceRef.current;
    if (!childRef || !surface) return;
    childRef.measureLayout(
      surface,
      (left, top, width, height) => {
        trayRects.current[idx] = { x: left, y: top, width, height };
      },
      () => {
        // measureLayout failed — keep the previous rect (or null)
      },
    );
  }

  // -------------------------------------------------------------------------
  // Hit-test helpers (surface-local coords)
  // -------------------------------------------------------------------------

  function hitTestRect(rects: (Rect | null)[], x: number, y: number): number {
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (!r) continue;
      if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
        return i;
      }
    }
    return -1;
  }

  // -------------------------------------------------------------------------
  // Drag handlers (stored in a ref so PanResponder closure is stable)
  // -------------------------------------------------------------------------

  const handleRef = useRef({
    grant: (_x: number, _y: number) => {},
    move: (_x: number, _y: number) => {},
    release: (_x: number, _y: number) => {},
  });

  handleRef.current = {
    // GRANT: pick up a loose tray item. NEVER place into a bin here.
    grant: (x: number, y: number) => {
      const looseTrayRects = trayRects.current.map((r, i) =>
        placementsRef.current[i] !== null ? null : r,
      );
      const idx = hitTestRect(looseTrayRects, x, y);
      if (idx === -1) return;
      draggingIdxRef.current = idx;
      setDraggingIdx(idx);
      ghostX.setValue(x - SHAPE_CELL / 2);
      ghostY.setValue(y - SHAPE_CELL / 2);
      ghostOpacity.setValue(1);
    },

    move: (x: number, y: number) => {
      if (draggingIdxRef.current === -1) return;
      ghostX.setValue(x - SHAPE_CELL / 2);
      ghostY.setValue(y - SHAPE_CELL / 2);
    },

    // RELEASE: commit placement synchronously using current rects.
    release: (x: number, y: number) => {
      const idx = draggingIdxRef.current;
      // Clear dragging state immediately.
      draggingIdxRef.current = -1;
      setDraggingIdx(-1);
      ghostOpacity.setValue(0);

      if (idx === -1) return;

      // Hit-test bins synchronously at release time — no setState race.
      const binIdx = hitTestRect(binRects.current, x, y);

      onDrop(idx, binIdx);

      if (binIdx === -1) {
        // Dropped outside all bins — flash wrong, snap back to tray.
        setFlashes((prev) => {
          const next = [...prev];
          next[idx] = 'wrong';
          return next;
        });
        const t1 = setTimeout(() => {
          flashTimerIds.current.delete(t1);
          setFlashes((prev) => {
            const next = [...prev];
            next[idx] = null;
            return next;
          });
        }, 600);
        flashTimerIds.current.add(t1);
        return;
      }

      const correctBin = puzzle.assignments[idx];

      if (binIdx === correctBin) {
        // Correct bin — brief green flash, then place.
        setFlashes((prev) => {
          const next = [...prev];
          next[idx] = 'correct';
          return next;
        });
        const t2 = setTimeout(() => {
          flashTimerIds.current.delete(t2);
          setFlashes((prev) => {
            const next = [...prev];
            next[idx] = null;
            return next;
          });
          setPlacements((prev) => {
            const next = [...prev];
            next[idx] = binIdx;
            // Win condition: every item is in its correct bin.
            const allDone = next.every((p, i) => p === puzzle.assignments[i]);
            if (allDone) {
              const t3 = setTimeout(() => {
                flashTimerIds.current.delete(t3);
                onSolved();
              }, 0);
              flashTimerIds.current.add(t3);
            }
            return next;
          });
        }, 350);
        flashTimerIds.current.add(t2);
      } else {
        // Wrong bin — flash coral, snap back.
        setFlashes((prev) => {
          const next = [...prev];
          next[idx] = 'wrong';
          return next;
        });
        const t4 = setTimeout(() => {
          flashTimerIds.current.delete(t4);
          setFlashes((prev) => {
            const next = [...prev];
            next[idx] = null;
            return next;
          });
        }, 600);
        flashTimerIds.current.add(t4);
      }
    },
  };

  // -------------------------------------------------------------------------
  // PanResponder — created once; delegates to handleRef.
  // Attached to the drag surface (same root View that owns surfaceRef).
  // locationX/Y are therefore in surface-local coords — same space as all
  // measureLayout results.
  // -------------------------------------------------------------------------

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) =>
          handleRef.current.grant(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderMove: (e: GestureResponderEvent) =>
          handleRef.current.move(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderRelease: (e: GestureResponderEvent) =>
          handleRef.current.release(e.nativeEvent.locationX, e.nativeEvent.locationY),
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const draggingShape = draggingIdx >= 0 ? puzzle.items[draggingIdx] : null;

  function placedInBin(binIdx: number) {
    return puzzle.items.filter((_, i) => placements[i] === binIdx);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // The drag surface is the single coordinate origin:
  //   • PanResponder attached here → locationX/Y relative to this View.
  //   • surfaceRef passed to measureLayout for bins and tray slots.
  //   • direction:'ltr' pins physical-left as the origin in RTL locales
  //     (same as mouse-maze ltrBoard) so locationX and measureLayout results
  //     are always in the same physical-left-origin space.
  return (
    <View
      ref={surfaceRef}
      style={[styles.root, I18nManager.isRTL && styles.ltrSurface]}
      {...responder.panHandlers}
    >
      {/* Instruction */}
      <Text style={styles.instruction}>{t('shape-detective:sort.instruction')}</Text>

      {/* Bins row — children measured relative to surfaceRef via measureLayout */}
      <View style={styles.binsRow}>
        {puzzle.bins.map((bin, binIdx) => {
          const placed = placedInBin(binIdx);
          const label = binLabel(bin.attribute, bin.value, t);

          return (
            <View
              key={binIdx}
              ref={(v) => {
                binViewRefs.current[binIdx] = v;
              }}
              style={styles.bin}
              onLayout={() => {
                // Re-measure in surface-local coordinates every time layout changes.
                remeasureBin(binIdx);
              }}
              accessible
              accessibilityRole="none"
              accessibilityLabel={t('shape-detective:sort.binLabel', {
                name: label,
                count: placed.length,
              })}
            >
              <Text style={styles.binLabel}>{label}</Text>
              <View style={styles.binContents}>
                {placed.map((shape, i) => (
                  <View key={i} style={styles.placedShape}>
                    <ShapeView shape={shape} />
                  </View>
                ))}
                {placed.length === 0 && (
                  <Text style={styles.binPlaceholder}>{t('shape-detective:sort.dropHere')}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Tray of draggable shapes */}
      <View style={styles.tray}>
        {puzzle.items.map((shape, idx) => {
          const placed = placements[idx] !== null;
          const flash = flashes[idx];

          if (placed) {
            // Empty slot — keeps tray layout stable
            return <View key={idx} style={styles.traySlotEmpty} />;
          }

          const borderColor: string =
            flash === 'correct'
              ? ACCENTS.green.base
              : flash === 'wrong'
              ? ACCENTS.coral.base
              : COLORS.line2;

          const bgColor: string =
            flash === 'correct'
              ? ACCENTS.green.tint
              : flash === 'wrong'
              ? ACCENTS.coral.tint
              : COLORS.surface;

          const kindLabel = t(`shape-detective:shapes.kind.${shape.kind}`);
          const sizeLabel = t(`shape-detective:shapes.size.${shape.size}`);

          return (
            <View
              key={idx}
              ref={(v) => {
                trayViewRefs.current[idx] = v;
              }}
              style={[styles.traySlot, { borderColor, backgroundColor: bgColor }]}
              onLayout={() => {
                // Re-measure in surface-local coordinates every time layout changes.
                remeasureTray(idx);
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('shape-detective:sort.itemLabel', {
                index: idx + 1,
                kind: kindLabel,
                size: sizeLabel,
              })}
            >
              <ShapeView shape={shape} />
            </View>
          );
        })}
      </View>

      {/* Floating drag ghost — positioned above everything in surface-local coords.
          top:0 / start:0 anchor at the surface origin (which is direction:ltr so
          start === physical-left regardless of locale). translateX/Y move it. */}
      {draggingShape !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            {
              transform: [{ translateX: ghostX }, { translateY: ghostY }],
              opacity: ghostOpacity,
            },
          ]}
        >
          <ShapeView shape={draggingShape} />
        </Animated.View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  // Pins the drag surface to physical-left-origin in RTL locales.
  // locationX from PanResponder and left/top from measureLayout are then
  // both measured from the same physical corner — they share one space.
  ltrSurface: {
    direction: 'ltr' as const,
  },
  instruction: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  // Bins
  binsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    justifyContent: 'center',
  },
  bin: {
    flex: 1,
    minHeight: 140,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: ACCENTS.purple.base,
    backgroundColor: ACCENTS.purple.tint,
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.xs,
    ...SHADOWS.sm,
  },
  binLabel: {
    fontFamily: FONTS.displayBold,
    fontSize: FONT_SIZES.sm,
    color: ACCENTS.purple.deep,
    textAlign: 'center',
  },
  binContents: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  placedShape: {
    borderRadius: BORDER_RADIUS.soft,
    padding: SPACING.xs,
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  binPlaceholder: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: ACCENTS.purple.base,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  // Tray
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  traySlot: {
    width: SHAPE_CELL,
    height: SHAPE_CELL,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  traySlotEmpty: {
    width: SHAPE_CELL,
    height: SHAPE_CELL,
  },
  // Floating ghost — top:0 / start:0 anchors at the surface origin.
  // The surface is direction:ltr so start === physical-left always.
  // translateX/Y (from ghostX/ghostY) move it in surface-local coords.
  ghost: {
    position: 'absolute',
    top: 0,
    start: 0,
    width: SHAPE_CELL,
    height: SHAPE_CELL,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.card,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
});
