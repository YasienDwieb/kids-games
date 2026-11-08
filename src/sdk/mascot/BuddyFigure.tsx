/**
 * The chosen buddy, big: Home, the wardrobe, celebrations, level-up and the
 * break screen. Wears the saved outfit; `interactive` makes a tap hop, cheer
 * and say the buddy's welcome line.
 *
 *   <BuddyFigure size={140} mood="cheer" />
 *   <BuddyFigure size={180} interactive />
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBuddy, welcomeIntent, type BuddyId } from '@/sdk/buddy';
import { useWearing, type Wearing } from '@/sdk/player/outfitStore';
import { useSound } from '@/sdk/audio/useSound';
import { currentLanguage } from '@/sdk/i18n';
import { Mascot, type MascotPose } from './Mascot';

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
  style?: StyleProp<ViewStyle>;
};

export function BuddyFigure({ size = 140, mood = 'idle', interactive = false, wearing, buddy, style }: BuddyFigureProps) {
  const { t } = useTranslation();
  const chosen = useBuddy();
  const who = buddy ?? chosen;
  const saved = useWearing();
  const { play, prewarm, stop } = useSound();
  const hop = useMemo(() => new Animated.Value(0), []);
  const [cheering, setCheering] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (interactive) prewarm([welcomeIntent(who, currentLanguage())]);
  }, [interactive, prewarm, who]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onTap = () => {
    stop();
    play(welcomeIntent(who, currentLanguage()), { haptic: true });
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

  if (!interactive) {
    return (
      <Animated.View style={[{ width: size, height: size }, style]} pointerEvents="none">
        {figure}
      </Animated.View>
    );
  }
  return (
    <Pressable
      onPress={onTap}
      accessibilityRole="button"
      accessibilityLabel={t(`buddy.${who}.name`)}
      style={[{ width: size, height: size }, style]}
    >
      {figure}
    </Pressable>
  );
}
