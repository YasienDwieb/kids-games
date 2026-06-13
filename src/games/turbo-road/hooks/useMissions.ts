/* Rolling missions (3 active slots), persisted under `kg:turbo-road:missions`.
   Each race reports its stats; completed missions are claimed for coins from
   the StartScreen, and the slot rolls to the next tier of the next type.
   Deterministic — no dates, no randomness. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createStore } from '@/sdk';
import { MISSION_LADDERS, MISSION_TYPES } from '../constants';
import type { Mission, MissionsState, MissionType, RaceStats } from '../types';

/** Build the mission for a type/tier; past the ladder, targets keep growing
    ×1.5 (rounded to 5) so long-term players never run out. */
function buildMission(id: number, type: MissionType, tier: number): Mission {
  const ladder = MISSION_LADDERS[type];
  const last = ladder.targets[ladder.targets.length - 1];
  const overflow = tier - (ladder.targets.length - 1);
  const target =
    overflow <= 0
      ? ladder.targets[tier]
      : Math.round((last * Math.pow(1.5, overflow)) / 5) * 5;
  return {
    id,
    type,
    tier,
    target,
    progress: 0,
    reward: Math.max(10, Math.round(target * ladder.rewardPerTarget)),
  };
}

/** First three slots: coins / first / races (tier 0 of each). */
const DEFAULT_MISSIONS: MissionsState = {
  active: [0, 1, 2].map((i) => buildMission(i + 1, MISSION_TYPES[i], 0)),
  nextId: 4,
};

const missionsStore = createStore<MissionsState>(
  'turbo-road:missions',
  DEFAULT_MISSIONS,
);

function progressFor(type: MissionType, stats: RaceStats): number {
  switch (type) {
    case 'coins':
      return stats.coins;
    case 'first':
      return stats.place === 1 ? 1 : 0;
    case 'races':
      return 1;
    case 'boost':
      return stats.boosts;
    case 'clean':
      return stats.hits === 0 ? 1 : 0;
  }
}

export function useMissions(): {
  missions: Mission[];
  recordRace: (stats: RaceStats) => void;
  /** Returns the coin reward (0 if the mission isn't complete). */
  claim: (id: number) => number;
} {
  const [state, setState] = useState<MissionsState>(DEFAULT_MISSIONS);
  const latest = useRef<MissionsState>(state);

  useEffect(() => {
    let mounted = true;
    missionsStore.get().then((s) => {
      if (!mounted) return;
      latest.current = s;
      setState(s);
    });
    const unsubscribe = missionsStore.subscribe((s) => {
      latest.current = s;
      setState(s);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const commit = useCallback((next: MissionsState) => {
    latest.current = next;
    setState(next);
    missionsStore.set(next).catch(() => {});
  }, []);

  const recordRace = useCallback(
    (stats: RaceStats) => {
      const s = latest.current;
      const active = s.active.map((m) => ({
        ...m,
        progress: Math.min(m.target, m.progress + progressFor(m.type, stats)),
      }));
      commit({ ...s, active });
    },
    [commit],
  );

  const claim = useCallback(
    (id: number): number => {
      const s = latest.current;
      const mission = s.active.find((m) => m.id === id);
      if (!mission || mission.progress < mission.target) return 0;
      // Roll the slot to the next type not already on the board (5 types,
      // 3 slots ⇒ always one free), escalating the tier.
      const usedTypes = new Set(
        s.active.filter((m) => m.id !== id).map((m) => m.type),
      );
      let t = (MISSION_TYPES.indexOf(mission.type) + 1) % MISSION_TYPES.length;
      while (usedTypes.has(MISSION_TYPES[t])) t = (t + 1) % MISSION_TYPES.length;
      const replacement = buildMission(s.nextId, MISSION_TYPES[t], mission.tier + 1);
      commit({
        active: s.active.map((m) => (m.id === id ? replacement : m)),
        nextId: s.nextId + 1,
      });
      return mission.reward;
    },
    [commit],
  );

  return { missions: state.active, recordRace, claim };
}
