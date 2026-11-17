/**
 * The board the hosts render: the 3D maze, with the 2D clay board standing in
 * while three.js loads (three + react-three-fiber + expo-gl are only evaluated
 * once a maze is on screen).
 */
import { lazy, type ComponentProps } from 'react';
import { Stage3D } from '@/sdk';
import { MazeView } from './MazeView';

const MazeView3D = lazy(() => import('./MazeView3D').then((m) => ({ default: m.MazeView3D })));

export function MazeStage(props: ComponentProps<typeof MazeView>) {
  return (
    <Stage3D id="mouse-maze" fallback={<MazeView {...props} />}>
      <MazeView3D {...props} />
    </Stage3D>
  );
}
