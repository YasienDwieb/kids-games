import { registerGame } from '@/sdk';
import ColorMixerGame from './index';

registerGame({
  id: 'color-mixer',
  name: 'Color Mixer',
  description: 'Mix colors and discover new ones!',
  icon: '🎨',
  ageRange: { min: 4, max: 8 },
  component: ColorMixerGame,
  backgroundColor: '#FBF3E6',
  accent: 'blue',
  layout: { mode: 'bare' },
});
