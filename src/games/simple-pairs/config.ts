import './i18n';
import { registerGame } from '@/sdk';
import SimplePairsGame from './index';

registerGame({
  id: 'simple-pairs',
  name: 'Simple Pairs',
  description: 'Find matching pairs of cards',
  icon: '🃏',
  ageRange: { min: 2, max: 5 },
  component: SimplePairsGame,
  backgroundColor: '#FBF3E6',
  accent: 'green',
  layout: { mode: 'bare' },
});
