import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame, ACCENTS } from '@/sdk';
import NumbersLand from './index';

registerGame({
  id: 'numbers-land',
  name: 'Numbers Land', // English fallback; localized via numbers-land:meta.name
  description: 'Listen and find your numbers!',
  icon: '🔢',
  ageRange: { min: 3, max: 7 },
  component: NumbersLand,
  backgroundColor: ACCENTS.orange.tint,
  accent: 'orange',
  tags: ['numbers', 'counting', 'educational'],
  layout: { mode: 'shell' },
  version: '1.0.0',
});
