export interface TrackerAdherence {
  trackerId: string;
  name: string;
  type: string;
  targetValue: number | null;
  loggedValue: number | null;
  adherencePercentage: number;
  isCompleted: boolean;
}

export interface DayEfficiency {
  date: string;
  score: number; // 0 - 100
  totalTrackers: number;
  completedTrackers: number;
  details: TrackerAdherence[];
}

export function calculateAdherence(
  type: string,
  targetValue: number | null,
  loggedValue: number | null
): { adherence: number; isCompleted: boolean } {
  if (loggedValue === null || loggedValue === undefined) {
    return { adherence: 0, isCompleted: false };
  }

  switch (type) {
    case "HABIT": {
      const isCompleted = loggedValue >= 1;
      return { adherence: isCompleted ? 1.0 : 0.0, isCompleted };
    }
    case "NUMERIC":
    case "COUNTER":
    case "DURATION": {
      if (targetValue && targetValue > 0) {
        const ratio = loggedValue / targetValue;
        // Cap adherence at 1.0 for scoring, but flag completed if ratio >= 1.0
        const adherence = Math.min(1.0, Math.max(0, ratio));
        return { adherence, isCompleted: ratio >= 1.0 };
      }
      const isCompleted = loggedValue > 0;
      return { adherence: isCompleted ? 1.0 : 0.0, isCompleted };
    }
    case "WORKOUT": {
      const isCompleted = loggedValue > 0;
      return { adherence: isCompleted ? 1.0 : 0.0, isCompleted };
    }
    default: {
      const isCompleted = loggedValue > 0;
      return { adherence: isCompleted ? 1.0 : 0.0, isCompleted };
    }
  }
}

export function calculateDayEfficiency(
  date: string,
  trackers: Array<{ id: string; name: string; type: string; targetValue: number | null }>,
  logs: Array<{ trackerId: string; value: number }>
): DayEfficiency {
  if (trackers.length === 0) {
    return {
      date,
      score: 100,
      totalTrackers: 0,
      completedTrackers: 0,
      details: [],
    };
  }

  const logMap = new Map<string, number>();
  logs.forEach((log) => logMap.set(log.trackerId, log.value));

  let totalAdherence = 0;
  let completedCount = 0;
  const details: TrackerAdherence[] = [];

  for (const tracker of trackers) {
    const loggedVal = logMap.has(tracker.id) ? logMap.get(tracker.id)! : null;
    const { adherence, isCompleted } = calculateAdherence(
      tracker.type,
      tracker.targetValue,
      loggedVal
    );

    totalAdherence += adherence;
    if (isCompleted) completedCount++;

    details.push({
      trackerId: tracker.id,
      name: tracker.name,
      type: tracker.type,
      targetValue: tracker.targetValue,
      loggedValue: loggedVal,
      adherencePercentage: Math.round(adherence * 100),
      isCompleted,
    });
  }

  const rawScore = (totalAdherence / trackers.length) * 100;
  const score = Math.round(rawScore * 10) / 10;

  return {
    date,
    score,
    totalTrackers: trackers.length,
    completedTrackers: completedCount,
    details,
  };
}

