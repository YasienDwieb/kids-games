import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSpeech } from '@/sdk/speech/useSpeech';
import type { DuaMoment, HadithMoment } from '../types';
import { MomentFrame } from './MomentFrame';

/** Rough time to say `text`, so the check button waits for the voice. */
export function speakingMs(text: string): number {
  return Math.max(1500, text.length * 80);
}

/**
 * A hadith or dua: the illustration and the line voiced in the UI language;
 * a dua then says its Arabic. The check button appears once the voice is done.
 */
export function VoicedView({
  moment,
  onDone,
  size,
}: {
  moment: HadithMoment | DuaMoment;
  onDone: () => void;
  size: number;
}) {
  const { t } = useTranslation();
  const { speak } = useSpeech();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const line = t(`moments:${moment.textKey}`);
    const timers: ReturnType<typeof setTimeout>[] = [];
    void speak(line);
    let wait = speakingMs(line);
    if (moment.type === 'dua') {
      const ar = moment.textAr;
      timers.push(setTimeout(() => void speak(ar, { language: 'ar' }), wait));
      wait += speakingMs(ar);
    }
    timers.push(setTimeout(() => setReady(true), wait));
    return () => timers.forEach(clearTimeout);
  }, [moment, speak, t]);

  return <MomentFrame image={moment.image} ready={ready} onDone={onDone} size={size} />;
}
