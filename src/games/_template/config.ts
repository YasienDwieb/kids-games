import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame } from '@/sdk';
import TemplateGame from './index';

registerGame({
  id: 'template-game',
  name: 'Template Game', // English fallback; localized via template-game:meta.name
  description: 'Copy this folder to start a new game.',
  icon: '🧩',
  ageRange: { min: 3, max: 6 },
  component: TemplateGame,
  backgroundColor: '#FFF9F0',
  tags: ['example'],
  version: '1.0.0',
});
