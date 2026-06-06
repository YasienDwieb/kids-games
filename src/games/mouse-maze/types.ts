export type Direction = 'up' | 'down' | 'left' | 'right';

/** A single maze cell. Each flag is `true` when a wall is present on that side. */
export interface Cell {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface Pos {
  row: number;
  col: number;
}

export type Grid = Cell[][];
