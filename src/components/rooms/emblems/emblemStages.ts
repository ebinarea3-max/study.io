export type EmblemStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const EMBLEM_STAGES: readonly EmblemStage[] = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * Stage thresholds in seconds of today's focus:
 * Stage 0: 0s      (Initial)
 * Stage 1: 900s    (15 min)
 * Stage 2: 2700s   (45 min)
 * Stage 3: 5400s   (1 hr 30 min)
 * Stage 4: 10800s  (3 hr)
 * Stage 5: 18000s  (5 hr)
 * Stage 6: 28800s  (8 hr - Max Level)
 */
export const STAGE_THRESHOLDS = [0, 900, 2700, 5400, 10800, 18000, 28800] as const;

export const STAGE_NAMES = [
  'Awakening',
  'Spark of Focus',
  'Deepening',
  'Flow State',
  'High Momentum',
  'Radiant Mastery',
  'Zenith',
] as const;

/**
 * Derive 0..6 stage from cumulative seconds studied today.
 */
export function stageFromSeconds(seconds: number): EmblemStage {
  const s = Math.max(0, Math.floor(seconds || 0));
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (s >= STAGE_THRESHOLDS[i]) {
      return i as EmblemStage;
    }
  }
  return 0;
}

/**
 * Seconds remaining to advance to the next growth stage.
 * Returns null if the user has reached the maximum stage (Stage 6).
 */
export function secondsToNextStage(seconds: number): number | null {
  const currentStage = stageFromSeconds(seconds);
  if (currentStage >= 6) return null;
  const nextThreshold = STAGE_THRESHOLDS[currentStage + 1];
  return Math.max(0, nextThreshold - Math.max(0, Math.floor(seconds || 0)));
}
