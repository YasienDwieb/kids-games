import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { AppBar, Chip } from '../components/common';
import {
  AGE_BANDS,
  useSettings,
  useTranslation,
  useLanguage,
  LANGUAGES,
  getAllTopics,
  createFlowProgressStore,
  DEFAULT_FLOW_PROGRESS,
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

  const topics = getAllTopics();
  const selectedTopicIds = settings.flowTopicIds; // null = all

  const isTopicOn = (id: string) => selectedTopicIds == null || selectedTopicIds.includes(id);

  const toggleTopic = (id: string) => {
    const current = selectedTopicIds ?? topics.map((tp) => tp.id);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    // All selected → store null (means "all"); else store the explicit list.
    update({ flowTopicIds: next.length === topics.length ? null : next });
  };

  const resetJourney = () => {
    createFlowProgressStore().set({ ...DEFAULT_FLOW_PROGRESS, updatedAt: Date.now() });
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

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('settings.guided.section')}</Text>
          <ToggleRow
            icon="🧭"
            label={t('settings.guided.mode')}
            value={settings.mode === 'guided'}
            onChange={(v) => update({ mode: v ? 'guided' : 'free' })}
          />
          {settings.mode === 'guided' ? (
            <>
              <Text style={styles.sectionLabel}>{t('settings.guided.topics')}</Text>
              <View style={styles.topicRow}>
                {topics.map((tp) => (
                  <Chip
                    key={tp.id}
                    label={tp.id}
                    active={isTopicOn(tp.id)}
                    onPress={() => toggleTopic(tp.id)}
                  />
                ))}
              </View>
              <ToggleRow
                icon="🏁"
                label={t('settings.guided.reset')}
                value={false}
                onChange={() => resetJourney()}
              />
            </>
          ) : null}
        </View>

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
  sectionLabel: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkSoft,
    marginBottom: SPACING.sm,
  },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: SPACING.md },
  version: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.inkFaint,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
