/* The car the child drives, persisted under `kg:turbo-road:garage`. Cars open
   up as the road trip goes on (CAR_UNLOCK_EVERY levels each); any car bought in
   the old coin shop stays open too. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { CAR_UNLOCK_EVERY, CARS, DEFAULT_GARAGE } from '../constants';
import type { CarId, GarageState } from '../types';

const garageStore = createStore<GarageState>('turbo-road:garage', DEFAULT_GARAGE);

/** Cars open at this point in the trip (level = the next one to drive). */
export function carsUnlockedAt(level: number, owned: readonly CarId[] = []): CarId[] {
  return CARS.filter((c, i) => level > i * CAR_UNLOCK_EVERY || owned.includes(c.id)).map((c) => c.id);
}

export function useGarage(): { garage: GarageState; selectCar: (id: CarId) => void } {
  const [garage, setGarage] = useState<GarageState>(DEFAULT_GARAGE);
  const latest = useRef<GarageState>(garage);

  useEffect(() => {
    let mounted = true;
    garageStore.get().then((g) => {
      if (!mounted) return;
      latest.current = g;
      setGarage(g);
    });
    const unsubscribe = garageStore.subscribe((g) => {
      latest.current = g;
      setGarage(g);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const selectCar = useCallback((id: CarId) => {
    const g = latest.current;
    if (g.selected === id) return;
    const next = { ...g, selected: id };
    latest.current = next;
    setGarage(next);
    garageStore.set(next).catch(() => {});
  }, []);

  return { garage, selectCar };
}
