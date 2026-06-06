import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { COLORS } from '../constants';
import type { ColorId, SavedColor } from '../types';
import { addColorToMix, hexToRgb, nearestFamous } from '../utils';

type StorePatch = Partial<{ savedColors: SavedColor[]; discoveries: ColorId[] }>;

const store = createStore('color-mixer', {
  savedColors: [] as SavedColor[],
  discoveries: [] as ColorId[],
});

const PRIMARY_COLORS: ColorId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => COLORS[id].isPrimary,
);

// Serialize store writes: createStore has no atomic update, so concurrent
// read-modify-write patches (e.g. a discovery landing as the user taps Save)
// could otherwise read the same blob and clobber each other on disk.
let writeQueue: Promise<unknown> = Promise.resolve();
function enqueuePersist(patch: StorePatch): void {
  writeQueue = writeQueue
    .then(async () => {
      const s = await store.get();
      await store.set({ ...s, ...patch });
    })
    .catch((e) => console.error('Failed to persist color-mixer store:', e));
}

export function useColorMixer() {
  const [newDiscovery, setNewDiscovery] = useState<ColorId | null>(null);
  const [discoveries, setDiscoveries] = useState<ColorId[]>([]);
  const discoveriesRef = useRef<ColorId[]>([]);

  const [currentMixHex, setCurrentMixHex] = useState<string | null>(null);
  const [mixHistory, setMixHistory] = useState<string[]>([]);
  const currentMixHexRef = useRef<string | null>(null);
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);

  useEffect(() => {
    store.get()
      .then((s) => {
        // createStore.get() does NOT backfill new default keys for previously
        // persisted data, so guard each with `?? []` (old installs lack `discoveries`).
        const saved = s.savedColors ?? [];
        const found = s.discoveries ?? [];
        setSavedColors(saved);
        setDiscoveries(found);
        discoveriesRef.current = found;
      })
      .catch((e) => console.error('Failed to load color-mixer store:', e));
  }, []);

  const persist = useCallback((patch: StorePatch) => enqueuePersist(patch), []);

  /** Detect a first-time famous discovery from the running blend. */
  const detectDiscovery = useCallback((hex: string) => {
    const found = nearestFamous(hex);
    if (found && !discoveriesRef.current.includes(found)) {
      const updated = [...discoveriesRef.current, found];
      discoveriesRef.current = updated;
      setDiscoveries(updated);
      setNewDiscovery(found);
      persist({ discoveries: updated });
    }
  }, [persist]);

  const addColorToContinuousMix = useCallback((colorHex: string) => {
    const current = currentMixHexRef.current;
    const blended = current ? addColorToMix(current, colorHex, 0.5) : colorHex;
    if (current) setMixHistory((prev) => [...prev, current]);
    else setMixHistory([]);
    currentMixHexRef.current = blended;
    setCurrentMixHex(blended);
    detectDiscovery(blended);
  }, [detectDiscovery]);

  const undoLastMix = useCallback(() => {
    setMixHistory((prev) => {
      const previous = prev.length > 0 ? prev[prev.length - 1] : null;
      currentMixHexRef.current = previous;
      setCurrentMixHex(previous);
      return prev.slice(0, -1);
    });
  }, []);

  const clearContinuousMix = useCallback(() => {
    currentMixHexRef.current = null;
    setCurrentMixHex(null);
    setMixHistory([]);
  }, []);

  const saveCurrentMix = useCallback((name: string) => {
    const hex = currentMixHexRef.current;
    if (!hex) return;
    const saved: SavedColor = {
      id: `saved_${Date.now()}`,
      hex,
      name,
      rgb: hexToRgb(hex),
      createdAt: Date.now(),
    };
    setSavedColors((prev) => {
      const updated = [...prev, saved];
      persist({ savedColors: updated });
      return updated;
    });
  }, [persist]);

  const deleteSavedColor = useCallback((id: string) => {
    setSavedColors((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persist({ savedColors: updated });
      return updated;
    });
  }, [persist]);

  const acknowledgeDiscovery = useCallback(() => setNewDiscovery(null), []);

  return {
    unlockedColors: PRIMARY_COLORS, // palette = primaries (continuous engine)
    newDiscovery,
    discoveries,
    acknowledgeDiscovery,

    currentMixHex,
    canUndo: mixHistory.length > 0,
    addColorToContinuousMix,
    undoLastMix,
    clearContinuousMix,

    savedColors,
    saveCurrentMix,
    deleteSavedColor,
  };
}
