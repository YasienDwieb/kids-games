import { registerGame } from '@/sdk';
import MouseMazeGame from './index';

registerGame({
  id: 'mouse-maze',
  name: 'Mouse Maze',
  description: 'Swipe to help the mouse find its cheese!',
  icon: '🐭',
  ageRange: { min: 3, max: 8 },
  component: MouseMazeGame,
  backgroundColor: '#FBF3E6',
  accent: 'orange',
  tags: ['maze', 'puzzle', 'logic'],
  version: '1.0.0',
  layout: { mode: 'bare' },
});
