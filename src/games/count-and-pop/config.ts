import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame } from '@/sdk';
import CountAndPopGame from './index';

registerGame({
  id: 'count-and-pop',
  name: 'Count & Pop', // English fallback; localized via count-and-pop:meta.name
  description: 'Count, pop, and learn your numbers!',
  icon: '🔢',
  ageRange: { min: 3, max: 7 },
  component: CountAndPopGame,
  backgroundColor: '#FCE5EF', // soft pink (ACCENTS.pink.tint)
  accent: 'pink',
  tags: ['numbers', 'math', 'counting', 'educational'],
  layout: { mode: 'shell' },
  version: '1.0.0',
});
