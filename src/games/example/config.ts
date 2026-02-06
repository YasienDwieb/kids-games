import { registerGame } from '../registry';
import ExampleGame from './index';

registerGame({
  id: 'example',
  name: 'Example',
  description: 'A simple example game to verify the system works',
  icon: '🌈',
  ageRange: { min: 2, max: 6 },
  component: ExampleGame,
  backgroundColor: '#4ECDC4',
});
