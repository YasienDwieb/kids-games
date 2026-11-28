/**
 * The chosen buddy, big: Home, the wardrobe, celebrations, level-up and the
 * break screen. Wears the saved outfit; `interactive` makes a tap hop, cheer
 * and say the buddy's welcome line.
 *
 *   <BuddyFigure size={140} mood="cheer" />
 *   <BuddyFigure size={180} interactive />
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useBuddy, type BuddyId } from '@/sdk/buddy';
import { useBuddyLabel } from '@/sdk/buddy/names';
import { useWelcome } from '@/sdk/buddy/useWelcome';
import { useWearing, type Wearing } from '@/sdk/player/outfitStore';
import { Mascot, type MascotPose } from './Mascot';
import { useOccasion } from '@/sdk/occasion/useActiveOccasion';
import { ArtPiece, artWidth } from '@/sdk/occasion/art/ArtPiece';

export type BuddyMood = 'idle' | MascotPose;

const CHEER_MS = 1400;

type BuddyFigureProps = {
  size?: number;
  mood?: BuddyMood;
  /** Tap to hop and hear the welcome line. */
  interactive?: boolean;
  /** Outfit to show instead of the saved one. */
  wearing?: Wearing;
  buddy?: BuddyId;
  /** Show the occasion's companion (a fanoos in Ramadan) beside the buddy. Default true. */
  companion?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BuddyFigure({ size = 140, mood = 'idle', interactive = false, wearing, buddy, companion = true, style }: BuddyFigureProps) {
  const occasion = useOccasion();
  const chosen = useBuddy();
  const who = buddy ?? chosen;
  const saved = useWearing();
  const label = useBuddyLabel(who);
  const { say, warm } = useWelcome();
  const hop = useMemo(() => new Animated.Value(0), []);
  const [cheering, setCheering] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (interactive) warm(who);
  }, [interactive, warm, who]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onTap = () => {
    say(who);
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    setCheering(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCheering(false), CHEER_MS);
  };

  const pose: MascotPose = cheering ? 'cheer' : mood === 'idle' ? 'wave' : mood;
  const figure = (
    <Animated.View
      style={{ transform: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.14] }) }] }}
    >
      <Mascot buddy={who} pose={pose} size={size} wearing={wearing ?? saved} />
    </Animated.View>
  );
  // Stands on the ground at the buddy's side (start/end follow RTL), not worn.
  const art = companion ? occasion?.companion.art : undefined;
  const artSize = size * 0.5;
  const side = art ? (
    <View
      pointerEvents="none"
      testID="occasion-companion"
      style={{ position: 'absolute', bottom: size * 0.02, end: -artWidth(art, artSize) * 0.35 }}
    >
      <ArtPiece art={art} size={artSize} />
    </View>
  ) : null;

  if (!interactive) {
    return (
      <Animated.View style={[{ width: size, height: size }, style]} pointerEvents="none">
        {figure}
        {side}
      </Animated.View>
    );
  }
  return (
    <Pressable
      onPress={onTap}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[{ width: size, height: size }, style]}
    >
      {figure}
      {side}
    </Pressable>
  );
}
