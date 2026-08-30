import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { COLORS } from '../constants';
import type { ColorId, PigmentId, SavedColor } from '../types';
import {
  MIX_CAP,
  addDrop,
  fitLog,
  hexToRgb,
  isValidHex,
  mixHex,
  nearestFamous,
  removeDrop,
} from '../utils';

/**
 * Bumped when the shape of a persisted record changes. Saves written before the pigment
 * engine are a bare hex with no recipe; `migrateSaved` gives each one a best-fit pot once,
 * on load, so dropping an old color back into a mix means something in pigment terms.
 */
const SCHEMA_VERSION = 2;

type StoreShape = {
  savedColors: SavedColor[];
  discoveries: ColorId[];
  schemaVersion: number;
};

type StorePatch = Partial<StoreShape>;

const store = createStore<StoreShape>('color-mixer', {
  savedColors: [],
  discoveries: [],
  schemaVersion: SCHEMA_VERSION,
});

const PRIMARY_COLORS: PigmentId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => COLORS[id].isPrimary,
) as PigmentId[];

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

/**
 * Give every saved color a pigment recipe, dropping any record we cannot render.
 *
 * Runs once per load. `fit` is computed here and never in a render path — it enumerates a
 * few hundred candidate pots per color.
 */
export function migrateSaved(saved: SavedColor[]): { colors: SavedColor[]; changed: boolean } {
  let changed = false;
  const colors: SavedColor[] = [];

  for (const color of saved) {
    if (!isValidHex(color?.hex)) {
      // A malformed hex used to parse as black and then poison every mix it entered.
      console.error('Dropping saved color with malformed hex:', color);
      changed = true;
      continue;
    }
    if (color.mixLog?.length || color.fit?.length) {
      colors.push(color);
      continue;
    }
    colors.push({ ...color, fit: fitLog(color.hex) });
    changed = true;
  }

  return { colors, changed };
}

/** The pot a saved color contributes when it is dropped back into a mix. */
function logForSaved(saved: SavedColor): PigmentId[] {
  return saved.mixLog?.length ? saved.mixLog : (saved.fit ?? fitLog(saved.hex));
}

type UseColorMixerOptions = {
  /**
   * Whether hitting a famous color pops the discovery celebration. Off during a challenge:
   * a full-screen modal for some *other* color interrupts the one the child is working on.
   */
  detectDiscoveries: boolean;
};

export function useColorMixer({ detectDiscoveries }: UseColorMixerOptions) {
  const [newDiscovery, setNewDiscovery] = useState<ColorId | null>(null);
  const [discoveries, setDiscoveries] = useState<ColorId[]>([]);
  const discoveriesRef = useRef<ColorId[]>([]);

  // The ordered drop log is the single source of truth; the color is derived from it.
  // A running blend at weight 1/(n+1) is the same as the mean of the whole pot, so a
  // separate "current mix" would just be cached state that can drift.
  const [mixLog, setMixLog] = useState<PigmentId[]>([]);
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);

  const currentMixHex = useMemo(() => mixHex(mixLog), [mixLog]);
  const currentMixHexRef = useRef<string | null>(null);
  currentMixHexRef.current = currentMixHex;

  const detectRef = useRef(detectDiscoveries);
  detectRef.current = detectDiscoveries;

  useEffect(() => {
    store.get()
      .then((s) => {
        // createStore.get() does NOT backfill new default keys for previously
        // persisted data, so guard each with `?? []` (old installs lack `discoveries`).
        const { colors, changed } = migrateSaved(s.savedColors ?? []);
        const found = s.discoveries ?? [];
        setSavedColors(colors);
        setDiscoveries(found);
        discoveriesRef.current = found;
        if (changed || s.schemaVersion !== SCHEMA_VERSION) {
          enqueuePersist({ savedColors: colors, schemaVersion: SCHEMA_VERSION });
        }
      })
      .catch((e) => console.error('Failed to load color-mixer store:', e));
  }, []);

  const persist = useCallback((patch: StorePatch) => enqueuePersist(patch), []);

  /** Detect a first-time famous discovery from the running blend. */
  const detectDiscovery = useCallback((hex: string | null) => {
    if (!hex || !detectRef.current) return;
    const found = nearestFamous(hex);
    if (found && !discoveriesRef.current.includes(found)) {
      const updated = [...discoveriesRef.current, found];
      discoveriesRef.current = updated;
      setDiscoveries(updated);
      setNewDiscovery(found);
      persist({ discoveries: updated });
    }
  }, [persist]);

  const addDrops = useCallback((drops: readonly PigmentId[]) => {
    setMixLog((prev) => {
      let next = prev;
      for (const drop of drops) next = addDrop(next, drop);
      if (next === prev) return prev; // pot full — a drop past the cap changes nothing
      detectDiscovery(mixHex(next));
      return next;
    });
  }, [detectDiscovery]);

  const addPigment = useCallback((id: PigmentId) => addDrops([id]), [addDrops]);

  const addSavedColor = useCallback(
    (saved: SavedColor) => addDrops(logForSaved(saved)),
    [addDrops],
  );

  const undoLastMix = useCallback(() => setMixLog((prev) => removeDrop(prev)), []);

  const clearContinuousMix = useCallback(() => setMixLog([]), []);

  const saveCurrentMix = useCallback((name: string) => {
    const hex = currentMixHexRef.current;
    if (!hex) return;
    const saved: SavedColor = {
      id: `saved_${Date.now()}`,
      hex,
      name,
      rgb: hexToRgb(hex),
      createdAt: Date.now(),
      mixLog: [...mixLog],
    };
    setSavedColors((prev) => {
      const updated = [...prev, saved];
      persist({ savedColors: updated });
      return updated;
    });
  }, [persist, mixLog]);

  const deleteSavedColor = useCallback((id: string) => {
    setSavedColors((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persist({ savedColors: updated });
      return updated;
    });
  }, [persist]);

  const acknowledgeDiscovery = useCallback(() => setNewDiscovery(null), []);

  return {
    unlockedColors: PRIMARY_COLORS,
    newDiscovery,
    discoveries,
    acknowledgeDiscovery,

    currentMixHex,
    mixLog,
    canUndo: mixLog.length > 0,
    potFull: mixLog.length >= MIX_CAP,
    addPigment,
    addSavedColor,
    undoLastMix,
    clearContinuousMix,

    savedColors,
    saveCurrentMix,
    deleteSavedColor,
  };
}
