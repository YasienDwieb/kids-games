import { useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACCENTS, COLORS, OUTLINE, POP, SHADOWS, SPACING } from '../../constants';
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
 * The first-launch choice between Lulu (girl) and Zain (boy). Shown as
 * characters, never as "boys / girls"; any child picks either. Tapping a card
 * says hi in that buddy's voice; the play button saves it.
 */
export function BuddyPicker({ onDone }: BuddyPickerProps) {
  const { t } = useTranslation();
  const { play, stop } = useSound();
  const [picked, setPicked] = useState<BuddyId | null>(null);
  const float = useLoop(1600);
  const [saving, setSaving] = useState(false);

  const select = (b: BuddyId) => {
    setPicked(b);
    stop();
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
                <Animated.View style={on ? bob(float, 8) : undefined}>
                  <Mascot buddy={b} pose={on ? 'cheer' : 'wave'} size={on ? 172 : 156} bob={false} />
                </Animated.View>
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
          <PressableButton
            accessibilityLabel={t('buddy.go')}
            accent="green"
            disabled={!picked}
            onPress={confirm}
            style={styles.go}
          >
            <Icon name="play" size={34} />
          </PressableButton>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
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
  go: { minWidth: 180 },
});
