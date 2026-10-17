/**
 * Trace It entry: track tabs over one horizontal rail of character tiles in
 * school order. Each tile shows its best stars; the next untraced one pulses
 * with a "Next" badge, but every tile stays tappable.
 */
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ACCENTS,
  AppBar,
  BORDER_RADIUS,
  COLORS,
  Chip,
  EmojiImage,
  FONTS,
  OUTLINE,
  POP,
  SHADOWS,
  SPACING,
  Star,
  pulse,
  useLoop,
  useTranslation,
} from '@/sdk';
import { charsFor, nextSuggested, type TraceChar } from '../catalog';
import { progressStore } from '../progress';
import type { Track } from '../types';

const TABS: readonly Track[] = ['warmup', 'letters', 'numbers'];
const TAB_KEY: Record<Track, string> = {
  warmup: 'trace-it:tabs.warmup',
  letters: 'trace-it:tabs.letters',
  numbers: 'trace-it:tabs.numbers',
};
const TILE_W = 128;
const TILE_H = 156;
// Room for the bare-mode floating back button (56) at the AppBar's start.
const BACK_SPACE = 56;

function useDone(): Record<string, number> {
  const [done, setDone] = useState<Record<string, number>>({});
  useEffect(() => {
    let alive = true;
    void progressStore.get().then((p) => alive && setDone(p.done));
    const off = progressStore.subscribe((p) => setDone(p.done));
    return () => {
      alive = false;
      off();
    };
  }, []);
  return done;
}

type PickerProps = {
  script: 'latin' | 'arabic';
  tab: Track;
  onTab: (tab: Track) => void;
  onPick: (c: TraceChar) => void;
};

export function Picker({ script, tab, onTab, onPick }: PickerProps) {
  const { t } = useTranslation();
  const chars = useMemo(() => charsFor(tab, script), [tab, script]);
  const done = useDone();
  const next = nextSuggested(chars, done);

  return (
    <View style={styles.root}>
      <AppBar
        left={<View style={styles.backSpace} />}
        title={t('trace-it:meta.name')}
        right={TABS.map((k) => (
          <Chip key={k} label={t(TAB_KEY[k])} active={k === tab} onPress={() => onTab(k)} />
        ))}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.rail}
      >
        {chars.map((c) => (
          <Tile key={c.id} char={c} stars={done[c.id] ?? 0} next={c.id === next} onPress={() => onPick(c)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Tile({ char, stars, next, onPress }: { char: TraceChar; stars: number; next: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const loop = useLoop(1400, { enabled: next });
  const warmup = char.track === 'warmup';
  const label = warmup ? t(char.nameKey) : char.label;
  return (
    <Animated.View style={next ? pulse(loop, 0.06) : undefined}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('trace-it:a11y.tile', { label })}
        style={({ pressed }) => [
          styles.tile,
          next && styles.tileNext,
          pressed ? styles.pressed : SHADOWS.md,
        ]}
      >
        {warmup && char.from ? (
          <EmojiImage emoji={char.from} size={64} />
        ) : (
          <Text style={styles.glyph} numberOfLines={1}>
            {char.label}
          </Text>
        )}
        <View style={styles.stars}>
          {[1, 2, 3].map((n) => (
            <Star key={n} size={22} filled={n <= stars} />
          ))}
        </View>
      </Pressable>
      {next ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{t('trace-it:picker.next')}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  backSpace: { width: BACK_SPACE },
  scroll: { flex: 1 },
  rail: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  tile: {
    width: TILE_W,
    height: TILE_H,
    borderRadius: BORDER_RADIUS.tile,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  tileNext: { backgroundColor: ACCENTS.coral.tint },
  pressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  glyph: { fontFamily: FONTS.display, fontSize: 72, lineHeight: 92, color: COLORS.ink },
  stars: { flexDirection: 'row', gap: 2 },
  badge: {
    position: 'absolute',
    top: -12,
    end: -8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    backgroundColor: POP.zap,
    ...SHADOWS.sm,
  },
  badgeText: { fontFamily: FONTS.display, fontSize: 16, color: COLORS.ink },
});
