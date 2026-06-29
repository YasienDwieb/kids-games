import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, Chip, HoldToConfirm } from '../components/common';
import {
  AGE_BANDS,
  useSettings,
  useTranslation,
  useLanguage,
  LANGUAGES,
  eligibleGameIds,
  getGame,
  gameName,
  createFlowProgressStore,
  type LanguageCode,
} from '@/sdk';
import { reloadApp } from '@/sdk/i18n/reload';
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
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [switching, setSwitching] = useState(false);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const flowGames = eligibleGameIds(); // games that registered a flow adapter
  const selectedGameIds = settings.flowGameIds; // null = all

  const isGameOn = (id: string) => selectedGameIds == null || selectedGameIds.includes(id);

  const labelForGame = (id: string) => {
    const game = getGame(id);
    return game ? gameName(game) : id;
  };

  const toggleGame = (id: string) => {
    const current = selectedGameIds ?? flowGames;
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // All selected → store null (means "all"); else store the explicit list.
    update({ flowGameIds: next.length === flowGames.length ? null : next });
  };

  const flowStore = useMemo(() => createFlowProgressStore(), []);
  const resetJourney = () => {
    flowStore.set({ step: 0, seed: 0, updatedAt: Date.now() });
  };

  const onPickLanguage = async (code: LanguageCode) => {
    if (code === language) return;
    const { needsReload } = await changeLanguage(code);
    if (needsReload) {
      // Show the "Switching…" notice, then auto-reload to flip RTL direction.
      setSwitching(true);
      setTimeout(() => reloadApp(), 600);
    }
  };

  if (switching) {
    return (
      <SafeAreaView style={[styles.safe, styles.switchScreen]} edges={['top', 'bottom']}>
        <Text style={styles.switchEmoji}>🌍</Text>
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text style={styles.switchText}>{t('settings.switching')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppBar title={t('settings.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.columns, landscape && styles.columnsLandscape]}>
          {/* Left column: sound/haptics toggles + guided journey game selection */}
          <View style={[styles.column, landscape && styles.columnLandscape]}>
            <View style={styles.card}>
              <ToggleRow
                icon="🔊"
                label={t('settings.sound')}
                value={settings.soundEnabled}
                onChange={(v) => update({ soundEnabled: v })}
              />
              <View style={styles.divider} />
              <ToggleRow
                icon="📳"
                label={t('settings.haptics')}
                value={settings.hapticsEnabled}
                onChange={(v) => update({ hapticsEnabled: v })}
              />
            </View>

            <Text style={styles.section}>{t('settings.guided.games')}</Text>
            <View style={styles.bands}>
              {flowGames.map((id) => (
                <Chip
                  key={id}
                  label={labelForGame(id)}
                  active={isGameOn(id)}
                  onPress={() => toggleGame(id)}
                />
              ))}
            </View>

            <Text style={styles.section}>{t('settings.guided.reset')}</Text>
            <HoldToConfirm
              label={t('flow.holdToReset')}
              accent="coral"
              onConfirm={resetJourney}
            />
          </View>

          {/* Right column: language + age band */}
          <View style={[styles.column, landscape && styles.columnLandscape]}>
            <Text style={styles.section}>{t('settings.language')}</Text>
            <View style={styles.bands}>
              {LANGUAGES.map((lang) => (
                <Chip
                  key={lang.code}
                  label={lang.label}
                  active={language === lang.code}
                  onPress={() => onPickLanguage(lang.code)}
                />
              ))}
            </View>

            <Text style={styles.section}>{t('settings.showGamesFor')}</Text>
            <View style={styles.bands}>
              <Chip
                label={t('settings.all')}
                active={settings.ageBand === null}
                onPress={() => update({ ageBand: null })}
              />
              {AGE_BANDS.map((band) => (
                <Chip
                  key={band.id}
                  label={t(`ageBands.${band.id}`)}
                  active={settings.ageBand === band.id}
                  onPress={() => update({ ageBand: band.id })}
                />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.version}>{t('settings.version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.canvas },
  switchScreen: { alignItems: 'center', justifyContent: 'center', gap: SPACING.lg },
  switchEmoji: { fontSize: 56 },
  switchText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.ink,
  },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  // Portrait: single column; landscape: row of two equal columns
  columns: { flexDirection: 'column', gap: SPACING.lg },
  columnsLandscape: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xl },
  column: { gap: SPACING.lg },
  columnLandscape: { flex: 1 },
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
