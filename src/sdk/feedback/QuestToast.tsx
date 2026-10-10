/**
 * "Quest done!" — a small banner that drops in from the top-end corner when a
 * win completes one of today's quests, so the child sees the link between
 * playing and the quest board. Touch-transparent; queues if two land at once.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuestLabel } from '@/components/pop/QuestCard';
import { Icon } from '@/components/common/Icon';
import { ACCENTS, COLORS } from '@/constants/colors';
import { OUTLINE, SHADOWS, SPACING } from '@/constants/dimensions';
import { FONTS } from '@/constants/typography';
import { onQuestDone, type Quest } from '@/sdk/quests/quests';
import { whenOverlayClear } from '@/sdk/layout/overlayGate';

const SHOW_DELAY_MS = 700;
const VISIBLE_MS = 2400;

export function QuestToast() {
  const { t } = useTranslation();
  const label = useQuestLabel();
  const [current, setCurrent] = useState<Quest | null>(null);
  const queue = useRef<Quest[]>([]);
  const busy = useRef(false);
  const enter = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Wait out any modal game overlay: a toast behind it would expire unseen.
    const cancels: (() => void)[] = [];
    const showNext = () => cancels.push(whenOverlayClear(present));
    const present = () => {
      const q = queue.current.shift();
      if (!q) {
        busy.current = false;
        return;
      }
      setCurrent(q);
      enter.setValue(0);
      Animated.spring(enter, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
      timers.push(
        setTimeout(() => {
          Animated.timing(enter, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setCurrent(null);
            showNext();
          });
        }, VISIBLE_MS),
      );
    };
    const off = onQuestDone((q) => {
      queue.current.push(q);
      if (!busy.current) {
        busy.current = true;
        timers.push(setTimeout(showNext, SHOW_DELAY_MS));
      }
    });
    return () => {
      off();
      timers.forEach(clearTimeout);
      cancels.forEach((c) => c());
    };
  }, [enter]);

  if (!current) return null;
  return (
    <View style={styles.anchor} pointerEvents="none">
      <Animated.View
        style={[
          styles.card,
          SHADOWS.md,
          {
            opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) }],
          },
        ]}
      >
        <View style={styles.tick}>
          <Icon name="checkmark" size={20} />
        </View>
        <View>
          <Text style={styles.title}>{t('quests.done')}</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {label(current)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { ...StyleSheet.absoluteFill, alignItems: 'flex-end', paddingTop: 76, paddingEnd: SPACING.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 320,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  tick: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.green.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FONTS.display, fontSize: 18, color: COLORS.ink, textAlign: 'left' },
  sub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.inkSoft, textAlign: 'left' },
});
