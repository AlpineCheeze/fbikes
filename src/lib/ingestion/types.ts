import { RiderStartStatus, Race, Rider, RaceStartlistEntry } from "@/types";

export interface TelemetryGroup {
  name: string; // e.g. "Breakaway (Tête de la Course)", "Peloton", "Chasers"
  gapToLeaderSeconds: number; // 0 for leader
  gapFormatted: string; // "0:00", "+2:15"
  riderIds: string[];
}

export interface LiveRaceTelemetry {
  raceId: string;
  kmRemaining: number;
  totalDistanceKm: number;
  currentSpeedKmh: number;
  groups: TelemetryGroup[];
  lastUpdated: string;
  provider: "Tissot Timing" | "FirstCycling Ticker" | "A.S.O. Open Telemetry";
}

export interface StartlistSyncEvent {
  raceId: string;
  timestamp: string;
  source: string;
  totalRiders: number;
  confirmedCount: number;
  probableCount: number;
  provisionalCount: number;
  dnsCount: number;
  scratchedRiders: {
    riderId: string;
    riderName: string;
    reason: string;
  }[];
}

export interface FinishResultItem {
  rank: number;
  riderId: string;
  timeBehindSeconds: number;
  uciPointsEarned: number;
}
