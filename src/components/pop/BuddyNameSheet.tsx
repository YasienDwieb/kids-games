import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { COLORS, FONTS, OUTLINE, SHADOWS, SPACING } from '../../constants';
import {
  BUDDIES,
  MAX_NAME_LENGTH,
  MAX_TAKE,
  buddyNameFor,
  clearBuddyName,
  pruneClips,
  recordWelcome,
  saveBuddyName,
  type BuddyId,
  type NameLang,
  type RecordError,
} from '@/sdk';
import { releasePlayer } from '@/sdk/audio/releasePlayer';
import { AppBar } from '../common/AppBar';
import { ParentGate } from '../common/ParentGate';
import { PressableButton } from '../common/PressableButton';

const CALM_BG = '#F3F0FF';
const LANGS: NameLang[] = ['en', 'ar'];
// The worker has the full rule; this only catches obvious typos before a round trip.
const NOT_A_NAME = /[0-9<>@#$%^&*_=+{}[\]|\\/:;"!?.,()~`]/;

type BuddyNameSheetProps = {
  buddy: BuddyId;
  /** Ask the parent gate first (skip when the caller is already behind it). */
  gated?: boolean;
  onClose: () => void;
};

type Clip = { uri: string; take: number };

/**
 * Grown-up screen to rename the buddy: type the name (English and optionally
 * Arabic letters), record the welcome line with it, listen, retry, save.
 */
export function BuddyNameSheet({ buddy, gated = false, onClose }: BuddyNameSheetProps) {
  const { t } = useTranslation();
  const saved = buddyNameFor(buddy);
  const builtIn = t(`buddy.${buddy}.name`);
  const [passed, setPassed] = useState(!gated);
  const [en, setEn] = useState(saved?.en ?? '');
  const [ar, setAr] = useState(saved?.ar ?? '');
  const [clips, setClips] = useState<Partial<Record<NameLang, Clip>>>({});
  const [busy, setBusy] = useState<NameLang | 'all' | null>(null);
  const [error, setError] = useState<RecordError | null>(null);
  const player = useRef<AudioPlayer | null>(null);

  useEffect(
    () => () => {
      if (player.current) releasePlayer(player.current);
    },
    [],
  );

  const spoken = (lang: NameLang) => (lang === 'ar' ? ar.trim() || en.trim() : en.trim());
  const valid = (s: string) => s.length > 0 && [...s].length <= MAX_NAME_LENGTH && !NOT_A_NAME.test(s);

  const listen = (uri: string) => {
    if (player.current) releasePlayer(player.current);
    try {
      player.current = createAudioPlayer({ uri });
      player.current.play();
    } catch {
      player.current = null;
    }
  };

  const record = async (langs: NameLang[], take: (lang: NameLang) => number) => {
    if (!LANGS.every((l) => valid(spoken(l)))) {
      setError('invalid');
      return;
    }
    setError(null);
    setBusy(langs.length > 1 ? 'all' : langs[0]);
    const next = { ...clips };
    for (const lang of langs) {
      const res = await recordWelcome(buddy, lang, spoken(lang), take(lang));
      if (!res.ok) {
        setError(res.error);
        break;
      }
      next[lang] = { uri: res.uri, take: take(lang) };
    }
    setClips(next);
    setBusy(null);
    const shown = next[langs[0]];
    if (shown) listen(shown.uri);
  };

  const keepUris = (extra: Partial<Record<NameLang, string>> = {}) =>
    BUDDIES.flatMap((b) => Object.values(buddyNameFor(b)?.clips ?? {})).concat(Object.values(extra) as string[]);

  const save = async () => {
    const uris = { en: clips.en?.uri, ar: clips.ar?.uri };
    if (!uris.en || !uris.ar) return;
    await saveBuddyName(buddy, { en: en.trim(), ar: ar.trim(), clips: { en: uris.en, ar: uris.ar } });
    pruneClips(keepUris(uris as Record<NameLang, string>));
    onClose();
  };

  const reset = async () => {
    await clearBuddyName(buddy);
    pruneClips(keepUris());
    onClose();
  };

  const cancel = () => {
    pruneClips(keepUris());
    onClose();
  };

  const edit = (lang: NameLang, value: string) => {
    (lang === 'en' ? setEn : setAr)(value);
    setClips({});
    setError(null);
  };

  if (!passed) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.root]}>
        <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
          <AppBar title={t('buddyName.title')} onBack={onClose} />
          <ParentGate onPass={() => setPassed(true)} />
        </SafeAreaView>
      </View>
    );
  }

  const ready = !!clips.en && !!clips.ar;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <AppBar title={t('buddyName.title')} onBack={cancel} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.card, SHADOWS.sm]}>
              <Text style={styles.body}>{t('buddyName.intro', { name: builtIn })}</Text>
              {LANGS.map((lang) => (
                <View key={lang} style={styles.field}>
                  <Text style={styles.label}>{t(`buddyName.label.${lang}`)}</Text>
                  <TextInput
                    value={lang === 'en' ? en : ar}
                    onChangeText={(v) => edit(lang, v)}
                    placeholder={lang === 'en' ? builtIn : ''}
                    maxLength={MAX_NAME_LENGTH + 10}
                    autoCorrect={false}
                    autoCapitalize="words"
                    style={[styles.input, lang === 'ar' && styles.inputAr]}
                    accessibilityLabel={t(`buddyName.label.${lang}`)}
                  />
                  {clips[lang] ? (
                    <View style={styles.row}>
                      <PressableButton
                        label={t('buddyName.listen', { lang: t(`buddyName.lang.${lang}`) })}
                        accent="blue"
                        onPress={() => listen(clips[lang]!.uri)}
                      />
                      <PressableButton
                        label={t('buddyName.retry')}
                        variant="ghost"
                        disabled={busy !== null || clips[lang]!.take >= MAX_TAKE}
                        onPress={() => void record([lang], () => clips[lang]!.take + 1)}
                      />
                      {busy === lang ? <ActivityIndicator color={COLORS.ink} /> : null}
                    </View>
                  ) : null}
                </View>
              ))}
              {error ? <Text style={styles.error}>{t(`buddyName.errors.${error}`)}</Text> : null}
              <Text style={styles.note}>{t('buddyName.privacy')}</Text>
            </View>

            <View style={styles.actions}>
              {ready ? (
                <PressableButton label={t('buddyName.save')} accent="green" onPress={() => void save()} />
              ) : (
                <PressableButton
                  label={busy === 'all' ? t('buddyName.recording') : t('buddyName.record')}
                  accent="green"
                  disabled={busy !== null || !en.trim()}
                  onPress={() => void record(LANGS, () => 1)}
                />
              )}
              {saved ? (
                <PressableButton label={t('buddyName.reset', { name: builtIn })} variant="ghost" onPress={() => void reset()} />
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: CALM_BG },
  flex: { flex: 1 },
  content: { padding: SPACING.md, gap: SPACING.md, alignItems: 'stretch' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  body: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.ink },
  field: { gap: 6 },
  label: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.inkSoft },
  input: {
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.ink,
    borderWidth: OUTLINE.thin,
    borderColor: OUTLINE.color,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.canvas,
  },
  inputAr: { writingDirection: 'rtl', textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  error: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.error },
  note: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.inkSoft },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center' },
});
