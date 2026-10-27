import { LiveRaceTelemetry, FinishResultItem } from "./types";
import { calculateUciPoints } from "./uci-points";
import { EventLineup } from "@/types";

export function generateLiveTelemetry(
  raceId: string,
  totalDistanceKm: number,
  kmRemaining: number,
  breakawayRiderIds: string[]
): LiveRaceTelemetry {
  return {
    raceId,
    kmRemaining,
    totalDistanceKm,
    currentSpeedKmh: 46.8,
    groups: [
      {
        name: "Breakaway (Tête de la Course)",
        gapToLeaderSeconds: 0,
        gapFormatted: "0:00",
        riderIds: breakawayRiderIds,
      },
      {
        name: "Peloton (Chasing Group)",
        gapToLeaderSeconds: 105,
        gapFormatted: "+1:45",
        riderIds: [],
      },
    ],
    lastUpdated: new Date().toISOString(),
    provider: "Tissot Timing",
  };
}

/**
 * Calculates virtual live points or final points for a lineup based on race results.
 */
export function scoreLineupForResults(
  lineup: EventLineup,
  results: FinishResultItem[],
  scaleCode: string,
  captainMultiplier: number = 1.5
): {
  totalPoints: number;
  scoredSlots: {
    slotId: string;
    riderId: string;
    rank?: number;
    basePoints: number;
    awardedPoints: number;
    isCaptain: boolean;
  }[];
} {
  let totalPoints = 0;
  const resultMap = new Map(results.map((r) => [r.riderId, r]));

  const scoredSlots = lineup.slots.map((slot) => {
    // Only starters or promoted alternates earn points
    const isActive = slot.slotRole === "starter" || slot.isPromotedFromBench;

    if (!isActive) {
      return {
        slotId: slot.id,
        riderId: slot.riderId,
        basePoints: 0,
        awardedPoints: 0,
        isCaptain: slot.isCaptain,
      };
    }

    const result = resultMap.get(slot.riderId);
    if (!result) {
      return {
        slotId: slot.id,
        riderId: slot.riderId,
        basePoints: 0,
        awardedPoints: 0,
        isCaptain: slot.isCaptain,
      };
    }

    const basePoints = result.uciPointsEarned || calculateUciPoints(scaleCode, result.rank);
    const multiplier = slot.isCaptain ? captainMultiplier : 1.0;
    const awardedPoints = Math.round(basePoints * multiplier);

    totalPoints += awardedPoints;

    return {
      slotId: slot.id,
      riderId: slot.riderId,
      rank: result.rank,
      basePoints,
      awardedPoints,
      isCaptain: slot.isCaptain,
    };
  });

  return { totalPoints, scoredSlots };
}
