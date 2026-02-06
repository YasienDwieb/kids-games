import type { GameConfig, GameRegistry } from '../types';

const registry: GameRegistry = {};

export function registerGame(config: GameConfig): GameRegistry {
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
