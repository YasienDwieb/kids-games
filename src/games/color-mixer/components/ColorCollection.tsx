import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS as TOKENS, FONTS, BORDER_RADIUS, SHADOWS, PressableButton, useTranslation } from '@/sdk';
import { ColorBlob } from './ColorBlob';
import { COLORS, DISCOVERY_HINTS } from '../constants';
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
          <Text style={styles.title}>{t('color-mixer:collection.title')}</Text>
          <PressableButton label={t('color-mixer:collection.done')} accent="blue" onPress={onClose} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Shelf 1 — Famous colors */}
          <View style={styles.shelf}>
            <View style={styles.shelfHeader}>
              <Text style={styles.shelfTitle}>{t('color-mixer:collection.famousShelf')}</Text>
              <Text style={styles.shelfMeta}>
                {discoveries.length}/{FAMOUS_IDS.length} {t('color-mixer:collection.found')}
              </Text>
            </View>
            <View style={styles.grid}>
              {FAMOUS_IDS.map((id) => (
                <FamousSlot key={id} colorId={id} discovered={discoveries.includes(id)} />
              ))}
            </View>
          </View>

          {/* Shelf 2 — My creations */}
          <View style={styles.shelf}>
            <View style={styles.shelfHeader}>
              <Text style={styles.shelfTitle}>{t('color-mixer:collection.creationsShelf')}</Text>
            </View>
            {savedColors.length === 0 ? (
              <Text style={styles.emptyText}>{t('color-mixer:collection.emptyCreations')}</Text>
            ) : (
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
                    <Text style={styles.colorName} numberOfLines={1}>
                      {c.name}
                    </Text>
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
  const hint = DISCOVERY_HINTS[colorId];

  if (discovered) {
    return (
      <View style={styles.slot}>
        <ColorBlob color={colorData.hex} size={56} showShine />
        <Text style={styles.colorName}>{t(`color-mixer:colors.${colorId}`)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <View style={styles.lockedBlob}>
        <Text style={styles.lockedIcon}>?</Text>
      </View>
      {hint ? (
        <Text style={styles.hintText}>{t(`color-mixer:discoveryHints.${colorId}`)}</Text>
      ) : (
        <Text style={styles.lockedName}>{t('color-mixer:collection.lockedName')}</Text>
      )}
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
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: TOKENS.ink,
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
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingStart: 4,
  },
  shelfTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: TOKENS.ink,
  },
  shelfMeta: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: TOKENS.inkSoft,
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
    ...SHADOWS.sm,
  },
  colorName: {
    marginTop: 8,
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    color: TOKENS.ink,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    end: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TOKENS.line2,
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
  lockedName: {
    marginTop: 8,
    fontFamily: FONTS.bodySemi,
    fontSize: 12,
    color: TOKENS.inkFaint,
    textAlign: 'center',
  },
  hintText: {
    marginTop: 6,
    fontFamily: FONTS.bodySemi,
    fontSize: 10,
    color: TOKENS.inkSoft,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: TOKENS.inkSoft,
    paddingStart: 4,
  },
});
