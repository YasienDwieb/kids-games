/**
 * The react-three-fiber canvas every 3D board uses. It tells the enclosing
 * `Stage3D` when its GL context exists, which clears the crash marker and lets
 * the next context start (see `support.ts`).
 *
 * Kept out of the `@/sdk` barrel: it loads react-three-fiber + expo-gl, which
 * only the lazy 3D views should evaluate. Import it from `@/sdk/three/Canvas3D`.
 */
import { useContext, type ComponentProps } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { GlSlotContext } from './support';

export function Canvas3D({ onCreated, ...rest }: ComponentProps<typeof Canvas>) {
  const slot = useContext(GlSlotContext);
  return (
    <Canvas
      {...rest}
      onCreated={(state) => {
        slot?.created();
        onCreated?.(state);
      }}
    />
  );
}
