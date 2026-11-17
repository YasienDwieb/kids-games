/**
 * `renderImage` for the shared ListenFindBoard: each animal choice becomes its
 * clay sprite (pre-rendered from the 3D model), the flat emoji where none exists.
 */
import type { FindItem } from '@/games/_shared/listen-find';
import { AnimalSprite, type AnimalTileState } from './AnimalSprite';

export function renderAnimal(item: FindItem, state: AnimalTileState) {
  if (item.image === undefined) return null;
  return <AnimalSprite id={item.id} state={state} image={item.image} />;
}
