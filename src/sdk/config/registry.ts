import type { GameConfig, GameRegistry } from './types';
import { validateGameConfig } from './validate';

const registry: GameRegistry = {};

export function registerGame(config: GameConfig): GameRegistry {
  validateGameConfig(config);
  if (registry[config.id]) {
    throw new Error(`Invalid game config: duplicate id "${config.id}"`);
  }
  registry[config.id] = config;
  return registry;
}

export function getGame(id: string): GameConfig | undefined {
  return registry[id];
}

// Ascending `order`; games without one keep registration order behind those
// that have it. Stable, so equal weights never shuffle between renders.
function byOrder(games: GameConfig[]): GameConfig[] {
  return games
    .map((game, i) => ({ game, i }))
    .sort((a, b) => {
      const wa = a.game.order ?? Number.MAX_SAFE_INTEGER;
      const wb = b.game.order ?? Number.MAX_SAFE_INTEGER;
      return wa === wb ? a.i - b.i : wa - wb;
    })
    .map(({ game }) => game);
}

export function getAllGames(): GameConfig[] {
  return byOrder(Object.values(registry));
}

export function getGamesForAge(age: number): GameConfig[] {
  return byOrder(
    Object.values(registry).filter(
      (game) => age >= game.ageRange.min && age <= game.ageRange.max
    )
  );
}

/** Test-only: clears the registry between tests. */
export function _resetRegistry(): void {
  for (const key of Object.keys(registry)) delete registry[key];
}
