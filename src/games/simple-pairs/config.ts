import { registerGame } from '../registry';
import SimplePairsGame from './index';

registerGame({
  id: 'simple-pairs',
  name: 'Simple Pairs',
  description: 'Find matching pairs of cards',
  icon: '🃏',
  ageRange: { min: 2, max: 5 },
  component: SimplePairsGame,
  backgroundColor: '#E8F5E9',
});
