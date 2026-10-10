import { StyleSheet, View, Animated } from 'react-native';
import { useLoop } from './motion';

type SunburstProps = {
  color: string;
  /** Diameter of the ray disc; centre it with your own layout. */
  size: number;
  rays?: number;
};

/** Slowly turning comic rays behind a big win. Reduce-motion keeps them still. */
export function Sunburst({ color, size, rays = 10 }: SunburstProps) {
  const spin = useLoop(16000, { mode: 'repeat' });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[{ width: size, height: size }, { transform: [{ rotate }] }]} pointerEvents="none">
      {Array.from({ length: rays }, (_, i) => (
        <View
          key={i}
          style={[
            styles.ray,
            {
              left: size / 2 - size * 0.06,
              width: size * 0.12,
              height: size,
              backgroundColor: color,
              transform: [{ rotate: `${(i * 180) / rays}deg` }],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ray: { position: 'absolute', top: 0 },
});
