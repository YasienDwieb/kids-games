/* Per-game orientation unlock. The app ships portrait-locked (app.json);
   games that also play in landscape call this from their root component:
   rotation is unlocked while mounted and the portrait lock is restored on
   unmount (leaving the game). */

import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export function useFreeOrientation(): void {
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, []);
}
