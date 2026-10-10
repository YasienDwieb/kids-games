import './i18n';
import { COLORS, registerGame } from '@/sdk';
import MouseMazeGame from './index';

registerGame({
  id: 'mouse-maze',
  name: 'Mouse Maze',
  description: 'Draw a path to help the mouse find its cheese!',
  icon: '🐭',
  ageRange: { min: 3, max: 8 },
  component: MouseMazeGame,
  backgroundColor: COLORS.canvas,
  accent: 'orange',
  category: 'puzzles',
  sounds: { 'sfx.win': 'jingle.pizzi-15' },
  order: 20,
  tags: ['maze', 'puzzle', 'logic'],
  version: '1.0.0',
  layout: { mode: 'bare' },
});
