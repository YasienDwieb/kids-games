import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACCENTS, COLORS, FONTS, OUTLINE, POP, SHADOWS, SPACING } from '../../constants';
import { BUDDIES, Mascot, chooseBuddy, currentLanguage, useSound, type BuddyId } from '@/sdk';
import { Icon } from '../common/Icon';
import { PressableButton } from '../common/PressableButton';
import { PopBackdrop } from './PopBackdrop';
import { bob, useLoop } from './motion';

/** Card colour per buddy: Lulu keeps her lavender, Zain gets tangerine. */
const CARD = {
  lulu: { fill: ACCENTS.purple.tint, edge: ACCENTS.purple.deep },
  zain: { fill: ACCENTS.orange.tint, edge: ACCENTS.orange.deep },
} as const;

type BuddyPickerProps = {
  /** Called once the child confirms (after the choice is saved). */
  onDone?: () => void;
};

/**
 * "Pick your buddy!" — the first-launch choice between Lulu (girl) and Zain
 * (boy). Shown as characters, never as "boys / girls"; any child picks either.
 * Tapping a card says hi in that buddy's voice; "Let's go!" saves it.
 */
export function BuddyPicker({ onDone }: BuddyPickerProps) {
  const { t } = useTranslation();
  const { play } = useSound();
  const [picked, setPicked] = useState<BuddyId | null>(null);
  const float = useLoop(1600);
  const [saving, setSaving] = useState(false);

  const select = (b: BuddyId) => {
    setPicked(b);
    play(`${b}.tap.${currentLanguage()}.1`, { haptic: true });
  };

  const confirm = async () => {
    if (!picked || saving) return;
    setSaving(true);
    await chooseBuddy(picked);
    onDone?.();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <PopBackdrop color={POP.zap} stripe={POP.zapDeep} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={[styles.titlePill, SHADOWS.md]}>
          <Text style={styles.title}>{t('buddy.pickTitle')}</Text>
        </View>

        <View style={styles.cards}>
          {BUDDIES.map((b) => {
            const on = picked === b;
            return (
              <Pressable
                key={b}
                onPress={() => select(b)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t(`buddy.${b}.name`)}, ${t(`buddy.${b}.species`)}`}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: on ? CARD[b].fill : COLORS.surface },
                  on ? [styles.cardOn, { borderColor: CARD[b].edge }, SHADOWS.lg] : SHADOWS.md,
                  pressed && styles.pressed,
                ]}
              >
                {on ? (
                  <View style={[styles.bubble, SHADOWS.sm]}>
                    <Text style={styles.bubbleText}>{t(`buddy.${b}.hello`)}</Text>
                  </View>
                ) : null}
                <Animated.View style={on ? bob(float, 8) : undefined}>
                  <Mascot buddy={b} pose={on ? 'cheer' : 'wave'} size={on ? 124 : 112} bob={false} />
                </Animated.View>
                <Text style={styles.name}>{t(`buddy.${b}.name`)}</Text>
                <Text style={styles.species}>{t(`buddy.${b}.species`)}</Text>
                {on ? (
                  <View style={styles.tick}>
                    <Icon name="checkmark" size={20} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>{t('buddy.anyTime')}</Text>
          <PressableButton
            label={t('buddy.go')}
            accent="green"
            disabled={!picked}
            onPress={confirm}
            style={styles.go}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  titlePill: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    borderRadius: 18,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  title: { fontFamily: FONTS.display, fontSize: 30, color: COLORS.ink },
  cards: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 64, paddingVertical: 8 },
  card: {
    width: 250,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
  cardOn: { borderWidth: OUTLINE.thick, transform: [{ rotate: '2deg' }] },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  name: { fontFamily: FONTS.display, fontSize: 28, color: COLORS.ink },
  species: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.inkSoft },
  bubble: {
    position: 'absolute',
    top: 10,
    end: -46,
    zIndex: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderBottomStartRadius: 4,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  bubbleText: { fontFamily: FONTS.display, fontSize: 17, color: POP.grape },
  tick: {
    position: 'absolute',
    top: -14,
    start: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: ACCENTS.green.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  hint: { fontFamily: FONTS.bodyExtra, fontSize: 14, color: COLORS.ink },
  go: { minWidth: 180 },
});
