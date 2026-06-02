import type { ReactNode } from 'react';

export type OverlaySlot = 'loading' | 'win' | 'pause' | 'error';

export type GameShellProps = {
  title?: string;
  background?: string;
  showBack?: boolean;
  header?: ReactNode;
  onBack?: () => void;
  onPause?: () => void;
  children: ReactNode;
};
