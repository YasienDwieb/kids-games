import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const PARTICLE_COUNT = 14;
const SHAPES = ['circle', 'star', 'diamond'] as const;
const PARTICLE_COLORS = ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#CE93D8', '#FFB74D', '#F48FB1'];

type SparklesProps = {
  color?: string;
  radius?: number;
};

type ParticleConfig = {
  angle: number;
  distance: number;
  size: number;
  color: string;
  shape: (typeof SHAPES)[number];
  delay: number;
};

function generateParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
    distance: 80 + Math.random() * 70,
    size: 6 + Math.random() * 10,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    shape: SHAPES[i % SHAPES.length],
    delay: Math.random() * 200,
  }));
}

export function Sparkles({ color, radius = 140 }: SparklesProps) {
  const particles = useRef(generateParticles()).current;
  const anims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(particles[i].delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, [anims, particles]);

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      {particles.map((p, i) => {
        const translateX = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * p.distance],
        });
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * p.distance],
        });
        const scale = anims[i].interpolate({
          inputRange: [0, 0.3, 0.7, 1],
          outputRange: [0, 1.3, 1, 0],
        });
        const opacity = anims[i].interpolate({
          inputRange: [0, 0.2, 0.7, 1],
          outputRange: [0, 1, 0.8, 0],
        });
        const rotate = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${120 + Math.random() * 240}deg`],
        });

        const particleColor = color ?? p.color;

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                backgroundColor: particleColor,
                borderRadius: p.shape === 'circle' ? p.size / 2 : p.shape === 'diamond' ? 2 : 0,
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate: p.shape !== 'circle' ? rotate : '0deg' },
                ],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
});
