// GameConfig and GameRegistry are defined in the SDK; re-export them here for backward compat.
export type { GameConfig, GameRegistry } from '@/sdk/config/types';

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
