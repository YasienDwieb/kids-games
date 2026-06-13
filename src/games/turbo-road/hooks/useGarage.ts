/* Garage state (wallet coins, owned cars, selected car + trim), persisted via
   the SDK store under `kg:turbo-road:garage`. All hook instances stay live
   through the store's subscribe, so the start screen wallet updates the
   moment a race banks coins. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { CARS, DEFAULT_GARAGE } from '../constants';
import type { CarId, GarageState, TrimId } from '../types';

const garageStore = createStore<GarageState>('turbo-road:garage', DEFAULT_GARAGE);

export function useGarage(): {
  garage: GarageState;
  selectCar: (id: CarId) => void;
  selectTrim: (id: TrimId) => void;
  unlockCar: (id: CarId) => boolean;
  addCoins: (n: number) => void;
} {
  const [garage, setGarage] = useState<GarageState>(DEFAULT_GARAGE);
  // Synchronous mirror so mutators (and unlockCar's boolean) never read stale
  // state when called before a re-render or right after another mutation.
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

  const commit = useCallback((next: GarageState) => {
    latest.current = next;
    setGarage(next);
    garageStore.set(next).catch(() => {}); // persist + notify other instances
  }, []);

  const selectCar = useCallback(
    (id: CarId) => {
      const g = latest.current;
      if (!g.owned.includes(id) || g.selected === id) return;
      commit({ ...g, selected: id });
    },
    [commit],
  );

  const selectTrim = useCallback(
    (id: TrimId) => {
      const g = latest.current;
      if (g.trim === id) return;
      commit({ ...g, trim: id });
    },
    [commit],
  );

  /** Buy a car: checks the CARS price, deducts coins, adds to owned and
      selects it. Returns false when already owned / unknown / unaffordable. */
  const unlockCar = useCallback(
    (id: CarId): boolean => {
      const g = latest.current;
      if (g.owned.includes(id)) return false;
      const car = CARS.find((c) => c.id === id);
      if (!car || g.coins < car.price) return false;
      commit({
        ...g,
        coins: g.coins - car.price,
        owned: [...g.owned, id],
        selected: id,
      });
      return true;
    },
    [commit],
  );

  const addCoins = useCallback(
    (n: number) => {
      if (n <= 0) return;
      const g = latest.current;
      commit({ ...g, coins: g.coins + n });
    },
    [commit],
  );

  return { garage, selectCar, selectTrim, unlockCar, addCoins };
}
