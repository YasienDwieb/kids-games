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

/** Usable vertical space for the games area, under the header and insets. */
function usableHeight(i: HomeGridInput): number {
  return i.height - i.insetsTop - i.insetsBottom - GRID_PAD_V * 2 - GAMES_HEADER_H;
}

/** Phone landscape rail — preserves the exact pre-refactor behavior. */
function phoneGrid(i: HomeGridInput): HomeGrid {
  const h = usableHeight(i);
  const rows = Math.max(1, Math.min(3, Math.round(h / 200)));
  const cardH = Math.floor(h / rows) - CELL_GAP;
  const cardW = Math.max(116, Math.min(160, Math.round(cardH * 0.82)));
  const emojiSize = Math.max(30, Math.min(54, Math.round(cardH * 0.3)));
  const cols = Math.ceil(i.count / rows);
  return { rows, cols, cardW, cardH, emojiSize, scroll: true };
}

export function computeHomeGrid(i: HomeGridInput): HomeGrid {
  // Tablet path added in Task 3; phones keep exact current behavior.
  return phoneGrid(i);
}
