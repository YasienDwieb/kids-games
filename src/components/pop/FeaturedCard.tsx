import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, type AccentName } from '../../constants';
import { EmojiImage } from '../common/EmojiImage';
import { Icon } from '../common/Icon';
import { PressableButton } from '../common/PressableButton';
import { ProgressBar } from './ProgressBar';
import { bob, pulse, useLoop, wiggle } from './motion';

type FeaturedCardProps = {
  width: number;
  height: number;
  /** Journey length; 0 = no journey games picked yet. */
  total: number;
  savedStep: number;
  nextIcon?: string;
  nextName?: string;
  nextAccent?: AccentName;
  onPlay: () => void;
  onStartOver: () => void;
  onSetup: () => void;
};

/**
 * The big "PLAY NOW" card at the front of Home: the guided adventure's next
 * game, alive with its own icon bouncing around, and one huge PLAY button.
 */
export function FeaturedCard({
  width,
  height,
  total,
  savedStep,
  nextIcon,
  nextName,
  nextAccent = 'pink',
  onPlay,
  onStartOver,
  onSetup,
}: FeaturedCardProps) {
  const { t } = useTranslation();
  const a = ACCENTS[nextAccent];
  const float1 = useLoop(1600);
  const float2 = useLoop(2100, { delay: 300 });
  const beat = useLoop(1100);
  const shake = useLoop(900);
  const done = total > 0 && savedStep >= total;
  const big = Math.min(height * 0.36, width * 0.38);

  if (total === 0) {
    return (
      <Pressable
        onPress={onSetup}
        accessibilityRole="button"
        accessibilityLabel={t('flow.empty')}
        style={({ pressed }) => [styles.card, { width, height, backgroundColor: COLORS.surface }, pressed ? styles.pressed : SHADOWS.lg]}
      >
        <View style={styles.center}>
          <Icon name="add-circle" size={48} color={POP.grape} />
          <Text style={styles.emptyText}>{t('flow.empty')}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, SHADOWS.lg, { width, height, backgroundColor: a.base }]}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{t(done ? 'flow.allCaughtUp' : 'home.playNow')}</Text>
      </View>

      {/* Live preview: the next game's icon bobbing, plus two smaller echoes. */}
      <View style={styles.stage} pointerEvents="none">
        <Animated.View style={[styles.echoA, bob(float2, 10)]}>
          <EmojiImage emoji={nextIcon ?? '⭐'} size={big * 0.45} />
        </Animated.View>
        <Animated.View style={[styles.echoB, wiggle(shake, 8)]}>
          <EmojiImage emoji={nextIcon ?? '⭐'} size={big * 0.38} />
        </Animated.View>
        <Animated.View style={[styles.hero, bob(float1, 12)]}>
          <View style={[styles.heroWindow, { width: big, height: big, borderRadius: big * 0.28 }]}>
            <EmojiImage emoji={nextIcon ?? '⭐'} size={big * 0.68} />
          </View>
        </Animated.View>
      </View>

      <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
        {nextName ?? ''}
      </Text>
      <View style={styles.footer}>
        <ProgressBar
          value={total > 0 ? savedStep / total : 0}
          color={POP.zap}
          height={14}
          track={a.tint}
          style={styles.flex}
        />
        {done ? (
          <PressableButton label={t('flow.startOver')} color={POP.zap} onPress={onStartOver} />
        ) : (
          <Animated.View style={pulse(beat, 0.07)}>
            <PressableButton
              onPress={onPlay}
              color={ACCENTS.green.base}
              accessibilityLabel={`${t('home.play')} ${nextName ?? ''}`}
            >
              <Icon name="play" size={22} />
              <Text style={styles.playText}>{t('home.play')}</Text>
            </PressableButton>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    overflow: 'hidden',
    padding: 14,
  },
  pressed: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12 },
  emptyText: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.ink, textAlign: 'center' },
  tag: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
    zIndex: 2,
  },
  tagText: { fontFamily: FONTS.display, fontSize: 14, color: COLORS.ink },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', justifyContent: 'center' },
  heroWindow: {
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
  },
  echoA: { position: 'absolute', top: '4%', end: '6%', opacity: 0.9 },
  echoB: { position: 'absolute', bottom: '6%', start: '4%', opacity: 0.9 },
  flex: { flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: {
    fontFamily: FONTS.display,
    fontSize: 26,
    lineHeight: 30,
    color: COLORS.ink,
    textAlign: 'left',
  },
  playText: { fontFamily: FONTS.display, fontSize: 24, color: COLORS.ink },
});
