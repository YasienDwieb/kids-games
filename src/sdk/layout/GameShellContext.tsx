import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { OverlaySlot } from './types';

export type GameShellApi = {
  showOverlay: (slot: OverlaySlot, content: ReactNode) => void;
  hideOverlay: (slot: OverlaySlot) => void;
};

const noop = () => {};
export const GameShellContext = createContext<GameShellApi>({
  showOverlay: noop,
  hideOverlay: noop,
});

export function useGameShell(): GameShellApi {
  return useContext(GameShellContext);
}
