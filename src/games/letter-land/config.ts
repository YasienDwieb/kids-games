import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame, ACCENTS } from '@/sdk';
import LetterLand from './index';

registerGame({
  id: 'letter-land',
  name: 'Letter Land', // English fallback; localized via letter-land:meta.name
  description: 'Listen and find your letters!',
  icon: '🔤',
  ageRange: { min: 3, max: 7 },
  component: LetterLand,
  backgroundColor: ACCENTS.blue.tint,
  accent: 'blue',
  tags: ['letters', 'literacy', 'phonics', 'tracing', 'educational'],
  layout: { mode: 'shell' },
  version: '1.0.0',
});
