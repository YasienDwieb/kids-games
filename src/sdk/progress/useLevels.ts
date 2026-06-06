import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createProgressStore, DEFAULT_PROGRESS, type Progress } from './store';
import { resumeStatusFor, type ResumeStatus } from './status';
import type { LevelSource } from './source';

export type UseLevelsResult<T> = {
  status: ResumeStatus;
  level: number; // current 1-based level
  data: T; // memoized source.get(level)
  score: number;
  isLast: boolean; // finite source && level >= count
  start: () => void; // resume from saved level → 'playing'
  startOver: () => void; // reset to level 1, score 0 → 'playing'
  advance: (deltaScore?: number) => void; // next level (+ score), persist
  addScore: (delta: number) => void; // bump score, persist
  goTo: (level: number) => void; // jump, persist
};

export function useLevels<T>(options: {
  gameId: string;
  source: LevelSource<T>;
}): UseLevelsResult<T> {
  const { gameId, source } = options;
  const store = useMemo(() => createProgressStore(gameId), [gameId]);

  const [status, setStatus] = useState<ResumeStatus>('loading');
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const live = useRef<Progress>(DEFAULT_PROGRESS);

  // Load the saved checkpoint once; decide whether to prompt for resume.
  useEffect(() => {
    let mounted = true;
    store.get().then((saved) => {
      if (!mounted) return;
      live.current = saved;
      setProgress(saved);
      setStatus(resumeStatusFor(saved));
    });
    return () => {
      mounted = false;
    };
  }, [store]);

  const persist = useCallback(
    (next: Progress) => {
      live.current = next;
      setProgress(next);
      store.set(next); // fire-and-forget, same pattern as useSettings.update
    },
    [store],
  );

  const start = useCallback(() => setStatus('playing'), []);

  const startOver = useCallback(() => {
    persist({ level: 1, score: 0, updatedAt: Date.now() });
    setStatus('playing');
  }, [persist]);

  const advance = useCallback(
    (deltaScore = 0) => {
      const cur = live.current;
      const max = source.count;
      const nextLevel = max != null ? Math.min(cur.level + 1, max) : cur.level + 1;
      persist({ level: nextLevel, score: cur.score + deltaScore, updatedAt: Date.now() });
    },
    [persist, source],
  );

  const addScore = useCallback(
    (delta: number) => {
      const cur = live.current;
      persist({ ...cur, score: cur.score + delta, updatedAt: Date.now() });
    },
    [persist],
  );

  const goTo = useCallback(
    (level: number) => {
      const cur = live.current;
      persist({ ...cur, level, updatedAt: Date.now() });
    },
    [persist],
  );

  const data = useMemo(() => source.get(progress.level), [source, progress.level]);
  const isLast = source.count != null && progress.level >= source.count;

  return {
    status,
    level: progress.level,
    data,
    score: progress.score,
    isLast,
    start,
    startOver,
    advance,
    addScore,
    goTo,
  };
}
