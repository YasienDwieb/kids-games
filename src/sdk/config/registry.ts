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

export function getAllGames(): GameConfig[] {
  return Object.values(registry);
}

export function getGamesForAge(age: number): GameConfig[] {
  return Object.values(registry).filter(
    (game) => age >= game.ageRange.min && age <= game.ageRange.max
  );
}

/** Test-only: clears the registry between tests. */
export function _resetRegistry(): void {
  for (const key of Object.keys(registry)) delete registry[key];
}
