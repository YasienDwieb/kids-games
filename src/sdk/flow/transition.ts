import type { ReactNode } from 'react';
import type { Actor } from './actors';

export type Geometry = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
};

export type TransitionPlan = {
  matched: { id: string; from: Geometry; to: Geometry; content: ReactNode }[];
  entering: Actor[];
  leaving: Actor[];
};

function geom(a: Actor): Geometry {
  return { x: a.x, y: a.y, scale: a.scale, rotation: a.rotation, opacity: a.opacity };
}

/** Diff two actor sets by id to drive the morph. Target content wins on a match. */
export function planTransition(from: Actor[], to: Actor[]): TransitionPlan {
  const fromById = new Map(from.map((a) => [a.id, a]));
  const toById = new Map(to.map((a) => [a.id, a]));

  const matched: TransitionPlan['matched'] = [];
  for (const t of to) {
    const f = fromById.get(t.id);
    if (f) matched.push({ id: t.id, from: geom(f), to: geom(t), content: t.content });
  }
  const entering = to.filter((a) => !fromById.has(a.id));
  const leaving = from.filter((a) => !toById.has(a.id));
  return { matched, entering, leaving };
}
