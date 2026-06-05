import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS as TOKENS, FONTS, BORDER_RADIUS, SHADOWS, PressableButton } from '@/sdk';
import { ColorBlob } from './ColorBlob';

interface ColorNamingDialogProps {
  visible: boolean;
  colorHex: string | null;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function ColorNamingDialog({ visible, colorHex, onSave, onCancel }: ColorNamingDialogProps) {
  const [name, setName] = useState('');

  const handleSave = () => {
    onSave(name.trim() || 'My Color');
    setName('');
  };

  const handleCancel = () => {
    setName('');
    onCancel();
  };

  if (!colorHex) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Save your color! 🎨</Text>

          <View style={styles.preview}>
            <ColorBlob color={colorHex} size={80} showShine />
          </View>

          <Text style={styles.label}>Name your color:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sunset"
            placeholderTextColor={TOKENS.inkFaint}
            autoFocus
            maxLength={20}
          />

          <View style={styles.buttons}>
            <PressableButton
              label="Cancel"
              variant="ghost"
              onPress={handleCancel}
              style={styles.button}
            />
            <PressableButton
              label="Save"
              accent="blue"
              onPress={handleSave}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: TOKENS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: TOKENS.surface,
    borderRadius: BORDER_RADIUS.tile,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    ...SHADOWS.lg,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: TOKENS.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  preview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontFamily: FONTS.bodySemi,
    fontSize: 15,
    color: TOKENS.inkSoft,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: TOKENS.line2,
    borderRadius: BORDER_RADIUS.soft,
    padding: 12,
    fontFamily: FONTS.body,
    fontSize: 18,
    color: TOKENS.ink,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
