import type { ComponentType } from "react";

/** Metadata and entry point for a single game module */
export type GameConfig = {
  id: string;
  name: string;
  description: string;
  icon: string;
  ageRange: { min: number; max: number };
  component: ComponentType;
  backgroundColor: string;
};

/** Map of game IDs to their configs — the central game registry */
export type GameRegistry = Record<string, GameConfig>;

/** React Navigation root stack param list */
export type RootStackParamList = {
  Home: undefined;
  GamePlayer: { gameId: string };
  Settings: undefined;
};

/** Player profile (for future use) */
export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  avatar: string;
};
