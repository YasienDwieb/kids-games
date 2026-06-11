import './i18n'; // side-effect: registers this game's en/ar translation bundles
import { registerGame } from '@/sdk';
import TurboRoad from './index';

registerGame({
  id: 'turbo-road',
  name: 'Turbo Road',
  description: 'A sunny road-trip race — steer, dodge and collect!',
  icon: '🏎️',
  ageRange: { min: 4, max: 12 },
  component: TurboRoad,
  backgroundColor: '#FCE5E1',
  accent: 'coral',
  tags: ['racing', 'cars', 'action', 'reflexes'],
  version: '1.0.0',
  author: 'Kids Games',
  layout: { mode: 'bare' },
});
