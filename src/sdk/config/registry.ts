import { getContentConfig } from '@/sdk/content/load';
import type { CatalogueConfig } from '@/sdk/content/types';
import type { GameConfig, GameRegistry } from './types';
import { validateGameConfig } from './validate';

const registry: GameRegistry = {};

/**
 * Fast Refresh re-runs an edited game's config.ts, which registers the same id a
 * second time. In a running dev app that's an update, not a mistake, so the new
 * config replaces the old one. Jest and release builds still reject duplicates.
 */
function isFastRefresh(): boolean {
  const underJest = typeof process !== 'undefined' && process.env?.JEST_WORKER_ID !== undefined;
  return __DEV__ && !underJest;
}

export function registerGame(config: GameConfig): GameRegistry {
  validateGameConfig(config);
  if (registry[config.id] && !isFastRefresh()) {
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

/**
 * The games the child may see, in display order: drops `catalogue.hidden`
 * and dark games not in `catalogue.enabled`, then puts `catalogue.order` ids
 * first (in that order) and the rest by `GameConfig.order`. Unknown ids in the
 * config are ignored.
 */
export function visibleGames(catalogue: CatalogueConfig = getContentConfig().catalogue): GameConfig[] {
  const hidden = new Set(catalogue.hidden);
  const enabled = new Set(catalogue.enabled);
  const shown = getAllGames().filter((g) => !hidden.has(g.id) && (!g.dark || enabled.has(g.id)));
  const rank = new Map(catalogue.order.map((id, i) => [id, i]));
  const pinned = shown.filter((g) => rank.has(g.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  return [...pinned, ...shown.filter((g) => !rank.has(g.id))];
}

/**
 * True when `id` is a registered game the catalogue keeps from the child.
 * Ids that aren't games (e.g. non-game journey units) are never hidden.
 */
export function isGameHidden(id: string, catalogue: CatalogueConfig = getContentConfig().catalogue): boolean {
  if (!registry[id]) return false;
  return !visibleGames(catalogue).some((g) => g.id === id);
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
