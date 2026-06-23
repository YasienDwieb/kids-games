import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { rampColor } from './palette';
import { validateBackdropConfig } from './validate';
import type { BackdropConfig, BackdropLayer } from './types';

function Layer({ layer, animate }: { layer: BackdropLayer; animate: boolean }) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -layer.stripWidth,
        duration: layer.driftDurationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, layer.stripWidth, layer.driftDurationMs, x]);

  const Strip = (key: string, offset: number) => (
    <View key={key} style={[styles.strip, { width: layer.stripWidth, left: offset }]}>
      {layer.elements.map((el, i) => (
        <Image
          key={i}
          source={el.source}
          style={{ position: 'absolute', left: el.left, bottom: el.bottom, width: el.width, height: el.height }}
          resizeMode="contain"
        />
      ))}
    </View>
  );

  // Two side-by-side copies translated together; wraps invisibly at -stripWidth.
  return (
    <Animated.View
      style={[styles.layer, { opacity: layer.opacity, transform: [{ translateX: x }] }]}
      pointerEvents="none"
    >
      {Strip('a', 0)}
      {Strip('b', layer.stripWidth)}
    </Animated.View>
  );
}

const ParallaxBackground: React.FC<{ progress: number; config: BackdropConfig }> = ({
  progress,
  config,
}) => {
  // Validate once; config identity is stable in practice (module-level default).
  useMemo(() => validateBackdropConfig(config), [config]);
  const base = rampColor(config.paletteRamp, progress);
  const animate = config.motion === 'animated';

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: base }]} />
      <View style={styles.world}>
        {config.layers.map((layer, i) => (
          <Layer key={i} layer={layer} animate={animate} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  // Pin LTR so RN doesn't half-mirror the translate math under RTL.
  world: { ...StyleSheet.absoluteFillObject, direction: 'ltr' },
  layer: { ...StyleSheet.absoluteFillObject },
  strip: { position: 'absolute', top: 0, bottom: 0 },
});

export default ParallaxBackground;
