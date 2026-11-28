import { useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { track } from '@/sdk/analytics/client';
import { useCelebrate } from '@/sdk/feedback/Celebration';
import { unitId, type MomentUnitData } from '../units';
import { AyahView } from './AyahView';
import { HowToView } from './HowToView';
import { VoicedView } from './VoicedView';

/**
 * One journey moment. Reports `moment_shown` / `moment_done`, celebrates
 * softly only after the voice or recitation is over, then calls `onComplete`.
 */
export function MomentUnit({ data, onComplete }: { data: MomentUnitData; onComplete: () => void }) {
  const { width, height } = useWindowDimensions();
  const celebrate = useCelebrate();
  const size = Math.round(Math.min(width, height) * 0.42);
  const id = unitId(data);
  const finished = useRef(false);

  useEffect(() => {
    track('moment_shown', { type: data.moment.type, id });
  }, [data.moment.type, id]);

  const finish = (misses = 0) => {
    if (finished.current) return;
    finished.current = true;
    track('moment_done', { type: data.moment.type, id, misses });
    void Promise.resolve(celebrate('small')).then(onComplete);
  };

  if (data.kind === 'howto') {
    return <HowToView moment={data.moment} before={data.before} steps={data.steps} onDone={finish} size={size} />;
  }
  if (data.moment.type === 'ayah') return <AyahView moment={data.moment} onDone={() => finish()} size={size} />;
  return <VoicedView moment={data.moment} onDone={() => finish()} size={size} />;
}
