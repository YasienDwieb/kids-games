import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame, ACCENTS } from '@/sdk';
import AnimalSafari from './index';

registerGame({
  id: 'animal-safari',
  name: 'Animal Safari', // English fallback; localized via animal-safari:meta.name
  description: 'Listen and find the animals!',
  icon: '🐾',
  ageRange: { min: 3, max: 7 },
  component: AnimalSafari,
  backgroundColor: ACCENTS.orange.tint,
  accent: 'orange',
  tags: ['animals', 'vocabulary', 'listening', 'educational'],
  layout: { mode: 'shell' },
  version: '1.0.0',
});
