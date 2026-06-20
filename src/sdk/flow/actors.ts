import type { ReactNode } from 'react';

/** A shared sprite the ActorLayer owns and tweens. `content` is the rendered visual. */
export type Actor = {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number; // degrees
  opacity: number;
  content: ReactNode;
};

export function makeActor(input: {
  id: string;
  x: number;
  y: number;
  content: ReactNode;
  scale?: number;
  rotation?: number;
  opacity?: number;
}): Actor {
  return {
    id: input.id,
    x: input.x,
    y: input.y,
    content: input.content,
    scale: input.scale ?? 1,
    rotation: input.rotation ?? 0,
    opacity: input.opacity ?? 1,
  };
}

/** Centered horizontal row of `count` points around (cx, cy), spaced by `gap`. */
export function rowLayout(
  count: number,
  opts: { cx: number; cy: number; gap: number },
): { x: number; y: number }[] {
  const { cx, cy, gap } = opts;
  const offset = ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: cx - offset + i * gap,
    y: cy,
  }));
}
