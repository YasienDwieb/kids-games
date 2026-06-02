import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { OverlaySlot } from './types';

export type GameShellApi = {
  setScore: (score: number | string | null) => void;
  showOverlay: (slot: OverlaySlot, content: ReactNode) => void;
  hideOverlay: (slot: OverlaySlot) => void;
};

const noop = () => {};
export const GameShellContext = createContext<GameShellApi>({
  setScore: noop,
  showOverlay: noop,
  hideOverlay: noop,
});

export function useGameShell(): GameShellApi {
  return useContext(GameShellContext);
}
