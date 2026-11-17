import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '../errors/ErrorBoundary';
import { acquireGlSlot, GlSlotContext, useGl3D, type GlSlot } from './support';

type Props = {
  /** Names the scene in error reports (`3d:<id>`). */
  id: string;
  /** The 2D view: drawn while 3D loads, on devices without 3D, and if the 3D view throws. */
  fallback: ReactNode;
  /** No 2D version exists: try 3D even where it's off (hide the game there instead, `needs3D`). */
  required?: boolean;
  /** The lazy 3D view. Its canvas must be a `Canvas3D`. */
  children: ReactNode;
};

/**
 * Where every 3D board mounts: picks 2D or 3D for this device, waits for the
 * GL start-up queue, and falls back to 2D if the 3D view throws.
 */
export function Stage3D({ id, fallback, required = false, children }: Props) {
  const support = useGl3D();
  const allowed = support != null && (required || support === 'on');
  const [slot, setSlot] = useState<GlSlot | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let alive = true;
    let held: GlSlot | null = null;
    void acquireGlSlot().then((s) => {
      held = s;
      if (alive) setSlot(s);
      else s.closed();
    });
    return () => {
      alive = false;
      held?.closed();
      setSlot(null);
    };
  }, [allowed]);

  if (!allowed || !slot) return <>{fallback}</>;
  return (
    <GlSlotContext.Provider value={slot}>
      <ErrorBoundary where={`3d:${id}`} fallback={fallback} onError={slot.closed}>
        <Suspense fallback={fallback}>{children}</Suspense>
      </ErrorBoundary>
    </GlSlotContext.Provider>
  );
}
