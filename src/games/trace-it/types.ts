export type Pt = readonly [x: number, y: number];
export type Stroke = { kind: 'path'; points: readonly Pt[] } | { kind: 'dot'; at: Pt };
export type Glyph = { id: string; strokes: readonly Stroke[] };
export type Track = 'warmup' | 'letters' | 'numbers';
