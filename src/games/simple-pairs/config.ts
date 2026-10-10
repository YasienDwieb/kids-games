import './i18n';
import { COLORS, registerGame } from '@/sdk';
import SimplePairsGame from './index';

registerGame({
  id: 'simple-pairs',
  name: 'Simple Pairs',
  description: 'Find matching pairs of cards',
  icon: '🃏',
  ageRange: { min: 2, max: 5 },
  component: SimplePairsGame,
  backgroundColor: COLORS.canvas,
  accent: 'green',
  category: 'puzzles',
  sounds: { 'sfx.win': 'jingle.pizzi-10' },
  order: 60,
  layout: { mode: 'bare' },
});
