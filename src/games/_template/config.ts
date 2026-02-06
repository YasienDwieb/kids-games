import type { GameConfig } from '../../types';
import TemplateGame from './index';

// Template config — copy this file and update all fields for your game.
// Do NOT register this template; it's only a reference.
export const templateConfig: GameConfig = {
  id: 'template',                    // unique kebab-case identifier
  name: 'Template Game',             // display name shown on home screen
  description: 'A starting point for new games', // short description
  icon: '🎮',                        // emoji shown on the game card
  ageRange: { min: 2, max: 6 },      // target age range (inclusive)
  component: TemplateGame,           // the root component for this game
  backgroundColor: '#FFF9F0',        // card/background tint color
};
