import { registerGame } from '@/sdk';
import BalloonArcherGame from './index';

registerGame({
  id: 'balloon-archer',
  name: 'Balloon Archer',
  description: 'Aim your bow and pop the balloons!',
  icon: '🏹',
  ageRange: { min: 5, max: 8 },
  component: BalloonArcherGame,
  backgroundColor: '#E0F2FB', // sky (ACCENTS.blue.tint)
  accent: 'green',
  tags: ['archery', 'aim', 'arcade'],
  layout: { mode: 'bare' },
  version: '1.0.0',
});
