/**
 * A 3D animal for an Animal Safari choice tile — Higgsfield clay-toy models
 * (SAM 3D, see CREDITS.md). It idles (a slow sway and a breath), hops and
 * spins with joy when it's the right answer, and shakes its head when a tap
 * was wrong. Drawn by the shared ListenFindBoard through its `renderImage`
 * slot, so the board, its tiles and their touch handling are unchanged.
 */
import { useRef } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import type { Group } from 'three';
import { useModel3D } from '@/sdk';
import { ANIMAL_MODELS } from '../animalModels';

LogBox.ignoreLogs(['THREE.Clock']);

export type AnimalTileState = 'default' | 'correct' | 'wrong';

function Animal({ id, state }: { id: string; state: AnimalTileState }) {
  const obj = useModel3D(ANIMAL_MODELS[id], 1.4, 'length');
  const g = useRef<Group>(null);
  const since = useRef({ state, at: 0 });
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const r = g.current;
    if (!r) return;
    if (since.current.state !== state) since.current = { state, at: t };
    const k = t - since.current.at;
    let y = 0;
    let rotY = Math.sin(t * 0.9 + id.length) * 0.35;
    let rotZ = 0;
    let sy = 1 + Math.sin(t * 2.4 + id.length) * 0.02;
    if (state === 'correct') {
      // Two happy hops and a full turn, then a proud little bounce.
      const hop = k < 1 ? Math.abs(Math.sin(k * Math.PI * 2)) : Math.abs(Math.sin(t * 4)) * 0.3;
      y = hop * 0.35;
      sy = 1 - (1 - hop) * 0.06;
      rotY += k < 1 ? k * Math.PI * 2 : 0;
    } else if (state === 'wrong' && k < 0.6) {
      rotZ = Math.sin(k * 30) * 0.18 * (1 - k / 0.6);
    }
    r.position.y = -0.62 + y;
    r.rotation.set(0, rotY, rotZ);
    r.scale.set(1, sy, 1);
  });
  return <group ref={g}>{obj ? <primitive object={obj} /> : null}</group>;
}

export function Animal3D({ id, state }: { id: string; state: AnimalTileState }) {
  if (!ANIMAL_MODELS[id]) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas flat gl={{ alpha: true }} camera={{ position: [0, 0.35, 3], fov: 38 }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
        <hemisphereLight args={[0xffffff, 0xe8dcc8, 1.4]} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        <Animal id={id} state={state} />
      </Canvas>
    </View>
  );
}
