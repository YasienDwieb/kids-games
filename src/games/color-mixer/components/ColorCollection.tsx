import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ColorBlob } from './ColorBlob';
import { ALL_COLOR_IDS, COLOR_GROUPS, COLORS, DISCOVERY_HINTS } from '../constants';
import type { ColorId } from '../types';

type ColorCollectionProps = {
  unlockedColors: ColorId[];
  visible: boolean;
  onClose: () => void;
};

export function ColorCollection({ unlockedColors, visible, onClose }: ColorCollectionProps) {
  const total = ALL_COLOR_IDS.length;
  const discovered = unlockedColors.length;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Colors</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
          >
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.progressArea}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(discovered / total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {discovered} of {total} colors discovered
          </Text>
        </View>

        {/* Color groups */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {COLOR_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.grid}>
                {group.colors.map((colorId) => (
                  <ColorSlot
                    key={colorId}
                    colorId={colorId}
                    unlocked={unlockedColors.includes(colorId)}
                  />
                ))}
              </View>
            </View>
          ))}

          {discovered === total && (
            <View style={styles.completeArea}>
              <Text style={styles.completeEmoji}>🏆</Text>
              <Text style={styles.completeText}>You found them all!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function ColorSlot({ colorId, unlocked }: { colorId: ColorId; unlocked: boolean }) {
  const colorData = COLORS[colorId];
  const hint = DISCOVERY_HINTS[colorId];

  if (unlocked) {
    return (
      <View style={styles.slot}>
        <ColorBlob color={colorData.hex} size={56} showShine />
        <Text style={styles.colorName}>{colorData.name}</Text>
      </View>
    );
  }

  return (
    <View style={styles.slot}>
      <View style={styles.lockedBlob}>
        <Text style={styles.lockedIcon}>?</Text>
      </View>
      {hint && <Text style={styles.hintText}>{hint}</Text>}
      {!hint && <Text style={styles.lockedName}>???</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFE082',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5D4037',
  },
  closeButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  closePressed: {
    opacity: 0.7,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
  },
  progressArea: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFE082',
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8F00',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#795548',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6D4C41',
    marginBottom: 12,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slot: {
    width: 90,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  colorName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#424242',
    textAlign: 'center',
  },
  lockedBlob: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BDBDBD',
    borderStyle: 'dashed',
  },
  lockedIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: '#9E9E9E',
  },
  lockedName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#BDBDBD',
    textAlign: 'center',
  },
  hintText: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '500',
    color: '#9E9E9E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  completeArea: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 20,
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  completeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF8F00',
  },
});
