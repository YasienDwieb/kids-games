import { i18n } from './index';
import type { GameConfig } from '@/sdk/config/types';

// Resolve a game's display name / description for the active language.
// Convention: each game registers `meta.name` and `meta.description` in its own
// namespace (registerTranslations(game.id, ...)). If a translation is missing
// we fall back to the English value baked into the game's config — so a game
// that hasn't localized its metadata still renders correctly.

export function gameName(game: GameConfig): string {
  const key = `${game.id}:meta.name`;
  return i18n.exists(key) ? i18n.t(key) : game.name;
}

export function gameDescription(game: GameConfig): string {
  const key = `${game.id}:meta.description`;
  return i18n.exists(key) ? i18n.t(key) : game.description;
}
