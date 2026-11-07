import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, BORDER_RADIUS, OUTLINE, SHADOWS, Icon, PressableButton, useTranslation } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { COLORS } from '../constants';
import { FAMOUS_IDS } from '../utils';
import type { ColorId, SavedColor } from '../types';

type MyColorsProps = {
  visible: boolean;
  discoveries: ColorId[];
  savedColors: SavedColor[];
  onDeleteSaved: (id: string) => void;
  onClose: () => void;
};

export function ColorCollection({
  visible,
  discoveries,
  savedColors,
  onDeleteSaved,
  onClose,
}: MyColorsProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <PressableButton accessibilityLabel={t('color-mixer:collection.done')} accent="blue" onPress={onClose}>
            <Icon name="checkmark" size={28} />
          </PressableButton>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Shelf 1 — Famous colors */}
          <View style={styles.shelf}>
            <View style={styles.grid}>
              {FAMOUS_IDS.map((id) => (
                <FamousSlot key={id} colorId={id} discovered={discoveries.includes(id)} />
              ))}
            </View>
          </View>

          {/* Shelf 2 — My creations */}
          <View style={styles.shelf}>
            {savedColors.length === 0 ? null : (
              <View style={styles.grid}>
                {savedColors.map((c) => (
                  <View key={c.id} style={styles.slot}>
                    <Pressable
                      onPress={() => onDeleteSaved(c.id)}
                      hitSlop={8}
                      style={styles.deleteButton}
                      accessibilityLabel={`${t('color-mixer:collection.deleteLabel')} ${c.name}`}
                    >
                      <Text style={styles.deleteIcon}>×</Text>
                    </Pressable>
                    <ColorBlob color={c.hex} size={56} showShine />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function FamousSlot({ colorId, discovered }: { colorId: ColorId; discovered: boolean }) {
  const { t } = useTranslation();
  const colorData = COLORS[colorId];

  if (discovered) {
    return (
      <View style={styles.slot} accessible accessibilityLabel={t(`color-mixer:colors.${colorId}`)}>
        <ColorBlob color={colorData.hex} size={56} showShine />
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <View style={styles.lockedBlob}>
        <Text style={styles.lockedIcon}>?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  shelf: {
    marginBottom: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slot: {
    width: 96,
    alignItems: 'center',
    backgroundColor: TOKENS.surface,
    borderRadius: BORDER_RADIUS.card,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: OUTLINE.base,
    borderColor: OUTLINE.color,
    ...SHADOWS.sm,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    end: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TOKENS.line2,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  deleteIcon: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    lineHeight: 18,
    color: TOKENS.ink,
  },
  lockedBlob: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TOKENS.canvas2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TOKENS.line2,
    borderStyle: 'dashed',
  },
  lockedIcon: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: TOKENS.inkFaint,
  },
});
