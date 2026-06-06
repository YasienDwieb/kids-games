import { createContext, useContext, useEffect } from 'react';

/** A back interceptor returns true if it consumed the back press. */
export type BackInterceptor = () => boolean;

/** Lets a game register a back interceptor with the GamePlayer screen. */
export const ScreenBackContext = createContext<(fn: BackInterceptor | null) => void>(
  () => {},
);

/**
 * Register a back interceptor for the current game screen.
 *
 * Return `true` from `handler` to consume the back press — e.g. pop an internal
 * screen (board → picker) — or `false` to let the app navigate up to Home.
 * Applies to both the on-screen back button and the Android hardware back.
 * The latest handler always wins; it is cleared on unmount.
 */
export function useScreenBack(handler: BackInterceptor): void {
  const register = useContext(ScreenBackContext);
  useEffect(() => {
    register(handler);
    return () => register(null);
  });
}
