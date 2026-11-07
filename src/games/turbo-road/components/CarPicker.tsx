/**
 * Pick a car — pictures only. Cars unlock as the road trip goes on; a locked
 * one shows a lock. Tapping an open car drives it from now on.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { ACCENTS, COLORS, EmojiImage, Icon, OUTLINE, SHADOWS, SPACING, useTranslation } from '@/sdk';
import { CARS } from '../constants';
import type { CarId } from '../types';

type CarPickerProps = {
  unlocked: readonly CarId[];
  selected: CarId;
  onSelect: (id: CarId) => void;
};

export function CarPicker({ unlocked, selected, onSelect }: CarPickerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <View style={styles.grid}>
        {CARS.map((car) => {
          const open = unlocked.includes(car.id);
          const on = car.id === selected;
          return (
            <Pressable
              key={car.id}
              onPress={() => open && onSelect(car.id)}
              disabled={!open}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !open }}
              accessibilityLabel={open ? t(`turbo-road:cars.${car.id}`) : t('turbo-road:a11y.locked')}
              style={({ pressed }) => [
                styles.tile,
                on ? styles.tileOn : null,
                open ? (pressed ? styles.pressed : SHADOWS.sm) : styles.tileLocked,
              ]}
            >
              <View style={open ? null : styles.faint}>
                <EmojiImage emoji={car.emoji} size={58} />
              </View>
              {open ? null : (
                <View style={styles.lock}>
                  <Icon name="lock-closed" size={22} color={COLORS.inkSoft} />
                </View>
              )}
              {on ? (
                <View style={styles.tick}>
                  <Icon name="checkmark" size={18} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const TILE = 104;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.md, maxWidth: TILE * 4 + SPACING.md * 3 },
  tile: {
    width: TILE,
    height: TILE * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    backgroundColor: COLORS.surface,
  },
  tileOn: { backgroundColor: ACCENTS.green.tint, borderWidth: OUTLINE.thick },
  tileLocked: { backgroundColor: COLORS.canvas2, borderStyle: 'dashed', borderColor: COLORS.inkFaint },
  pressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  faint: { opacity: 0.25 },
  lock: { position: 'absolute' },
  tick: {
    position: 'absolute',
    top: -10,
    end: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENTS.green.base,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
  },
});
