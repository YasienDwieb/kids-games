// Size-driven responsive helpers for the Home screen. Keyed on screen
// dimensions only — never Platform.OS — so iOS/Android of the same size class
// behave identically.

// Layout tokens mirrored from HomeScreen (kept in sync intentionally).
const GAMES_HEADER_H = 56;
const GRID_PAD_V = 14;
const CELL_GAP = 12;

/** Standard tablet threshold: the SHORT side is >= 768dp. */
export function isTablet(width: number, height: number): boolean {
  return Math.min(width, height) >= 768;
}

export type HomeGrid = {
  rows: number;
  cols: number;
  cardW: number;
  cardH: number;
  emojiSize: number;
  /** true = horizontal-scroll rail (phone or tablet-overflow); false = fit-all grid. */
  scroll: boolean;
};

export type HomeGridInput = {
  width: number;
  height: number;
  count: number;
  insetsTop: number;
  insetsBottom: number;
};

// Tablet card sizing bounds.
const TABLET_CARD_MIN = 150;
const TABLET_CARD_MAX = 260;
const TABLET_RAIL_W = 300; // widened journey rail on tablets (phone stays 244)
const GRID_PAD_H = 12;

/** Usable vertical space for the games area, under the header and insets. */
function usableHeight(i: HomeGridInput): number {
  return i.height - i.insetsTop - i.insetsBottom - GRID_PAD_V * 2 - GAMES_HEADER_H;
}

/** Available width for the games grid (canvas minus rail and horizontal pads). */
function gamesWidth(i: HomeGridInput, railW: number): number {
  return i.width - railW - GRID_PAD_H * 2;
}

/**
 * Phone landscape rail. The row divisor targets ~2 rows on a typical landscape
 * phone: at the original 200 a 390dp-tall screen resolved to a single row of
 * about three tiles, leaving 8 of 11 games offscreen with nothing saying so.
 * Tiles stay far above the 44dp touch minimum at two rows.
 */
function phoneGrid(i: HomeGridInput): HomeGrid {
  const h = usableHeight(i);
  const rows = Math.max(1, Math.min(3, Math.round(h / 140)));
  const cardH = Math.floor(h / rows) - CELL_GAP;
  const cardW = Math.max(116, Math.min(160, Math.round(cardH * 0.82)));
  const emojiSize = Math.max(30, Math.min(54, Math.round(cardH * 0.3)));
  const cols = Math.ceil(i.count / rows);
  return { rows, cols, cardW, cardH, emojiSize, scroll: true };
}

/**
 * Tablet: pick the rows×cols that fit all games in the available W×H at the
 * largest card size within [MIN, MAX]. If nothing fits even at MIN, signal
 * scroll:true so the caller uses the horizontal-scroll fallback (never clip).
 */
function tabletGrid(i: HomeGridInput): HomeGrid {
  const h = usableHeight(i);
  const w = gamesWidth(i, TABLET_RAIL_W);
  const aspect = 0.82; // cardW / cardH

  let best: HomeGrid | null = null;
  // Try each row count that keeps cards within height bounds; maximize card size.
  const maxRows = Math.max(1, Math.floor((h + CELL_GAP) / (TABLET_CARD_MIN / aspect + CELL_GAP)));
  for (let rows = 1; rows <= maxRows; rows++) {
    const cardH = Math.floor((h - CELL_GAP * (rows - 1)) / rows);
    const cardW = Math.round(cardH * aspect);
    if (cardW < TABLET_CARD_MIN) continue;
    const cw = Math.min(cardW, TABLET_CARD_MAX);
    const ch = Math.round(cw / aspect);
    const cols = Math.max(1, Math.floor((w + CELL_GAP) / (cw + CELL_GAP)));
    if (rows * cols < i.count) continue; // doesn't fit all → try more rows
    const emojiSize = Math.max(54, Math.min(96, Math.round(ch * 0.3)));
    const candidate: HomeGrid = { rows, cols, cardW: cw, cardH: ch, emojiSize, scroll: false };
    // Prefer the layout with the largest card area.
    if (!best || cw * ch > best.cardW * best.cardH) best = candidate;
  }
  if (best) return best;

  // Couldn't fit all games even at MIN card size → horizontal-scroll fallback,
  // sized like the phone rail but with tablet-min cards.
  const rows = Math.max(1, Math.floor((h + CELL_GAP) / (TABLET_CARD_MIN / aspect + CELL_GAP)));
  const cardH = Math.floor((h - CELL_GAP * (rows - 1)) / rows);
  const cardW = Math.min(TABLET_CARD_MAX, Math.max(TABLET_CARD_MIN, Math.round(cardH * aspect)));
  const emojiSize = Math.max(54, Math.min(96, Math.round(cardH * 0.3)));
  return { rows, cols: Math.ceil(i.count / rows), cardW, cardH, emojiSize, scroll: true };
}

/** Journey rail width by size class (phone 244, tablet wider). */
export function homeRailWidth(width: number, height: number): number {
  return isTablet(width, height) ? TABLET_RAIL_W : 244;
}

export function computeHomeGrid(i: HomeGridInput): HomeGrid {
  return isTablet(i.width, i.height) ? tabletGrid(i) : phoneGrid(i);
}
