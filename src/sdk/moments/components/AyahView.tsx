import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';
import { fontsFor } from '@/constants/typography';
import { releasePlayer } from '@/sdk/audio/releasePlayer';
import { stopSpeech } from '@/sdk/speech/useSpeech';
import type { AyahMoment } from '../types';
import { MomentFrame } from './MomentFrame';

/**
 * A short surah: the illustration, the ayahs in Arabic, and the recitation.
 * Not muted by the sound setting (it's the lesson, like speech). The check
 * button appears only once the recitation has finished; tapping the picture
 * plays it again. Nothing else plays over it.
 */
export function AyahView({ moment, onDone, size }: { moment: AyahMoment; onDone: () => void; size: number }) {
  const { t } = useTranslation();
  const [ended, setEnded] = useState(false);
  const player = useRef<AudioPlayer | null>(null);

  const play = useCallback(() => {
    const p = player.current;
    if (!p) return;
    stopSpeech();
    try {
      p.seekTo(0);
      p.play();
    } catch {
      setEnded(true); // a dead player must not trap the child here
    }
  }, []);

  useEffect(() => {
    let p: AudioPlayer;
    try {
      p = createAudioPlayer(moment.audio);
    } catch {
      setEnded(true);
      return;
    }
    player.current = p;
    p.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish || s.error) setEnded(true);
    });
    play();
    return () => {
      player.current = null;
      releasePlayer(p);
    };
  }, [moment.audio, play]);

  return (
    <MomentFrame image={moment.image} ready={ended} onDone={onDone} size={size}>
      <Pressable onPress={play} accessibilityRole="button" accessibilityLabel={t('moments.listenAgain')}>
        <Text style={styles.ayah}>{moment.textAr}</Text>
      </Pressable>
    </MomentFrame>
  );
}

const styles = StyleSheet.create({
  ayah: {
    // Always the Arabic face, also in an English UI.
    fontFamily: fontsFor('ar').displayMedium,
    fontSize: 30,
    lineHeight: 52,
    color: COLORS.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingHorizontal: 16,
  },
});
