import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame } from '@/sdk';
import ShapeDetectiveGame from './index';

registerGame({
  id: 'shape-detective',
  name: 'Shape Detective', // English fallback; localized via shape-detective:meta.name
  description: 'Spot the pattern and crack the case!',
  icon: '🔺',
  ageRange: { min: 3, max: 10 },
  component: ShapeDetectiveGame,
  backgroundColor: '#F3EDFB', // soft violet (ACCENTS.purple.tint)
  accent: 'purple',
  tags: ['shapes', 'logic', 'patterns', 'educational'],
  layout: { mode: 'shell' },
  version: '1.0.0',
});
