import { Race, Rider, RaceStartlistEntry, EventLineup, LineupSlot, RiderStartStatus } from "@/types";
import { RIDERS } from "@/data/seed-data";

export interface SubstitutionEvent {
  leagueMemberId: string;
  scratchRider: Rider;
  promotedAlternate: Rider;
  alternateRoleUsed: string;
  timestamp: string;
  reason: string;
}

export function generateInitialStartlist(raceId: string, customRiders: Rider[] = RIDERS): RaceStartlistEntry[] {
  return customRiders.map((rider, idx) => {
    // Generate realistic bib numbers: team 1 gets 1-8, team 2 gets 11-18, etc.
    const teamIndex = Math.floor(idx / 8) + 1;
    const riderInTeamIndex = (idx % 8) + 1;
    const bibNumber = teamIndex * 10 + riderInTeamIndex;

    return {
      id: `startlist-${raceId}-${rider.id}`,
      raceId,
      riderId: rider.id,
      rider,
      bibNumber,
      status: "confirmed" as RiderStartStatus,
    };
  });
}

/**
 * Executes the Palmares Atomic Pre-Race DNS Auto-Substitution Protocol
 * Runs at the exact moment of race rollout (KM 0 / Lockout time).
 */
export function executeDnsAutoSubstitution(
  raceId: string,
  startlist: RaceStartlistEntry[],
  currentLineups: Record<string, EventLineup>
): {
  updatedLineups: Record<string, EventLineup>;
  substitutionEvents: SubstitutionEvent[];
} {
  const dnsRiderIds = new Set(
    startlist.filter((s) => s.status === "dns").map((s) => s.riderId)
  );

  const updatedLineups: Record<string, EventLineup> = { ...currentLineups };
  const substitutionEvents: SubstitutionEvent[] = [];

  // If no DNS riders in the startlist, nothing to substitute
  if (dnsRiderIds.size === 0) {
    return { updatedLineups, substitutionEvents };
  }

  Object.entries(updatedLineups).forEach(([key, lineup]) => {
    if (lineup.raceId !== raceId) return;

    const starters = lineup.slots.filter((s) => s.slotRole === "starter");
    const alternates = lineup.slots
      .filter((s) => s.slotRole.startsWith("alternate"))
      .sort((a, b) => a.slotRole.localeCompare(b.slotRole));

    let modified = false;
    const newSlots = [...lineup.slots];

    starters.forEach((starterSlot) => {
      if (dnsRiderIds.has(starterSlot.riderId)) {
        // Starter is DNS! Search for the first eligible alternate
        const eligibleAlt = alternates.find(
          (alt) => !dnsRiderIds.has(alt.riderId) && !alt.isPromotedFromBench
        );

        if (eligibleAlt) {
          // Promote alternate
          const altSlotIndex = newSlots.findIndex((s) => s.id === eligibleAlt.id);
          const starterSlotIndex = newSlots.findIndex((s) => s.id === starterSlot.id);

          if (altSlotIndex !== -1 && starterSlotIndex !== -1) {
            newSlots[altSlotIndex] = {
              ...newSlots[altSlotIndex],
              isPromotedFromBench: true,
            };

            // Starter is flagged DNS
            newSlots[starterSlotIndex] = {
              ...newSlots[starterSlotIndex],
              pointsAwarded: 0,
            };

            substitutionEvents.push({
              leagueMemberId: lineup.leagueMemberId,
              scratchRider: starterSlot.rider,
              promotedAlternate: eligibleAlt.rider,
              alternateRoleUsed: eligibleAlt.slotRole,
              timestamp: new Date().toISOString(),
              reason: "Pre-Race Withdrawal / DNS Detected at KM 0 Rollout",
            });

            modified = true;
          }
        }
      }
    });

    if (modified) {
      updatedLineups[key] = {
        ...lineup,
        slots: newSlots,
      };
    }
  });

  return { updatedLineups, substitutionEvents };
}
