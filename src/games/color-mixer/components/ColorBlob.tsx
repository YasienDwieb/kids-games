import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { ColorLabel } from './ColorLabel';

type ColorBlobProps = {
  color: string;
  size: number;
  style?: ViewStyle;
  showShine?: boolean;
  label?: string;
  onPress?: () => void;
  pulsing?: boolean;
};

export function ColorBlob({
  color,
  size,
  style,
  showShine = true,
  label,
  onPress,
  pulsing = false,
}: ColorBlobProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulsing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [pulsing, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const isLightColor = isLight(color);
  const shineSize = size / 3.5;
  const shineOffset = size / 5;

  const blobContent = (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        },
        styles.shadow,
        style,
      ]}
    >
      {/* Light colors get a subtle ring. Rendered as an overlay (not as a
          border on the shadow-bearing view) so the Android elevation shadow
          keeps following the borderRadius instead of turning square. */}
      {isLightColor && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size / 2 },
            styles.lightBorder,
          ]}
        />
      )}
      {showShine && (
        <View
          style={[
            styles.shine,
            {
              width: shineSize,
              height: shineSize,
              borderRadius: shineSize / 2,
              top: shineOffset,
              left: shineOffset,
            },
          ]}
        />
      )}
    </Animated.View>
  );

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {blobContent}
        </Pressable>
      ) : (
        blobContent
      )}
      {label && <ColorLabel name={label} />}
    </View>
  );
}

function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  lightBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
