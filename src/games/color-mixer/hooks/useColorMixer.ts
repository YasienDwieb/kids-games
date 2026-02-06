import { useCallback, useRef, useState } from 'react';
import { COLORS, COLOR_RECIPES, TIMING } from '../constants';
import type { ColorId, ColorData, ColorRecipe } from '../types';

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

export function useColorMixer() {
  const [unlockedColors, setUnlockedColors] = useState<ColorId[]>(PRIMARY_COLORS);
  const [discoveredRecipes, setDiscoveredRecipes] = useState<Set<string>>(new Set());
  const [mixingZone, setMixingZone] = useState<MixingZoneState>(EMPTY_ZONE);
  const [newDiscovery, setNewDiscovery] = useState<ColorId | null>(null);
  const mixTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addColorToZone = useCallback((colorId: ColorId) => {
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
  }, []);

  const mixColors = useCallback(() => {
    setMixingZone((prev) => {
      if (prev.isMixing || prev.colorsInZone.length < 2) return prev;

      const recipe = findRecipe(prev.colorsInZone);

      // Start mixing animation
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
          setMixingZone({
            colorsInZone: [],
            isMixing: false,
            resultColor: resultId,
          });
        } else {
          // No recipe found — show brown-ish "muddy" result or just clear
          setMixingZone({
            colorsInZone: [],
            isMixing: false,
            resultColor: null,
          });
        }
      }, TIMING.MIX_ANIMATION_DURATION);

      return updated;
    });
  }, [unlockedColors]);

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
    // State
    unlockedColors,
    mixingZone,
    newDiscovery,
    discoveredRecipes,

    // Actions
    addColorToZone,
    clearZone,
    mixColors,
    acknowledgeDiscovery,

    // Helpers
    isColorUnlocked,
    getDiscoveredColors,
  };
}
