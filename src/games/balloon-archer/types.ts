export type Vec2 = { x: number; y: number };

export type Balloon = {
  id: number;
  baseX: number; // sway center
  x: number; // baseX + sway
  y: number; // rises (decreases) over time
  r: number;
  color: string;
  riseSpeed: number; // px/s upward
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  popping: boolean;
  popAt: number; // timestamp the pop started
};

export type Arrow = { x: number; y: number; vx: number; vy: number };

export type Phase = 'aiming' | 'flying' | 'cleared' | 'failed';

export type LevelData = {
  level: number;
  quota: number; // balloons to pop
  arrows: number; // quiver size
  spawnEveryMs: number;
  maxOnScreen: number;
  riseSpeed: number;
  swayAmp: number;
  minR: number;
  maxR: number;
  colors: string[];
};

export type World = {
  balloons: Balloon[];
  arrow: Arrow | null;
  drawing: boolean; // bow held/drawn
  laneY: number; // current aim height
  nextId: number;
  lastSpawn: number;
  popped: number;
  arrowsLeft: number;
  phase: Phase;
};
