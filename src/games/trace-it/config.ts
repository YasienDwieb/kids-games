import '@/games/_shared/letters/i18n'; // side-effect: registers shared letter names/words
import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { COLORS, registerGame } from '@/sdk';
import TraceIt from './index';

registerGame({
  id: 'trace-it',
  name: 'Trace It', // English fallback; localized via trace-it:meta.name
  description: 'Trace letters and numbers with your finger!',
  icon: '✏️',
  ageRange: { min: 3, max: 6 },
  component: TraceIt,
  backgroundColor: COLORS.canvas,
  accent: 'coral',
  category: 'words',
  sounds: { 'sfx.win': 'jingle.pizzi-06' },
  order: 15,
  tags: ['tracing', 'writing', 'letters', 'numbers', 'educational'],
  version: '1.0.0',
  layout: { mode: 'bare' },
});
