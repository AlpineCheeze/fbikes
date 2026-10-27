"use client";

import React, { useState } from "react";
import { usePalmares } from "@/context/palmares-context";
import { Race } from "@/types";
import { LineupBuilderModal } from "./LineupBuilderModal";
import {
  Trophy,
  Calendar,
  Users,
  Copy,
  Check,
  Flame,
  Award,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { formatUciPoints, formatDate } from "@/lib/utils";

export function LeagueDashboard() {
  const {
    activeLeague,
    leagueMembers,
    currentUser,
    races,
    lineups,
    riders,
    getRiderQuotaUsage,
    raceStatuses,
    telemetry,
  } = usePalmares();

  const [activeTab, setActiveTab] = useState<"standings" | "schedule" | "quotas" | "rules">("standings");
  const [selectedRaceForLineup, setSelectedRaceForLineup] = useState<Race | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!activeLeague) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-zinc-400">
        No active league selected. Create or join a league to get started!
      </div>
    );
  }

  const currentMember = leagueMembers.find(
    (m) => m.leagueId === activeLeague.id && m.userId === currentUser.id
  );

  const membersInLeague = leagueMembers
    .filter((m) => m.leagueId === activeLeague.id)
    .sort((a, b) => b.cumulativePoints - a.cumulativePoints);

  const participatingRaces = races.filter((r) =>
    activeLeague.participatingRaceIds.includes(r.id)
  );

  const liveRace = participatingRaces.find((r) => raceStatuses[r.id] === "in_progress");
  const currentLiveTelemetry = liveRace ? telemetry[liveRace.id] : null;

  const copyJoinCode = () => {
    navigator.clipboard.writeText(activeLeague.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Live In-Race Alert Banner */}
      {liveRace && currentLiveTelemetry && (
        <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-zinc-950 border border-red-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-red-500/10 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <div>
              <div className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-2">
                LIVE RACE IN PROGRESS: {liveRace.name}
                <span className="text-[10px] text-zinc-400">({currentLiveTelemetry.kmRemaining} KM to go)</span>
              </div>
              <div className="text-sm font-semibold text-zinc-200 mt-0.5">
                Breakaway: {currentLiveTelemetry.groups[0]?.gapFormatted} ahead of Peloton ({currentLiveTelemetry.currentSpeedKmh} km/h)
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40">
            Feed: Tissot Telemetry
          </span>
        </div>
      )}

      {/* League Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 uppercase tracking-wider">
                {activeLeague.gameMode === "rider_lockout" ? "3-Race Max Quota" : "Draft League"}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {membersInLeague.length} Managers
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {participatingRaces.length} Scheduled Races
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-zinc-100 tracking-tight">
              {activeLeague.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Official Fantasy Cycling League • Season 2027
            </p>
          </div>

          {/* Join Code Card */}
          <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-2xl">
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                Invite Code
              </div>
              <div className="text-base font-black font-mono text-amber-400 tracking-widest">
                {activeLeague.joinCode}
              </div>
            </div>
            <button
              onClick={copyJoinCode}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 transition-colors"
              title="Copy code"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{activeLeague.maxRiderUses} Uses Max</strong> per rider
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>{activeLeague.startersCount} Starters + {activeLeague.alternatesCount} Reserves</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Official UCI</strong> Points Scale
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Flame className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>{activeLeague.scoringSettings.captainMultiplier}x</strong> Captain Boost
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("standings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "standings"
              ? "bg-zinc-800 text-amber-400 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Trophy className="w-4 h-4" />
          General Classification
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "schedule"
              ? "bg-zinc-800 text-sky-400 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Race Calendar & Lineups ({participatingRaces.length})
        </button>
        <button
          onClick={() => setActiveTab("quotas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === "quotas"
              ? "bg-zinc-800 text-emerald-400 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          My Season Quota Tracker
        </button>
      </div>

      {/* Tab 1: Standings / General Classification */}
      {activeTab === "standings" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                League Standings (Cumulative UCI Points)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Updated automatically after each participating WorldTour event.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-[11px] uppercase tracking-wider text-zinc-500 font-mono border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 text-center w-12">Rank</th>
                  <th className="py-3 px-4">Manager & Team</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {membersInLeague.map((member, idx) => {
                  const isCurrent = member.userId === currentUser.id;
                  return (
                    <tr
                      key={member.id}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-amber-400/5 hover:bg-amber-400/10"
                          : "hover:bg-zinc-800/40"
                      }`}
                    >
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-zinc-950 text-xs">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-300 text-zinc-950 text-xs">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-zinc-100 text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-zinc-500">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                            {member.user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.user.avatarUrl}
                                alt={member.user.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                {member.user.displayName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                              {member.teamName}
                              {isCurrent && (
                                <span className="text-[10px] bg-amber-400/20 text-amber-400 border border-amber-400/30 px-1.5 py-0.2 rounded font-semibold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {member.user.displayName} (@{member.user.username})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded capitalize ${
                            member.role === "commissioner"
                              ? "bg-amber-400/10 text-amber-400 font-semibold"
                              : "text-zinc-500"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-zinc-100 text-base font-mono">
                          {formatUciPoints(member.cumulativePoints)}
                        </span>
                        <span className="text-xs text-zinc-500 ml-1">pts</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Race Calendar & Lineup Submissions */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-200">
              Participating Races ({participatingRaces.length})
            </h3>
            <p className="text-xs text-zinc-500">
              Lineups lock at official neutralized roll-out (KM 0)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participatingRaces.map((race) => {
              const currentLineup = currentMember
                ? lineups[`${currentMember.id}_${race.id}`]
                : undefined;
              const hasLineup = !!currentLineup;

              return (
                <div
                  key={race.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                            {formatDate(race.startDate)}
                          </span>
                          {race.isMonument && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                              Monument
                            </span>
                          )}
                          {race.isGrandTour && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              Grand Tour
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-zinc-100">{race.name}</h4>
                        <div className="text-xs text-zinc-400 mt-1">
                          {race.country} • {race.distanceKm} km • {race.elevationGainM}m elevation
                        </div>
                      </div>

                      {hasLineup ? (
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-lg">
                            ✓ Lineup Set (8/8)
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg">
                            Lineup Needed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lineup summary if selected */}
                  {hasLineup && (
                    <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 text-xs">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1.5">
                        Selected Starters:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentLineup.slots
                          .filter((s) => s.slotRole === "starter")
                          .map((slot) => (
                            <span
                              key={slot.id}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                                slot.isCaptain
                                  ? "bg-amber-400 text-zinc-950 font-bold"
                                  : "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {slot.isCaptain && "⭐"} {slot.rider.lastName}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedRaceForLineup(race)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold transition-colors"
                  >
                    {hasLineup ? "Edit 8-Rider Lineup & Reserves" : "Set 8-Rider Lineup & Reserves"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: My Season Quota Tracker */}
      {activeTab === "quotas" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Rider Quota Tracker (Max {activeLeague.maxRiderUses} Uses Each)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              You can only pick any given superstar rider a maximum of{" "}
              <strong>{activeLeague.maxRiderUses} times</strong> across this league&apos;s season. Plan
              ahead for the Grand Tours and Monuments!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {riders.map((rider) => {
              const quota = currentMember
                ? getRiderQuotaUsage(currentMember.id, rider.id)
                : { used: 0, max: 3, remaining: 3 };

              return (
                <div
                  key={rider.id}
                  className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-zinc-100">
                      {rider.firstName} {rider.lastName}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {rider.proTeam?.name} ({rider.proTeam?.uciCode})
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-black font-mono ${
                        quota.remaining === 0
                          ? "text-red-400"
                          : quota.remaining === 1
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {quota.remaining} / {quota.max} left
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {quota.used} used this season
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lineup Builder Modal */}
      {selectedRaceForLineup && (
        <LineupBuilderModal
          race={selectedRaceForLineup}
          onClose={() => setSelectedRaceForLineup(null)}
        />
      )}
    </div>
  );
}
