import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame } from '@/sdk';
import MatchUpGame from './index';

registerGame({
  id: 'match-up',
  name: 'Match Up', // English fallback; localized via match-up:meta.name
  description: 'Draw a line from each thing to its match!',
  icon: '🔗',
  ageRange: { min: 3, max: 7 },
  component: MatchUpGame,
  backgroundColor: '#F1ECFB', // soft violet (ACCENTS.purple.tint)
  accent: 'purple',
  tags: ['matching', 'logic', 'educational'],
  layout: { mode: 'bare' },
  version: '1.0.0',
});
