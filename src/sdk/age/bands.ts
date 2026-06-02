import { getAllGames } from '@/sdk/config/registry';
import type { GameConfig } from '@/sdk/config/types';

export type AgeBand = { id: string; label: string; min: number; max: number };

export const AGE_BANDS: readonly AgeBand[] = [
  { id: 'toddler', label: 'Toddler', min: 2, max: 3 },
  { id: 'preschool', label: 'Preschool', min: 3, max: 5 },
  { id: 'early', label: 'Early years', min: 5, max: 7 },
  { id: 'kids', label: 'Big kids', min: 7, max: 10 },
];

function overlaps(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
  return a.min <= b.max && b.min <= a.max;
}

export function bandsForGame(config: GameConfig): string[] {
  if (config.bands && config.bands.length > 0) return config.bands;
  return AGE_BANDS.filter((band) => overlaps(config.ageRange, band)).map((b) => b.id);
}

export function gamesForBand(bandId: string): GameConfig[] {
  const band = AGE_BANDS.find((b) => b.id === bandId);
  if (!band) return [];
  return getAllGames().filter((game) => bandsForGame(game).includes(bandId));
}
