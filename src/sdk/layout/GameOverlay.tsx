import { useEffect, type ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { overlayClosed, overlayOpened } from './overlayGate';
import { COLORS } from '@/constants/colors';

export function GameOverlay({ visible, children }: { visible: boolean; children: ReactNode }) {
  useEffect(() => {
    if (!visible) return;
    overlayOpened();
    return overlayClosed;
  }, [visible]);
  return (
    // Translucent bars: the scrim must cover the status and navigation bars too,
    // or a light strip of the game shows around it on Android.
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
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
