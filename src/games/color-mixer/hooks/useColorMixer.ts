import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { COLORS, COLOR_RECIPES, TIMING } from '../constants';
import type { ColorId, ColorData, ColorRecipe, SavedColor } from '../types';
import { addColorToMix, hexToRgb } from '../utils';

const savedColorsStore = createStore('color-mixer', { savedColors: [] as SavedColor[] });

const PRIMARY_COLORS: ColorId[] = (Object.keys(COLORS) as ColorId[]).filter(
  (id) => COLORS[id].isPrimary,
);

const MAX_COLORS_IN_ZONE = 3;

type MixingZoneState = {
  colorsInZone: ColorId[];
  isMixing: boolean;
  resultColor: ColorId | null;
};

const EMPTY_ZONE: MixingZoneState = {
  colorsInZone: [],
  isMixing: false,
  resultColor: null,
};

function makeRecipeKey(colors: ColorId[]): string {
  return [...colors].sort().join('+');
}

function findRecipe(colors: ColorId[]): ColorRecipe | null {
  const sorted = [...colors].sort();
  return (
    COLOR_RECIPES.find((recipe) => {
      const recipeSorted = [...recipe.ingredients].sort();
      if (recipeSorted.length !== sorted.length) return false;
      return recipeSorted.every((c, i) => c === sorted[i]);
    }) ?? null
  );
}

function allSameColor(colors: ColorId[]): boolean {
  return colors.every((c) => c === colors[0]);
}

export type MixFailReason = 'same_colors' | 'no_recipe' | null;

export function useColorMixer() {
  const [unlockedColors, setUnlockedColors] = useState<ColorId[]>(PRIMARY_COLORS);
  const [discoveredRecipes, setDiscoveredRecipes] = useState<Set<string>>(new Set());
  const [mixingZone, setMixingZone] = useState<MixingZoneState>(EMPTY_ZONE);
  const [newDiscovery, setNewDiscovery] = useState<ColorId | null>(null);
  const [mixFailed, setMixFailed] = useState<MixFailReason>(null);
  const mixTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentMixHex, setCurrentMixHex] = useState<string | null>(null);
  const [mixHistory, setMixHistory] = useState<string[]>([]);
  const currentMixHexRef = useRef<string | null>(null);
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);

  useEffect(() => {
    savedColorsStore.get()
      .then((stored) => {
        setSavedColors(stored.savedColors);
      })
      .catch((error) => console.error('Failed to load saved colors:', error));
  }, []);

  const addColorToZone = useCallback((colorId: ColorId) => {
    setMixFailed(null);
    setMixingZone((prev) => {
      if (prev.isMixing) return prev;
      if (prev.resultColor) return prev;
      if (prev.colorsInZone.length >= MAX_COLORS_IN_ZONE) return prev;

      return { ...prev, colorsInZone: [...prev.colorsInZone, colorId] };
    });
  }, []);

  const clearZone = useCallback(() => {
    if (mixTimeoutRef.current) {
      clearTimeout(mixTimeoutRef.current);
    }
    setMixingZone(EMPTY_ZONE);
    setMixFailed(null);
  }, []);

  const mixColors = useCallback(() => {
    setMixingZone((prev) => {
      if (prev.isMixing || prev.colorsInZone.length < 2) return prev;

      const recipe = findRecipe(prev.colorsInZone);
      const updated: MixingZoneState = { ...prev, isMixing: true };

      mixTimeoutRef.current = setTimeout(() => {
        if (recipe) {
          const resultId = recipe.result;
          const recipeKey = makeRecipeKey(prev.colorsInZone);
          const isNew = !unlockedColors.includes(resultId);

          if (isNew) {
            setUnlockedColors((curr) => [...curr, resultId]);
            setNewDiscovery(resultId);
          }

          setDiscoveredRecipes((curr) => new Set(curr).add(recipeKey));
          setMixFailed(null);
          setMixingZone({
            colorsInZone: [],
            isMixing: false,
            resultColor: resultId,
          });
        } else {
          const reason: MixFailReason = allSameColor(prev.colorsInZone)
            ? 'same_colors'
            : 'no_recipe';
          setMixFailed(reason);
          setMixingZone(EMPTY_ZONE);
        }
      }, TIMING.MIX_ANIMATION_DURATION);

      return updated;
    });
  }, [unlockedColors]);

  const addColorToContinuousMix = useCallback((colorHex: string) => {
    const current = currentMixHexRef.current;
    if (!current) {
      currentMixHexRef.current = colorHex;
      setCurrentMixHex(colorHex);
      setMixHistory([]);
    } else {
      const blended = addColorToMix(current, colorHex, 0.5);
      currentMixHexRef.current = blended;
      setMixHistory((prev) => [...prev, current]);
      setCurrentMixHex(blended);
    }
  }, []);

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

  const saveCurrentMix = useCallback(
    async (name: string) => {
      const hex = currentMixHexRef.current;
      if (!hex) return;
      const newSavedColor: SavedColor = {
        id: `saved_${Date.now()}`,
        hex,
        name,
        rgb: hexToRgb(hex),
        createdAt: Date.now(),
      };
      setSavedColors((prev) => {
        const updated = [...prev, newSavedColor];
        savedColorsStore.set({ savedColors: updated }).catch((error) =>
          console.error('Failed to save colors:', error),
        );
        return updated;
      });
    },
    [],
  );

  const deleteSavedColor = useCallback(
    async (id: string) => {
      const updated = savedColors.filter((c) => c.id !== id);
      setSavedColors(updated);
      try {
        await savedColorsStore.set({ savedColors: updated });
      } catch (error) {
        console.error('Failed to delete color:', error);
      }
    },
    [savedColors],
  );

  const acknowledgeDiscovery = useCallback(() => {
    setNewDiscovery(null);
  }, []);

  const isColorUnlocked = useCallback(
    (colorId: ColorId): boolean => unlockedColors.includes(colorId),
    [unlockedColors],
  );

  const getDiscoveredColors = useCallback(
    (): ColorData[] => unlockedColors.filter((id) => !COLORS[id].isPrimary).map((id) => COLORS[id]),
    [unlockedColors],
  );

  return {
    unlockedColors,
    mixingZone,
    newDiscovery,
    discoveredRecipes,
    mixFailed,

    addColorToZone,
    clearZone,
    mixColors,
    acknowledgeDiscovery,

    isColorUnlocked,
    getDiscoveredColors,

    currentMixHex,
    mixHistory,
    canUndo: mixHistory.length > 0,
    addColorToContinuousMix,
    undoLastMix,
    clearContinuousMix,

    savedColors,
    saveCurrentMix,
    deleteSavedColor,
  };
}
