"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  League,
  LeagueMember,
  Race,
  Rider,
  UserProfile,
  LineupSlot,
  EventLineup,
  ScoringSettings,
  RaceStartlistEntry,
} from "@/types";
import {
  INITIAL_LEAGUE,
  INITIAL_LEAGUE_MEMBERS,
  RACES,
  RIDERS,
  PRO_TEAMS,
} from "@/data/seed-data";
import {
  generateInitialStartlist,
  executeDnsAutoSubstitution,
  SubstitutionEvent,
} from "@/lib/ingestion/startlist-engine";
import {
  generateLiveTelemetry,
  scoreLineupForResults,
} from "@/lib/ingestion/telemetry-simulator";
import { LiveRaceTelemetry, FinishResultItem } from "@/lib/ingestion/types";
import { calculateUciPoints } from "@/lib/ingestion/uci-points";

interface PalmaresContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  leagues: League[];
  leagueMembers: LeagueMember[];
  activeLeague: League | null;
  setActiveLeague: (league: League | null) => void;
  races: Race[];
  riders: Rider[];
  lineups: Record<string, EventLineup>;
  startlists: Record<string, RaceStartlistEntry[]>;
  telemetry: Record<string, LiveRaceTelemetry | null>;
  substitutionLogs: SubstitutionEvent[];
  raceStatuses: Record<string, "scheduled" | "locked" | "in_progress" | "completed">;
  createLeague: (data: {
    name: string;
    teamName: string;
    isPrivate: boolean;
    maxRiderUses: number;
    startersCount: number;
    alternatesCount: number;
    scoringSettings: ScoringSettings;
    participatingRaceIds: string[];
  }) => League;
  joinLeague: (joinCode: string, teamName: string) => { success: boolean; message: string };
  saveLineup: (
    leagueMemberId: string,
    raceId: string,
    starters: { riderId: string; isCaptain: boolean }[],
    alternates: { riderId: string }[]
  ) => { success: boolean; message: string };
  getRiderQuotaUsage: (leagueMemberId: string, riderId: string) => {
    used: number;
    max: number;
    remaining: number;
  };
  getStartlist: (raceId: string) => RaceStartlistEntry[];
  scratchRider: (raceId: string, riderId: string, reason: string) => void;
  triggerRolloutLockout: (raceId: string) => { substitutionsCount: number };
  simulateLiveSituation: (raceId: string, kmRemaining: number, breakawayRiderIds: string[]) => void;
  simulateRaceFinish: (raceId: string, finishOrderRiderIds: string[]) => void;
  resetRaceSimulation: (raceId: string) => void;
}

const CURRENT_USER: UserProfile = {
  id: "user-1",
  username: "rouleur_king",
  displayName: "Marco Pantani Fan",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  favoriteTeam: "UAE Team Emirates",
  createdAt: "2026-10-01T00:00:00Z",
};

const PalmaresContext = createContext<PalmaresContextType | null>(null);

export function PalmaresProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [leagues, setLeagues] = useState<League[]>([INITIAL_LEAGUE]);
  const [leagueMembers, setLeagueMembers] = useState<LeagueMember[]>(INITIAL_LEAGUE_MEMBERS);
  const [activeLeague, setActiveLeague] = useState<League | null>(INITIAL_LEAGUE);
  const [races] = useState<Race[]>(RACES);
  const [riders] = useState<Rider[]>(
    RIDERS.map((r) => ({
      ...r,
      proTeam: PRO_TEAMS.find((t) => t.id === r.proTeamId),
    }))
  );
  const [lineups, setLineups] = useState<Record<string, EventLineup>>({});

  // Milestone 2 Ingestion & Telemetry State
  const [startlists, setStartlists] = useState<Record<string, RaceStartlistEntry[]>>({});
  const [telemetry, setTelemetry] = useState<Record<string, LiveRaceTelemetry | null>>({});
  const [substitutionLogs, setSubstitutionLogs] = useState<SubstitutionEvent[]>([]);
  const [raceStatuses, setRaceStatuses] = useState<
    Record<string, "scheduled" | "locked" | "in_progress" | "completed">
  >({});

  // Seed default startlists for all races
  useEffect(() => {
    const initialStartlists: Record<string, RaceStartlistEntry[]> = {};
    const initialStatuses: Record<string, "scheduled" | "locked" | "in_progress" | "completed"> = {};

    RACES.forEach((race) => {
      initialStartlists[race.id] = generateInitialStartlist(race.id, riders);
      initialStatuses[race.id] = "scheduled";
    });

    setStartlists(initialStartlists);
    setRaceStatuses(initialStatuses);
  }, [riders]);

  // Load saved state
  useEffect(() => {
    const savedLeagues = localStorage.getItem("palmares_leagues");
    const savedMembers = localStorage.getItem("palmares_members");
    const savedLineups = localStorage.getItem("palmares_lineups");
    if (savedLeagues) {
      try {
        setLeagues(JSON.parse(savedLeagues));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedMembers) {
      try {
        setLeagueMembers(JSON.parse(savedMembers));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedLineups) {
      try {
        setLineups(JSON.parse(savedLineups));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const getStartlist = (raceId: string): RaceStartlistEntry[] => {
    return startlists[raceId] || generateInitialStartlist(raceId, riders);
  };

  const createLeague = (data: {
    name: string;
    teamName: string;
    isPrivate: boolean;
    maxRiderUses: number;
    startersCount: number;
    alternatesCount: number;
    scoringSettings: ScoringSettings;
    participatingRaceIds: string[];
  }): League => {
    const newLeagueId = `league-${Date.now()}`;
    const newJoinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newLeague: League = {
      id: newLeagueId,
      commissionerId: currentUser.id,
      name: data.name,
      joinCode: newJoinCode,
      gameMode: "rider_lockout",
      maxRiderUses: data.maxRiderUses || 3,
      startersCount: data.startersCount || 8,
      alternatesCount: data.alternatesCount || 3,
      isPrivate: data.isPrivate,
      scoringSettings: data.scoringSettings,
      participatingRaceIds: data.participatingRaceIds,
      createdAt: new Date().toISOString(),
    };

    const newMember: LeagueMember = {
      id: `member-${Date.now()}`,
      leagueId: newLeagueId,
      userId: currentUser.id,
      user: currentUser,
      teamName: data.teamName || `${currentUser.username}'s Squad`,
      role: "commissioner",
      cumulativePoints: 0,
      joinedAt: new Date().toISOString(),
    };

    const updatedLeagues = [newLeague, ...leagues];
    const updatedMembers = [...leagueMembers, newMember];

    setLeagues(updatedLeagues);
    setLeagueMembers(updatedMembers);
    setActiveLeague(newLeague);

    localStorage.setItem("palmares_leagues", JSON.stringify(updatedLeagues));
    localStorage.setItem("palmares_members", JSON.stringify(updatedMembers));

    return newLeague;
  };

  const joinLeague = (joinCode: string, teamName: string) => {
    const league = leagues.find(
      (l) => l.joinCode.toUpperCase() === joinCode.trim().toUpperCase()
    );
    if (!league) {
      return { success: false, message: "League not found. Check the code and try again." };
    }

    const alreadyMember = leagueMembers.some(
      (m) => m.leagueId === league.id && m.userId === currentUser.id
    );
    if (alreadyMember) {
      setActiveLeague(league);
      return { success: true, message: "You are already a member of this league!" };
    }

    const newMember: LeagueMember = {
      id: `member-${Date.now()}`,
      leagueId: league.id,
      userId: currentUser.id,
      user: currentUser,
      teamName: teamName || `${currentUser.username}'s Team`,
      role: "member",
      cumulativePoints: 0,
      joinedAt: new Date().toISOString(),
    };

    const updatedMembers = [...leagueMembers, newMember];
    setLeagueMembers(updatedMembers);
    setActiveLeague(league);
    localStorage.setItem("palmares_members", JSON.stringify(updatedMembers));

    return { success: true, message: `Successfully joined ${league.name}!` };
  };

  const getRiderQuotaUsage = (leagueMemberId: string, riderId: string) => {
    const member = leagueMembers.find((m) => m.id === leagueMemberId);
    const league = member ? leagues.find((l) => l.id === member.leagueId) : activeLeague;
    const max = league?.maxRiderUses ?? 3;

    let used = 0;
    Object.entries(lineups).forEach(([key, lineup]) => {
      if (lineup.leagueMemberId === leagueMemberId) {
        const hasRiderAsStarter = lineup.slots.some(
          (s) => s.riderId === riderId && (s.slotRole === "starter" || s.isPromotedFromBench)
        );
        if (hasRiderAsStarter) {
          used++;
        }
      }
    });

    return {
      used,
      max,
      remaining: Math.max(0, max - used),
    };
  };

  const saveLineup = (
    leagueMemberId: string,
    raceId: string,
    starters: { riderId: string; isCaptain: boolean }[],
    alternates: { riderId: string }[]
  ) => {
    for (const starter of starters) {
      const quota = getRiderQuotaUsage(leagueMemberId, starter.riderId);
      const currentKey = `${leagueMemberId}_${raceId}`;
      const existingLineup = lineups[currentKey];
      const wasAlreadyInCurrentLineup =
        existingLineup?.slots.some(
          (s) => s.riderId === starter.riderId && s.slotRole === "starter"
        ) ?? false;

      if (!wasAlreadyInCurrentLineup && quota.remaining <= 0) {
        const rider = riders.find((r) => r.id === starter.riderId);
        return {
          success: false,
          message: `Quota exceeded: You have already picked ${rider?.firstName} ${rider?.lastName} ${quota.max} times this season!`,
        };
      }
    }

    const slots: LineupSlot[] = [
      ...starters.map((s, idx) => ({
        id: `slot-starter-${idx}`,
        eventLineupId: `lineup-${leagueMemberId}-${raceId}`,
        riderId: s.riderId,
        rider: riders.find((r) => r.id === s.riderId)!,
        slotRole: "starter" as const,
        isCaptain: s.isCaptain,
        isPromotedFromBench: false,
        pointsAwarded: 0,
      })),
      ...alternates.map((a, idx) => ({
        id: `slot-alt-${idx}`,
        eventLineupId: `lineup-${leagueMemberId}-${raceId}`,
        riderId: a.riderId,
        rider: riders.find((r) => r.id === a.riderId)!,
        slotRole: `alternate_${idx + 1}` as any,
        isCaptain: false,
        isPromotedFromBench: false,
        pointsAwarded: 0,
      })),
    ];

    const newLineup: EventLineup = {
      id: `lineup-${leagueMemberId}-${raceId}`,
      leagueMemberId,
      raceId,
      submittedAt: new Date().toISOString(),
      isLocked: false,
      totalEventPoints: 0,
      slots,
    };

    const updatedLineups = {
      ...lineups,
      [`${leagueMemberId}_${raceId}`]: newLineup,
    };

    setLineups(updatedLineups);
    localStorage.setItem("palmares_lineups", JSON.stringify(updatedLineups));

    return { success: true, message: "Lineup saved successfully!" };
  };

  // Milestone 2 Actions:

  const scratchRider = (raceId: string, riderId: string, reason: string) => {
    const list = getStartlist(raceId);
    const updated = list.map((item) => {
      if (item.riderId === riderId) {
        return {
          ...item,
          status: "dns" as const,
          withdrawnAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setStartlists({
      ...startlists,
      [raceId]: updated,
    });
  };

  const triggerRolloutLockout = (raceId: string) => {
    const currentList = getStartlist(raceId);
    const { updatedLineups, substitutionEvents } = executeDnsAutoSubstitution(
      raceId,
      currentList,
      lineups
    );

    // Mark race locked & all lineups locked
    Object.keys(updatedLineups).forEach((k) => {
      if (updatedLineups[k].raceId === raceId) {
        updatedLineups[k].isLocked = true;
      }
    });

    setLineups(updatedLineups);
    setSubstitutionLogs([...substitutionEvents, ...substitutionLogs]);
    setRaceStatuses({
      ...raceStatuses,
      [raceId]: "locked",
    });

    return { substitutionsCount: substitutionEvents.length };
  };

  const simulateLiveSituation = (raceId: string, kmRemaining: number, breakawayRiderIds: string[]) => {
    const race = races.find((r) => r.id === raceId);
    if (!race) return;

    const tele = generateLiveTelemetry(
      raceId,
      race.distanceKm,
      kmRemaining,
      breakawayRiderIds
    );

    setTelemetry({
      ...telemetry,
      [raceId]: tele,
    });

    setRaceStatuses({
      ...raceStatuses,
      [raceId]: "in_progress",
    });
  };

  const simulateRaceFinish = (raceId: string, finishOrderRiderIds: string[]) => {
    const race = races.find((r) => r.id === raceId);
    if (!race) return;

    const results: FinishResultItem[] = finishOrderRiderIds.map((rId, idx) => ({
      rank: idx + 1,
      riderId: rId,
      timeBehindSeconds: idx === 0 ? 0 : idx * 12,
      uciPointsEarned: calculateUciPoints(race.uciPointsScaleCode, idx + 1),
    }));

    // Score all lineups for this race
    const updatedLineups = { ...lineups };
    const memberPointsGained: Record<string, number> = {};

    Object.entries(updatedLineups).forEach(([key, lineup]) => {
      if (lineup.raceId === raceId) {
        const { totalPoints, scoredSlots } = scoreLineupForResults(
          lineup,
          results,
          race.uciPointsScaleCode,
          activeLeague?.scoringSettings.captainMultiplier || 1.5
        );

        updatedLineups[key] = {
          ...lineup,
          totalEventPoints: totalPoints,
          slots: lineup.slots.map((s) => {
            const match = scoredSlots.find((sc) => sc.slotId === s.id);
            return match ? { ...s, pointsAwarded: match.awardedPoints } : s;
          }),
        };

        memberPointsGained[lineup.leagueMemberId] =
          (memberPointsGained[lineup.leagueMemberId] || 0) + totalPoints;
      }
    });

    // Update league member cumulative scores
    const updatedMembers = leagueMembers.map((m) => {
      const added = memberPointsGained[m.id] || 0;
      return {
        ...m,
        cumulativePoints: m.cumulativePoints + added,
      };
    });

    setLineups(updatedLineups);
    setLeagueMembers(updatedMembers);
    setRaceStatuses({
      ...raceStatuses,
      [raceId]: "completed",
    });

    localStorage.setItem("palmares_members", JSON.stringify(updatedMembers));
    localStorage.setItem("palmares_lineups", JSON.stringify(updatedLineups));
  };

  const resetRaceSimulation = (raceId: string) => {
    setRaceStatuses({
      ...raceStatuses,
      [raceId]: "scheduled",
    });
    setStartlists({
      ...startlists,
      [raceId]: generateInitialStartlist(raceId, riders),
    });
    setTelemetry({
      ...telemetry,
      [raceId]: null,
    });
  };

  return (
    <PalmaresContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        leagues,
        leagueMembers,
        activeLeague,
        setActiveLeague,
        races,
        riders,
        lineups,
        startlists,
        telemetry,
        substitutionLogs,
        raceStatuses,
        createLeague,
        joinLeague,
        saveLineup,
        getRiderQuotaUsage,
        getStartlist,
        scratchRider,
        triggerRolloutLockout,
        simulateLiveSituation,
        simulateRaceFinish,
        resetRaceSimulation,
      }}
    >
      {children}
    </PalmaresContext.Provider>
  );
}

export function usePalmares() {
  const context = useContext(PalmaresContext);
  if (!context) {
    throw new Error("usePalmares must be used within a PalmaresProvider");
  }
  return context;
}
