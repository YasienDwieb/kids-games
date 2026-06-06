import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, Chip } from '../components/common';
import { AGE_BANDS, useSettings } from '@/sdk';
import { COLORS, FONTS, SPACING } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.line2, true: COLORS.brand }}
        thumbColor={COLORS.surface}
        ios_backgroundColor={COLORS.line2}
      />
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { settings, update } = useSettings();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ToggleRow
            icon="🔊"
            label="Sound effects"
            value={settings.soundEnabled}
            onChange={(v) => update({ soundEnabled: v })}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="📳"
            label="Haptics"
            value={settings.hapticsEnabled}
            onChange={(v) => update({ hapticsEnabled: v })}
          />
        </View>

        <Text style={styles.section}>Show games for</Text>
        <View style={styles.bands}>
          <Chip label="All" active={settings.ageBand === null} onPress={() => update({ ageBand: null })} />
          {AGE_BANDS.map((band) => (
            <Chip
              key={band.id}
              label={band.label}
              active={settings.ageBand === band.id}
              onPress={() => update({ ageBand: band.id })}
            />
          ))}
        </View>

        <Text style={styles.version}>Kids Games · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 22, gap: SPACING.lg },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  rowIcon: { fontSize: 24 },
  rowLabel: { flex: 1, fontFamily: FONTS.body, fontSize: 16, color: COLORS.ink },
  divider: { height: 1, backgroundColor: COLORS.line },
  section: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: -SPACING.sm,
  },
  bands: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  version: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkFaint,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
