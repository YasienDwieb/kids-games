/**
 * `renderImage` for the shared ListenFindBoard: each animal choice becomes a 3D
 * animal, with its flat picture standing in while three.js loads.
 */
import { Suspense, lazy } from 'react';
import { Image, StyleSheet } from 'react-native';
import type { FindItem } from '@/games/_shared/listen-find';
import type { AnimalTileState } from './Animal3D';

// three + react-three-fiber + expo-gl are only evaluated once a round is on screen.
const Animal3D = lazy(() => import('./Animal3D').then((m) => ({ default: m.Animal3D })));

export function renderAnimal(item: FindItem, state: AnimalTileState) {
  if (item.image === undefined) return null;
  return (
    <Suspense fallback={<Image source={item.image} style={styles.image} resizeMode="contain" accessible={false} />}>
      <Animal3D id={item.id} state={state} image={item.image} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  image: { width: 64, height: 64 },
});
