import { StyleSheet, Text, View } from 'react-native';
import { EMOJI, MAZE_COLORS, WALL_WIDTH } from '../constants';
import type { Grid, Pos } from '../types';

const keyOf = (r: number, c: number): string => `${r},${c}`;

interface MazeBoardProps {
  grid: Grid;
  cellSize: number;
  goal: Pos;
  stars: Set<string>;
  trail: Set<string>;
  hintCells: Set<string>;
}

/** Static maze layer: walls, breadcrumb trail, hint path, stars, and goal. */
export function MazeBoard({ grid, cellSize, goal, stars, trail, hintCells }: MazeBoardProps) {
  const emojiSize = cellSize * 0.6;

  return (
    <View>
      {grid.map((rowCells, r) => (
        <View key={r} style={styles.row}>
          {rowCells.map((cell, c) => {
            const k = keyOf(r, c);
            const isGoal = r === goal.row && c === goal.col;
            return (
              <View
                key={c}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderTopWidth: cell.top ? WALL_WIDTH : 0,
                    borderRightWidth: cell.right ? WALL_WIDTH : 0,
                    borderBottomWidth: cell.bottom ? WALL_WIDTH : 0,
                    borderLeftWidth: cell.left ? WALL_WIDTH : 0,
                  },
                ]}
              >
                {hintCells.has(k) && !isGoal && (
                  <View style={[styles.hint, { width: cellSize * 0.4, height: cellSize * 0.4 }]} />
                )}
                {trail.has(k) && !hintCells.has(k) && !isGoal && (
                  <View style={[styles.trail, { width: cellSize * 0.28, height: cellSize * 0.28 }]} />
                )}
                {stars.has(k) && <Text style={{ fontSize: emojiSize }}>{EMOJI.star}</Text>}
                {isGoal && <Text style={{ fontSize: emojiSize }}>{EMOJI.goal}</Text>}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: MAZE_COLORS.wall,
  },
  trail: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: MAZE_COLORS.trail,
  },
  hint: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: MAZE_COLORS.hint,
  },
});
