import { useMemo } from 'react';
import { useContentConfig } from '@/sdk/content/load';
import type { MomentsConfig } from '@/sdk/content/types';
import type { FlowAdapter } from '@/sdk/flow/adapter';
import { MOMENTS_ID } from '@/sdk/flow/sequence';
import { useSettings } from '@/sdk/settings/useSettings';
import { MomentUnit } from './components/MomentUnit';
import { getMoments } from './registry';
import type { Moment } from './types';
import { momentUnits, unitId } from './units';

/** What the journey needs to slot moments in: their adapter and cadence. */
export type JourneyMoments = { adapter: FlowAdapter; every: number; max: number };

/** Builds the moments' flow adapter; which unit a slot gets rotates with the session seed. */
export function journeyMoments(
  moments: readonly Moment[],
  config: MomentsConfig,
  parentAllows: boolean,
): JourneyMoments | null {
  if (!config.enabled || !parentAllows || config.maxPerJourney <= 0) return null;
  const units = momentUnits(moments, config.types);
  if (units.length === 0) return null;
  const adapter: FlowAdapter = {
    gameId: MOMENTS_ID,
    count: units.length,
    unitAt: (i, seed) => {
      const data = units[(i + seed) % units.length];
      return { key: `moment:${unitId(data)}`, render: (onComplete) => <MomentUnit data={data} onComplete={onComplete} /> };
    },
  };
  return { adapter, every: config.every, max: config.maxPerJourney };
}

/** The journey's moments, or null when off (content config, the parent's switch, or no content). */
export function useJourneyMoments(): JourneyMoments | null {
  const config = useContentConfig();
  const { settings } = useSettings();
  return useMemo(
    () => journeyMoments(getMoments(), config.moments, settings.momentsEnabled),
    [config.moments, settings.momentsEnabled],
  );
}
