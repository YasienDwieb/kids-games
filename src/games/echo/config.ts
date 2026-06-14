import './i18n';
import { registerGame, ACCENTS } from '@/sdk';
import EchoGame from './index';

registerGame({
  id: 'echo',
  name: 'Echo',
  description: 'Watch the pattern, then tap it back!',
  icon: '🔵',
  ageRange: { min: 5, max: 10 },
  component: EchoGame,
  backgroundColor: ACCENTS.blue.tint,
  accent: 'blue',
  layout: { mode: 'bare' },
  tags: ['memory', 'sequence', 'educational'],
  version: '0.1.0',
});
