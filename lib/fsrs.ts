/**
 * Free Spaced Repetition Scheduler (FSRS v4.5 / v5)
 * Implementation for Australian Pharmacy Learning Platform
 *
 * Implements modern memory science parameters:
 * - S: Stability (days until retrievability drops to 90%)
 * - D: Difficulty (1 to 10 scale of intrinsic item hardness)
 * - R: Retrievability (estimated probability of recall 0.0 - 1.0)
 * - Lapses: Number of times forgotten
 */

export type FSRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface FSRSItemState {
  stability: number;       // S (in days)
  difficulty: number;      // D (1.0 to 10.0)
  lapses: number;          // Count of forget events
  lastReviewedDate?: string; // ISO string
  reps: number;            // Total reviews count
}

export interface FSRSScheduleResult {
  nextReviewDate: string; // ISO string
  intervalDays: number;
  newStability: number;
  newDifficulty: number;
  retrievabilityBeforeReview: number; // 0 - 100%
  lapses: number;
}

// Standard optimized FSRS weights
const FSRS_DEFAULTS = {
  w: [
    0.40255, // w0: Initial stability for Again
    1.18385, // w1: Initial stability for Hard
    3.173,   // w2: Initial stability for Good
    7.000,   // w3: Initial stability for Easy
    5.0,     // w4: Initial difficulty mean
    1.2,     // w5: Difficulty adjustment factor
    0.95,    // w6: Difficulty mean reversion
    0.2,     // w7: Difficulty delta
    1.6,     // w8: Recall stability multiplier
    0.2,     // w9: Stability decay power
    0.9,     // w10: Retention boost
    2.1,     // w11: Forget stability base
    0.2,     // w12: Forget difficulty power
    0.3,     // w13: Forget stability power
    0.4,     // w14: Forget retention factor
  ],
  requestedRetention: 0.90, // Target 90% recall probability
  decayFactor: 19 / 81,      // Standard power decay constant ~0.2345679
};

/**
 * Calculate current Retrievability (Recall Probability) in percentage [0, 100]%
 * R(t, S) = (1 + factor * (t / S))^(-0.5)
 */
export function calculateFSRSRetention(
  stability: number | undefined,
  lastReviewedDateStr: string | undefined,
  fallbackBox: number = 1
): number {
  // If stability is not set yet, estimate from box or initial default
  const effectiveStability = stability && stability > 0
    ? stability
    : fallbackBox === 1 ? 1.0 : fallbackBox === 2 ? 3.0 : fallbackBox === 3 ? 7.0 : fallbackBox === 4 ? 14.0 : 30.0;

  if (!lastReviewedDateStr) {
    // If never reviewed, new card has 100% initial retention
    return 100;
  }

  const lastTime = new Date(lastReviewedDateStr).getTime();
  if (isNaN(lastTime)) return 95;

  const nowTime = Date.now();
  const elapsedDays = Math.max(0, (nowTime - lastTime) / (1000 * 60 * 60 * 24));

  if (elapsedDays === 0) return 100;

  // Power decay formula
  const r = Math.pow(1 + FSRS_DEFAULTS.decayFactor * (elapsedDays / effectiveStability), -0.5);
  const clampedR = Math.max(0.01, Math.min(1.0, r));

  return Math.round(clampedR * 100);
}

/**
 * Calculate interval in days needed to reach the target retention rate
 */
export function calculateFSRSInterval(stability: number, targetRetention = FSRS_DEFAULTS.requestedRetention): number {
  if (stability <= 0) return 1;
  const factor = FSRS_DEFAULTS.decayFactor;
  // I = (S / factor) * (R^(-2) - 1)
  const interval = (stability / factor) * (Math.pow(targetRetention, -2) - 1);
  return Math.max(1, Math.round(interval));
}

/**
 * Process a card review rating and calculate new FSRS parameters & next review date
 */
export function scheduleFSRSNextReview(
  currentState: FSRSItemState | undefined,
  rating: FSRSRating,
  fallbackBox: number = 1
): FSRSScheduleResult {
  const isInitial = !currentState || currentState.reps === 0 || !currentState.stability;
  const currentLapses = currentState?.lapses || 0;
  const currentReps = (currentState?.reps || 0) + 1;

  let newStability: number;
  let newDifficulty: number;
  let newLapses = currentLapses;

  const retrievabilityBefore = calculateFSRSRetention(
    currentState?.stability,
    currentState?.lastReviewedDate,
    fallbackBox
  );

  if (isInitial) {
    // Initial rating for a new card
    switch (rating) {
      case 'again':
        newStability = FSRS_DEFAULTS.w[0];
        newDifficulty = 7.5;
        newLapses += 1;
        break;
      case 'hard':
        newStability = FSRS_DEFAULTS.w[1];
        newDifficulty = 6.0;
        break;
      case 'good':
        newStability = FSRS_DEFAULTS.w[2];
        newDifficulty = 4.5;
        break;
      case 'easy':
        newStability = FSRS_DEFAULTS.w[3];
        newDifficulty = 2.5;
        break;
    }
  } else {
    // Existing card review
    const S = currentState.stability;
    const D = currentState.difficulty || 4.5;
    const R = Math.max(0.05, retrievabilityBefore / 100);

    // Difficulty update with mean reversion
    let dDelta = rating === 'again' ? 1.5 : rating === 'hard' ? 0.75 : rating === 'good' ? 0.0 : -1.0;
    let nextD = D + dDelta;
    nextD = FSRS_DEFAULTS.w[6] * 4.5 + (1 - FSRS_DEFAULTS.w[6]) * nextD; // Mean reversion toward 4.5
    newDifficulty = Math.max(1.0, Math.min(10.0, Number(nextD.toFixed(2))));

    if (rating === 'again') {
      newLapses += 1;
      // Post-lapse stability
      const lapseS = FSRS_DEFAULTS.w[11] * Math.pow(D, -FSRS_DEFAULTS.w[12]) * (Math.pow(S + 1, FSRS_DEFAULTS.w[13]) - 1) * Math.exp(FSRS_DEFAULTS.w[14] * (1 - R));
      newStability = Math.max(0.3, Math.min(S, Number(lapseS.toFixed(2))));
    } else {
      // Recall success stability update
      let ratingMultiplier = rating === 'hard' ? 0.85 : rating === 'good' ? 1.0 : 1.35;
      const boost = 1 + Math.exp(FSRS_DEFAULTS.w[8]) * (11 - D) * Math.pow(S, -FSRS_DEFAULTS.w[9]) * (Math.exp(FSRS_DEFAULTS.w[10] * (1 - R)) - 1);
      const nextS = S * boost * ratingMultiplier;
      newStability = Math.max(S + 0.5, Number(nextS.toFixed(2)));
    }
  }

  // Calculate interval in days
  let intervalDays: number;
  if (rating === 'again') {
    intervalDays = 0; // Due today / immediate replay
  } else {
    intervalDays = calculateFSRSInterval(newStability, FSRS_DEFAULTS.requestedRetention);
    if (rating === 'hard') {
      intervalDays = Math.max(1, Math.min(intervalDays, 3));
    }
  }

  const nextDate = new Date();
  if (intervalDays === 0) {
    // 10 minutes later for "again"
    nextDate.setMinutes(nextDate.getMinutes() + 10);
  } else {
    nextDate.setDate(nextDate.getDate() + intervalDays);
  }

  return {
    nextReviewDate: nextDate.toISOString(),
    intervalDays,
    newStability: Number(newStability.toFixed(2)),
    newDifficulty: Number(newDifficulty.toFixed(2)),
    retrievabilityBeforeReview: retrievabilityBefore,
    lapses: newLapses,
  };
}

/**
 * Returns estimated interval labels for the 4 review buttons for a given card
 */
export function getFSRSEstimatedIntervals(
  stability: number | undefined,
  difficulty: number | undefined,
  lastReviewedDate: string | undefined,
  fallbackBox: number = 1,
  isFa = true
): { again: string; hard: string; good: string; easy: string } {
  const state: FSRSItemState = {
    stability: stability || (fallbackBox === 1 ? 1.0 : fallbackBox === 2 ? 3.0 : fallbackBox === 3 ? 7.0 : fallbackBox === 4 ? 14.0 : 30.0),
    difficulty: difficulty || 4.5,
    lapses: 0,
    lastReviewedDate,
    reps: stability ? 1 : 0,
  };

  const againRes = scheduleFSRSNextReview(state, 'again', fallbackBox);
  const hardRes = scheduleFSRSNextReview(state, 'hard', fallbackBox);
  const goodRes = scheduleFSRSNextReview(state, 'good', fallbackBox);
  const easyRes = scheduleFSRSNextReview(state, 'easy', fallbackBox);

  const formatDays = (d: number) => {
    if (d <= 0) return isFa ? '< ۱۰ د' : '< 10m';
    if (d === 1) return isFa ? '۱ روز' : '1d';
    if (d < 30) return `${d} ${isFa ? 'روز' : 'd'}`;
    const months = Math.round(d / 30);
    return `${months} ${isFa ? 'ماه' : 'mo'}`;
  };

  return {
    again: formatDays(againRes.intervalDays),
    hard: formatDays(hardRes.intervalDays),
    good: formatDays(goodRes.intervalDays),
    easy: formatDays(easyRes.intervalDays),
  };
}
