import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { BackButton } from '../components/common';
import { AGE_BANDS, useSettings } from '@/sdk';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { settings, update } = useSettings();

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Sound</Text>
          <Switch value={settings.soundEnabled} onValueChange={(v) => update({ soundEnabled: v })} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Haptics</Text>
          <Switch value={settings.hapticsEnabled} onValueChange={(v) => update({ hapticsEnabled: v })} />
        </View>

        <Text style={styles.subheading}>Show games for</Text>
        <View style={styles.bands}>
          <Text
            style={[styles.band, settings.ageBand === null && styles.bandActive]}
            onPress={() => update({ ageBand: null })}
          >
            All
          </Text>
          {AGE_BANDS.map((band) => (
            <Text
              key={band.id}
              style={[styles.band, settings.ageBand === band.id && styles.bandActive]}
              onPress={() => update({ ageBand: band.id })}
            >
              {band.label}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.light },
  content: { padding: SPACING.lg, paddingTop: SPACING.xl * 2, gap: SPACING.lg },
  heading: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text.primary },
  subheading: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text.primary, marginTop: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: FONT_SIZES.lg, color: COLORS.text.primary },
  bands: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  band: {
    fontSize: FONT_SIZES.md, color: COLORS.text.primary,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.white, borderRadius: 999, overflow: 'hidden',
  },
  bandActive: { backgroundColor: COLORS.primary.blue, color: COLORS.text.inverse },
});
