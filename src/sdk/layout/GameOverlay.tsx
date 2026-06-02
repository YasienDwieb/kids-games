import { Modal, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { COLORS } from '@/constants/colors';

export function GameOverlay({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
  },
});
