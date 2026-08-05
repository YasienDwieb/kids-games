import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame, COLORS } from '@/sdk';
import CandyCatchGame from './index';

registerGame({
  id: 'candy-catch',
  name: 'Candy Catch', // English fallback; localized via candy-catch:meta.name
  description: 'Move the basket — catch the treats, dodge the yucky ones!',
  icon: '🍭',
  ageRange: { min: 3, max: 7 },
  component: CandyCatchGame,
  backgroundColor: COLORS.canvas,
  accent: 'pink',
  order: 130,
  tags: ['arcade', 'reflex', 'catching', 'fun'],
  layout: { mode: 'bare' },
  version: '1.0.0',
});
