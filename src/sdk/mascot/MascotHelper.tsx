/**
 * Lulu popping in from a corner to react to the child — the one-line way for a
 * game to use the mascot:
 *
 *   <MascotHelper pose={missed ? 'encourage' : null} />
 *
 * `pose={null}` slides her away; any pose slides her in (and a pose change
 * squash-pops via <Mascot>). Touch-transparent and absolutely positioned at the
 * bottom of the nearest positioned parent, so it never blocks the game.
 */
import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, POP } from '@/constants/colors';
import { OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { FONTS } from '@/constants/typography';
import { Mascot, type MascotPose } from './Mascot';

type MascotHelperProps = {
  pose: MascotPose | null;
  size?: number;
  /** Corner to sit in, by reading direction (default 'start'). */
  side?: 'start' | 'end';
  /** Physical direction for the 'point' pose (see <Mascot>). */
  pointTo?: 'left' | 'right';
  /**
   * Comic speech bubble over her head. Defaults to "Oops! Try again" while
   * encouraging and "Look here!" while pointing; pass `false` to hide it or a
   * string to say something else.
   */
  say?: string | false;
};

const DEFAULT_LINE: Partial<Record<MascotPose, string>> = {
  encourage: 'mascot.oops',
  point: 'mascot.look',
};

export function MascotHelper({ pose, size = 110, side = 'start', pointTo, say }: MascotHelperProps) {
  const { t } = useTranslation();
  const show = useMemo(() => new Animated.Value(0), []);
  // Keep drawing the last pose while she slides out.
  const [shown, setShown] = useState<MascotPose | null>(pose);

  useEffect(() => {
    if (pose) setShown(pose);
    Animated.spring(show, {
      toValue: pose ? 1 : 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !pose) setShown(null);
    });
  }, [pose, show]);

  if (!shown) return null;
  const key = DEFAULT_LINE[shown];
  const line = say === false ? null : say ?? (key ? t(key) : null);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.corner,
        side === 'start' ? styles.start : styles.end,
        {
          opacity: show,
          transform: [{ translateY: show.interpolate({ inputRange: [0, 1], outputRange: [size, 0] }) }],
        },
      ]}
    >
      {line ? (
        <View style={[styles.bubble, side === 'start' ? styles.bubbleStart : styles.bubbleEnd, SHADOWS.sm]}>
          <Text style={styles.bubbleText}>{line}</Text>
        </View>
      ) : null}
      <Mascot pose={shown} size={size} pointTo={pointTo} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', bottom: SPACING.xs, zIndex: 40 },
  start: { start: SPACING.md },
  end: { end: SPACING.md, alignItems: 'flex-end' },
  bubble: {
    maxWidth: 200,
    marginBottom: -6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  bubbleStart: { alignSelf: 'flex-start', borderBottomStartRadius: 4 },
  bubbleEnd: { alignSelf: 'flex-end', borderBottomEndRadius: 4 },
  bubbleText: { fontFamily: FONTS.display, fontSize: 18, color: POP.grape, textAlign: 'center' },
});
