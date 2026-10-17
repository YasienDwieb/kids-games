/**
 * Trace It entry: track tabs over one horizontal rail of character tiles in
 * school order. Each tile shows its best stars; the next untraced one pulses
 * with a "Next" badge, but every tile stays tappable.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  fontsFor,
  pulse,
  useLoop,
  useTranslation,
} from '@/sdk';
import { charLanguage, charsForTab, nextSuggested, tabsFor, type Script, type TabId, type TraceChar } from '../catalog';
import { progressStore } from '../progress';
const TILE_W = 128;
const TILE_H = 156;
// Room for the bare-mode floating back button (56) at the AppBar's start.
const BACK_SPACE = 56;

/** Best stars per character; null until the store has loaded. */
function useDone(): Record<string, number> | null {
  const [done, setDone] = useState<Record<string, number> | null>(null);
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
  script: Script;
  tab: TabId;
  onTab: (tab: TabId) => void;
  onPick: (c: TraceChar) => void;
};

export function Picker({ script, tab, onTab, onPick }: PickerProps) {
  const { t } = useTranslation();
  const chars = useMemo(() => charsForTab(tab, script), [tab, script]);
  const done = useDone();

  return (
    <View style={styles.root}>
      <AppBar
        left={<View style={styles.backSpace} />}
        title={t('trace-it:meta.name')}
        right={tabsFor(script).map((k) => (
          <Chip
            key={k}
            label={t(`trace-it:tabs.${k}`)}
            active={k === tab}
            onPress={() => onTab(k)}
            fontFamily={k === 'arabic' || k === 'latin' ? fontsFor(k === 'arabic' ? 'ar' : 'en').display : undefined}
          />
        ))}
      />
      {/* Mounted once progress has loaded, so "Next" is final when the rail scrolls to it. */}
      {done ? <Rail key={tab} chars={chars} done={done} onPick={onPick} /> : <View style={styles.scroll} />}
    </View>
  );
}

type RailProps = {
  chars: readonly TraceChar[];
  done: Record<string, number>;
  onPick: (c: TraceChar) => void;
};

/**
 * The tile rail. On mount it brings the "Next" tile into view instead of always
 * opening at the start. Offsets are physical px, as HomeScreen's rail relies on:
 * under native RTL the rail is mirrored but x:0 is still its left (far) end.
 */
function Rail({ chars, done, onPick }: RailProps) {
  const next = nextSuggested(chars, done);
  const rail = useRef<ScrollView>(null);
  const [viewW, setViewW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const [nextX, setNextX] = useState<number | null>(null);
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || viewW === 0 || contentW === 0) return;
    const max = Math.max(0, contentW - viewW);
    let x: number;
    if (next) {
      if (nextX === null) return;
      x = nextX - (viewW - TILE_W) / 2;
    } else {
      x = I18nManager.isRTL ? max : 0;
    }
    scrolled.current = true;
    rail.current?.scrollTo({ x: Math.min(max, Math.max(0, x)), animated: false });
  }, [viewW, contentW, nextX, next]);

  return (
    <ScrollView
      ref={rail}
      horizontal
      onLayout={(e) => setViewW(e.nativeEvent.layout.width)}
      onContentSizeChange={(w) => setContentW(w)}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.rail}
    >
      {chars.map((c) => (
        <Tile
          key={c.id}
          char={c}
          stars={done[c.id] ?? 0}
          next={c.id === next}
          onPress={() => onPick(c)}
          onLayoutX={c.id === next ? setNextX : undefined}
        />
      ))}
    </ScrollView>
  );
}

type TileProps = {
  char: TraceChar;
  stars: number;
  next: boolean;
  onPress: () => void;
  /** Reports the tile's physical x inside the rail. */
  onLayoutX?: (x: number) => void;
};

function Tile({ char, stars, next, onPress, onLayoutX }: TileProps) {
  const { t } = useTranslation();
  const loop = useLoop(1400, { enabled: next });
  const warmup = char.track === 'warmup';
  const label = warmup ? t(char.nameKey) : char.label;
  return (
    <Animated.View
      style={next ? pulse(loop, 0.06) : undefined}
      onLayout={onLayoutX ? (e) => onLayoutX(e.nativeEvent.layout.x) : undefined}
    >
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
          <Text style={[styles.glyph, char.script && { fontFamily: fontsFor(charLanguage(char)).display }]} numberOfLines={1}>
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
