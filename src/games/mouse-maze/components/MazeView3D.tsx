/**
 * Mouse Maze in 3D — a drop-in for <MazeView> (same props, same maze hook and
 * drive rules): a clay tray seen from a tilted camera, orange clay walls, a
 * spinning star per pickup, and Higgsfield-made mouse and cheese models (see
 * CREDITS.md). Each model shows a primitive stand-in while it loads.
 *
 * Touch goes through a transparent overlay: the finger is ray-cast from the
 * camera onto the floor plane to find the cell under it, so the tilt never
 * changes what the child aims at. The demo hand's points are the projected
 * cell centres.
 *
 * Scene units: one cell = 1. Cell (r, c) sits at x = c − cols/2 + ½,
 * z = r − rows/2 + ½ (row 0 is the far edge).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, useFrame } from '@react-three/fiber/native';
import {
  BoxGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
  type Group,
} from 'three';
import { DemoHand, preloadModels3D, useModel3D, type DemoPoint, type ModelSource } from '@/sdk';
import { FRAME_PAD, MAZE_COLORS, STEP_MS } from '../constants';
import { useMazeDrive } from '../hooks/useMazeDrive';
import type { StepResult, useMaze } from '../hooks/useMaze';
import type { Grid, Pos } from '../types';

LogBox.ignoreLogs(['THREE.Clock']);

const MOUSE: ModelSource = {
  glb: require('../assets/models/mouse.glb'),
  rgba: require('../assets/models/mouse_tex.rgba'),
};
const CHEESE: ModelSource = {
  glb: require('../assets/models/cheese.glb'),
  rgba: require('../assets/models/cheese_tex.rgba'),
  roughness: 0.6,
};

const WALL_T = 0.22;
const WALL_H = 0.34;
const RIM = 0.55;
/** Camera tilt away from straight down, and its field of view. */
const TILT = (24 * Math.PI) / 180;
const FOV = 32;
const DEMO_CELLS = 3;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const keyOf = (r: number, c: number) => `${r},${c}`;
const parseKey = (k: string): Pos => {
  const [r, c] = k.split(',');
  return { row: Number(r), col: Number(c) };
};

type Board = { rows: number; cols: number };
const cellX = (b: Board, col: number) => col - b.cols / 2 + 0.5;
const cellZ = (b: Board, row: number) => row - b.rows / 2 + 0.5;

/** Camera framing the whole tray, tilted so the walls read as 3D. */
function makeCamera(b: Board): PerspectiveCamera {
  const cam = new PerspectiveCamera(FOV, 1, 0.1, 100);
  const span = Math.max(b.rows, b.cols) + RIM * 2;
  const dist = (span / 2 / Math.tan(((FOV / 2) * Math.PI) / 180)) * 1.08;
  cam.position.set(0, dist * Math.cos(TILT), dist * Math.sin(TILT));
  cam.lookAt(0, 0, 0.15);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return cam;
}

type Run = { horizontal: boolean; line: number; from: number; to: number };

/** Inner wall edges merged into straight runs (the tray rim is the outer edge). */
function wallRuns(grid: Grid): Run[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const runs: Run[] = [];
  const collect = (horizontal: boolean, line: number, count: number, has: (i: number) => boolean) => {
    let start = -1;
    for (let i = 0; i <= count; i++) {
      const on = i < count && has(i);
      if (on && start < 0) start = i;
      if (!on && start >= 0) {
        runs.push({ horizontal, line, from: start, to: i - 1 });
        start = -1;
      }
    }
  };
  for (let r = 1; r < rows; r++) collect(true, r, cols, (c) => grid[r][c].top);
  for (let c = 1; c < cols; c++) collect(false, c, rows, (r) => grid[r][c].left);
  return runs;
}

function starGeometry(): ExtrudeGeometry {
  const s = new Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.34 : 0.15;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  g.center();
  return g;
}

/** Geometry and materials shared by every mesh in the scene. */
function useShared() {
  return useMemo(
    () => ({
      box: new BoxGeometry(1, 1, 1),
      cap: new CylinderGeometry(WALL_T / 2, WALL_T / 2, WALL_H, 16),
      disc: new CylinderGeometry(1, 1, 1, 24),
      ball: new SphereGeometry(1, 16, 12),
      star: starGeometry(),
      wall: new MeshStandardMaterial({ color: MAZE_COLORS.wall, roughness: 0.85 }),
      tray: new MeshStandardMaterial({ color: MAZE_COLORS.tray, roughness: 0.9 }),
      trayDeep: new MeshStandardMaterial({ color: MAZE_COLORS.trayDepth, roughness: 0.9 }),
      floor: new MeshStandardMaterial({ color: MAZE_COLORS.floor, emissive: MAZE_COLORS.floor, emissiveIntensity: 0.3, roughness: 1 }),
      trail: new MeshStandardMaterial({ color: MAZE_COLORS.trail, transparent: true, opacity: 0.45 }),
      hint: new MeshStandardMaterial({ color: MAZE_COLORS.hint, emissive: MAZE_COLORS.hint, emissiveIntensity: 0.3 }),
      gold: new MeshStandardMaterial({ color: MAZE_COLORS.goalPad, emissive: MAZE_COLORS.goalPad, emissiveIntensity: 0.25, roughness: 0.4 }),
      pad: new MeshStandardMaterial({ color: MAZE_COLORS.goalPad, roughness: 0.7 }),
      mouse: new MeshStandardMaterial({ color: MAZE_COLORS.token, roughness: 0.8 }),
      shadow: new MeshStandardMaterial({ color: MAZE_COLORS.text, transparent: true, opacity: 0.18 }),
    }),
    [],
  );
}
type Shared = ReturnType<typeof useShared>;

/** Tray, floor and walls — rebuilt only when the level changes. */
function Walls({ grid, shared }: { grid: Grid; shared: Shared }) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const b = { rows, cols };
  const runs = useMemo(() => wallRuns(grid), [grid]);
  const w = cols + RIM * 2;
  const d = rows + RIM * 2;
  const rimH = WALL_H + 0.08;
  return (
    <group>
      {/* Tray: a deep base, the floor, and a raised rim on all four sides. */}
      <mesh geometry={shared.box} material={shared.trayDeep} position={[0, -0.32, 0.06]} scale={[w + 0.1, 0.5, d + 0.1]} />
      <mesh geometry={shared.box} material={shared.floor} position={[0, -0.05, 0]} scale={[cols, 0.1, rows]} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={shared.box} material={shared.tray} position={[0, rimH / 2 - 0.1, s * (rows / 2 + RIM / 2)]} scale={[w, rimH + 0.1, RIM]} />
          <mesh geometry={shared.box} material={shared.tray} position={[s * (cols / 2 + RIM / 2), rimH / 2 - 0.1, 0]} scale={[RIM, rimH + 0.1, rows]} />
        </group>
      ))}
      {runs.map((run, i) => {
        const len = run.to - run.from + 1;
        const mid = (run.from + run.to) / 2;
        const pos: [number, number, number] = run.horizontal
          ? [cellX(b, mid), WALL_H / 2, run.line - rows / 2]
          : [run.line - cols / 2, WALL_H / 2, cellZ(b, mid)];
        const half = len / 2;
        const ends: [number, number, number][] = run.horizontal
          ? [[pos[0] - half, pos[1], pos[2]], [pos[0] + half, pos[1], pos[2]]]
          : [[pos[0], pos[1], pos[2] - half], [pos[0], pos[1], pos[2] + half]];
        return (
          <group key={i}>
            <mesh
              geometry={shared.box}
              material={shared.wall}
              position={pos}
              scale={run.horizontal ? [len, WALL_H, WALL_T] : [WALL_T, WALL_H, len]}
            />
            {/* Round clay ends so crossing walls fuse without seams. */}
            {ends.map((e, j) => (
              <mesh key={j} geometry={shared.cap} material={shared.wall} position={e} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

/** A loaded model, or `fallback` until it's ready. */
function Model({ src, size, fallback }: { src: ModelSource; size: number; fallback: ReactNode }) {
  const obj = useModel3D(src, size);
  return obj ? <primitive object={obj} /> : <>{fallback}</>;
}

type Pop = { pos: Pos; t0: number };

/** Breadcrumbs, hint path, stars (with a pop when collected) and the cheese. */
function Markers({
  board,
  goal,
  stars,
  trail,
  hintCells,
  shared,
}: {
  board: Board;
  goal: Pos;
  stars: Set<string>;
  trail: Set<string>;
  hintCells: Set<string>;
  shared: Shared;
}) {
  const spin = useRef<Group>(null);
  const hints = useRef<Group>(null);
  const cheese = useRef<Group>(null);
  const pops = useRef<Group>(null);
  const goalKey = keyOf(goal.row, goal.col);

  // A collected star springs up, grows and shrinks away where it was.
  const prev = useRef(stars);
  const popped = useRef<Pop[]>([]);
  const now = useRef(0);
  useEffect(() => {
    const gone = [...prev.current].filter((k) => !stars.has(k));
    prev.current = stars;
    gone.forEach((k) => popped.current.push({ pos: parseKey(k), t0: now.current }));
  }, [stars]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    now.current = t;
    spin.current?.children.forEach((c, i) => {
      // Leaned back to face the tilted camera, wobbling rather than spinning
      // so the star never turns edge-on.
      c.rotation.set(-(Math.PI / 2 - TILT) * 0.8, Math.sin(t * 2.4 + i) * 0.6, 0);
      c.position.y = 0.42 + Math.sin(t * 3 + i) * 0.05;
    });
    hints.current?.children.forEach((c, i) => c.scale.setScalar(0.13 * (1 + 0.25 * Math.sin(t * 6 - i * 0.6))));
    if (cheese.current) {
      cheese.current.position.y = 0.08 + Math.abs(Math.sin(t * 2.2)) * 0.08;
      cheese.current.rotation.y = Math.sin(t * 1.3) * 0.35;
    }
    const g = pops.current;
    if (g) {
      popped.current = popped.current.filter((p) => t - p.t0 < 0.45);
      g.children.forEach((c, i) => {
        const p = popped.current[i];
        c.visible = !!p;
        if (!p) return;
        const k = (t - p.t0) / 0.45;
        c.position.set(cellX(board, p.pos.col), 0.42 + k * 0.9, cellZ(board, p.pos.row));
        c.scale.setScalar(k < 0.5 ? 1 + k : 1.5 * (1 - (k - 0.5) * 2));
        c.rotation.y = t * 10;
      });
    }
  });

  const at = (k: string, y: number): [number, number, number] => {
    const p = parseKey(k);
    return [cellX(board, p.col), y, cellZ(board, p.row)];
  };

  return (
    <group>
      {[...trail]
        .filter((k) => !hintCells.has(k) && k !== goalKey)
        .map((k) => (
          <mesh key={k} geometry={shared.disc} material={shared.trail} position={at(k, 0.01)} scale={[0.12, 0.02, 0.12]} />
        ))}
      <group ref={hints}>
        {[...hintCells]
          .filter((k) => k !== goalKey)
          .map((k) => (
            <mesh key={k} geometry={shared.ball} material={shared.hint} position={at(k, 0.15)} scale={0.13} />
          ))}
      </group>
      <group ref={spin}>
        {[...stars].map((k) => (
          <mesh key={k} geometry={shared.star} material={shared.gold} position={at(k, 0.42)} />
        ))}
      </group>
      <group ref={pops}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} geometry={shared.star} material={shared.gold} visible={false} />
        ))}
      </group>
      <group position={[cellX(board, goal.col), 0, cellZ(board, goal.row)]}>
        <mesh geometry={shared.disc} material={shared.pad} position={[0, 0.04, 0]} scale={[0.38, 0.08, 0.38]} />
        <group ref={cheese}>
          <Model
            src={CHEESE}
            size={0.72}
            fallback={<mesh geometry={shared.box} material={shared.gold} position={[0, 0.18, 0]} scale={0.36} />}
          />
        </group>
      </group>
    </group>
  );
}

/**
 * Motion the drive hook asks for, consumed by the mouse's frame loop: the cells
 * still to walk (in order, so a lagging mouse never cuts through a wall), and
 * when the last wall bump happened.
 */
type MouseMotion = { path: Pos[]; bumpAt: number; bumpDir: [number, number]; won: boolean };

/** Cells per second; a mouse running behind a fast finger speeds up. */
const WALK_SPEED = 1000 / (STEP_MS * 1.3);
/** Within this distance of a waypoint the mouse already turns toward the next one. */
const CORNER = 0.2;
/** Gait cycles per cell walked (one quick scurry patter per ~quarter cell). */
const STRIDE = Math.PI * 2 * 3.5;

const damp = (from: number, to: number, rate: number, dt: number) => from + (to - from) * (1 - Math.exp(-rate * dt));
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * The mouse is one rigid mesh, so all its life comes from motion layered on
 * three nested groups — `root` (where it is), `yaw` (where it faces) and
 * `body` (gait, lean, squash):
 *   • it speeds up and slows down instead of sliding at a constant speed, and
 *     curves round corners instead of pivoting on the spot;
 *   • while moving it scurries — a quick patter bounce with a side-to-side
 *     waddle, leaning into acceleration and banking into turns, stretched a
 *     little along its run;
 *   • standing still it breathes, looks about and now and then sniffs.
 */
function MouseToken({
  board,
  start,
  motion,
  shared,
}: {
  board: Board;
  start: Pos;
  motion: React.RefObject<MouseMotion>;
  shared: Shared;
}) {
  const root = useRef<Group>(null);
  const yaw = useRef<Group>(null);
  const body = useRef<Group>(null);
  const s = useRef({ speed: 0, heading: 0, turn: 0, phase: 0, still: 0, look: 0, sniffAt: -10, winAt: -1 });
  // Placed once; afterwards only the frame loop moves it.
  const [x0, z0] = useState(() => [cellX(board, start.col), cellZ(board, start.row)])[0];

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const t = state.clock.elapsedTime;
    const m = motion.current;
    const r = root.current;
    const y = yaw.current;
    const bd = body.current;
    if (!r || !y || !bd || !m) return;
    const v = s.current;

    // --- Travel: follow the waypoints with eased speed, rounding corners.
    if (m.path.length > 1 && Math.hypot(cellX(board, m.path[0].col) - r.position.x, cellZ(board, m.path[0].row) - r.position.z) < CORNER) {
      m.path.shift();
    }
    const next = m.path[0];
    let want = 0;
    if (next) {
      const dx = cellX(board, next.col) - r.position.x;
      const dz = cellZ(board, next.row) - r.position.z;
      const dist = Math.hypot(dx, dz);
      want = WALK_SPEED * (m.path.length > 2 ? 1.8 : 1);
      // Brake into the last cell rather than stopping dead.
      if (m.path.length === 1) want *= Math.min(1, 0.3 + dist / 0.45);
      const step = Math.min(dist, Math.max(v.speed, 0.6) * dt);
      if (dist < 0.01) {
        r.position.x += dx;
        r.position.z += dz;
        m.path.shift();
      } else {
        r.position.x += (dx / dist) * step;
        r.position.z += (dz / dist) * step;
        const before = v.heading;
        v.heading += wrap(Math.atan2(dx, dz) - v.heading) * (1 - Math.exp(-14 * dt));
        v.turn = damp(v.turn, wrap(v.heading - before) / Math.max(dt, 1e-3), 10, dt);
      }
    } else {
      v.turn = damp(v.turn, 0, 8, dt);
    }
    const prevSpeed = v.speed;
    v.speed = damp(v.speed, want, want > v.speed ? 10 : 14, dt);
    const accel = (v.speed - prevSpeed) / Math.max(dt, 1e-3);
    const run = Math.min(1, v.speed / WALK_SPEED); // 0 standing … 1 running

    // --- Idle: look about now and then, with the odd quick sniff.
    v.still = run < 0.05 ? v.still + dt : 0;
    const idle = Math.min(1, Math.max(0, v.still - 0.6));
    v.look = damp(v.look, idle * Math.sin(t * 0.9) * 0.45, 3, dt);
    if (idle > 0 && t - v.sniffAt > 2.6 + Math.sin(t * 7.3) * 0.8) v.sniffAt = t;
    const sn = t - v.sniffAt;
    const sniff = sn < 0.5 ? Math.abs(Math.sin((sn / 0.5) * Math.PI * 3)) * 0.12 * idle : 0;

    // --- Win: hop and twirl on the cheese.
    if (m.won && !next) {
      if (v.winAt < 0) v.winAt = t;
      v.heading += dt * 3.2;
    }
    const w = v.winAt >= 0 ? t - v.winAt : -1;
    const winHop = w >= 0 ? Math.abs(Math.sin(w * 6)) * 0.28 : 0;

    // --- Gait: a patter bounce and waddle whose rate follows speed.
    v.phase += v.speed * dt * STRIDE;
    const bounce = Math.abs(Math.sin(v.phase)) * 0.06 * run;
    const waddle = Math.sin(v.phase) * 0.09 * run;
    const breath = Math.sin(t * 3.2) * 0.015 * (1 - run);

    y.rotation.y = v.heading + v.look + Math.sin(v.phase * 0.5) * 0.06 * run;
    bd.position.y = bounce + winHop;
    // Lean forward when speeding up / back when braking, plus a sniff dip.
    bd.rotation.x = Math.max(-0.18, Math.min(0.18, accel * 0.012)) + sniff;
    // Bank into turns, and the side-to-side waddle.
    bd.rotation.z = Math.max(-0.25, Math.min(0.25, -v.turn * 0.025)) + waddle;
    // Stretch along the run, squash a touch on each footfall.
    const foot = (1 - Math.abs(Math.sin(v.phase))) * 0.06 * run;
    bd.scale.set(1 - 0.03 * run + breath, 1 - foot + breath, 1 + 0.08 * run - foot * 0.5);

    // --- Wall bump: a quick wobble and nudge toward the wall.
    const b = t - m.bumpAt;
    if (b >= 0 && b < 0.3) {
      const k = Math.sin((b / 0.3) * Math.PI * 3) * (1 - b / 0.3);
      bd.rotation.z += k * 0.25;
      bd.position.x = m.bumpDir[0] * Math.abs(k) * 0.08;
      bd.position.z = m.bumpDir[1] * Math.abs(k) * 0.08;
    } else {
      bd.position.x = 0;
      bd.position.z = 0;
    }
  });

  return (
    <group ref={root} position={[x0, 0, z0]}>
      <mesh geometry={shared.disc} material={shared.shadow} position={[0, 0.005, 0]} scale={[0.3, 0.01, 0.3]} />
      <group ref={yaw}>
        <group ref={body}>
          <Model
            src={MOUSE}
            size={1}
            fallback={<mesh geometry={shared.ball} material={shared.mouse} position={[0, 0.25, 0]} scale={0.25} />}
          />
        </group>
      </group>
    </group>
  );
}

type MazeView3DProps = {
  maze: ReturnType<typeof useMaze>;
  cellSize: number;
  hintCells?: Set<string>;
  showDemo?: boolean;
  onStep?: (res: StepResult) => void;
};

const NO_HINTS = new Set<string>();

export function MazeView3D({ maze, cellSize, hintCells = NO_HINTS, showDemo = false, onStep }: MazeView3DProps) {
  const { state, hintPath } = maze;
  const board = useMemo(() => ({ rows: state.rows, cols: state.cols }), [state.rows, state.cols]);
  const camera = useMemo(() => makeCamera(board), [board]);
  const shared = useShared();
  const side = cellSize > 0 ? cellSize * state.cols + FRAME_PAD * 2 : 0;

  useEffect(() => preloadModels3D([MOUSE, CHEESE]), []);

  // Fresh motion per level; the mouse remounts on the start cell (keyed below).
  const motion = useRef<MouseMotion>({ path: [], bumpAt: -10, bumpDir: [0, 0], won: false });
  const clockNow = useRef(0);
  useMemo(() => {
    motion.current = { path: [], bumpAt: -10, bumpDir: [0, 0], won: false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.level]);
  motion.current.won = state.won;

  const drive = useMazeDrive(maze, {
    onStep: (res) => {
      if (res.cell) motion.current.path.push(res.cell);
      onStep?.(res);
    },
    onBump: (from, to) => {
      motion.current.bumpAt = clockNow.current;
      motion.current.bumpDir = [to.col - from.col, to.row - from.row];
    },
  });

  // Screen point → floor cell, by casting a ray from the camera.
  const toCell = useRef<(x: number, y: number) => Pos | null>(() => null);
  toCell.current = (x, y) => {
    if (side <= 0) return null;
    const ray = new Raycaster();
    ray.setFromCamera(new Vector2((x / side) * 2 - 1, -(y / side) * 2 + 1), camera);
    const hit = new Vector3();
    if (!ray.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), hit)) return null;
    return {
      row: clamp(Math.floor(hit.z + board.rows / 2), 0, board.rows - 1),
      col: clamp(Math.floor(hit.x + board.cols / 2), 0, board.cols - 1),
    };
  };
  const drag = useRef(
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .onBegin((e) => {
        const c = toCell.current(e.x, e.y);
        if (c) drive.current(c);
      })
      .onUpdate((e) => {
        const c = toCell.current(e.x, e.y);
        if (c) drive.current(c);
      }),
  ).current;

  const demoPoints = useMemo<DemoPoint[]>(() => {
    if (!showDemo || state.won || side <= 0) return [];
    return hintPath()
      .slice(0, DEMO_CELLS + 1)
      .map((p) => {
        const v = new Vector3(cellX(board, p.col), 0.2, cellZ(board, p.row)).project(camera);
        return { x: ((v.x + 1) / 2) * side, y: ((1 - v.y) / 2) * side };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDemo, state.won, side, hintPath, state.player, camera, board]);

  if (side <= 0) return null;

  return (
    // Pinned LTR: grid columns and touch coordinates share a physical-left
    // origin — spatial puzzles must not mirror.
    <View style={[styles.root, { width: side, height: side }]}>
      <Canvas flat camera={camera} gl={{ alpha: true }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
        <ClockTap target={clockNow} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[2.5, 8, 5]} intensity={1.1} />
        <directionalLight position={[-4, 3, -2]} intensity={0.35} />
        <Walls grid={state.grid} shared={shared} />
        <Markers
          board={board}
          goal={state.goal}
          stars={state.stars}
          trail={state.trail}
          hintCells={hintCells}
          shared={shared}
        />
        <MouseToken key={state.level} board={board} start={state.player} motion={motion} shared={shared} />
      </Canvas>
      <GestureDetector gesture={drag}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
      {demoPoints.length > 1 ? (
        <DemoHand mode="drag" points={demoPoints} size={Math.max(44, cellSize * 0.9)} />
      ) : null}
    </View>
  );
}

/** Mirrors the scene clock into a ref so touch handlers can timestamp motion. */
function ClockTap({ target }: { target: React.RefObject<number> }) {
  useFrame((s) => {
    target.current = s.clock.elapsedTime;
  });
  return null;
}

const styles = StyleSheet.create({
  root: { direction: 'ltr' },
});
