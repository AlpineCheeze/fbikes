"use client";

import React, { useState } from "react";
import { usePalmares } from "@/context/palmares-context";
import { Race, Rider } from "@/types";
import {
  Activity,
  Radio,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Award,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatUciPoints } from "@/lib/utils";

export function RaceOperationsDashboard() {
  const {
    races,
    riders,
    getStartlist,
    scratchRider,
    triggerRolloutLockout,
    simulateLiveSituation,
    simulateRaceFinish,
    resetRaceSimulation,
    raceStatuses,
    telemetry,
    substitutionLogs,
    activeLeague,
  } = usePalmares();

  const [selectedRaceId, setSelectedRaceId] = useState<string>(races[0]?.id || "race-strade");
  const [scratchReason, setScratchReason] = useState("Sudden illness / fever on morning of race");
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const selectedRace = races.find((r) => r.id === selectedRaceId) || races[0];
  const startlist = getStartlist(selectedRace.id);
  const currentStatus = raceStatuses[selectedRace.id] || "scheduled";
  const currentTelemetry = telemetry[selectedRace.id];

  const handleScratch = (rider: Rider) => {
    scratchRider(selectedRace.id, rider.id, scratchReason);
    setLastActionMessage(
      `⚠️ Scratched: ${rider.firstName} ${rider.lastName} marked DNS before roll-out.`
    );
  };

  const handleLockout = () => {
    const res = triggerRolloutLockout(selectedRace.id);
    setLastActionMessage(
      `🔒 Race Locked at KM 0: Atomic substitution triggered. ${res.substitutionsCount} reserve alternate(s) promoted!`
    );
  };

  const handleLiveBreakaway = () => {
    // Pick 3 riders for a dramatic breakaway
    const breakaway = [riders[2]?.id, riders[10]?.id, riders[11]?.id].filter(Boolean);
    simulateLiveSituation(selectedRace.id, 42.5, breakaway);
    setLastActionMessage(
      `⚡ Live Telemetry Active: Breakaway established at 42.5 KM to go (+1:45 gap). Feed: Tissot Timing.`
    );
  };

  const handleFinish = () => {
    // Top 5 finish order
    const topFinishers = [
      riders[0]?.id, // Pogačar
      riders[2]?.id, // Van der Poel
      riders[1]?.id, // Remco
      riders[3]?.id, // Vingegaard
      riders[8]?.id, // Jorgenson
    ].filter(Boolean);

    simulateRaceFinish(selectedRace.id, topFinishers);
    setLastActionMessage(
      `🏁 Finish Line Reached! 1st: Tadej Pogačar (800 pts). User fantasy scores calculated and applied to General Classification!`
    );
  };

  const handleReset = () => {
    resetRaceSimulation(selectedRace.id);
    setLastActionMessage("🔄 Race simulation reset to Scheduled status.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              Milestone 2 Ingestion Engine
            </span>
            <span className="text-xs text-zinc-500 font-mono">Live Telemetry & DNS Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 flex items-center gap-2">
            <Radio className="w-7 h-7 text-emerald-400" />
            Race Ingestion & Operations Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor real-world feeds, test pre-race DNS scratches, execute KM 0 lockouts, and
            simulate live finish scoring.
          </p>
        </div>

        {/* Race Selector */}
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
          <span className="text-xs font-semibold text-zinc-400 pl-2">Active Race:</span>
          <select
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-200 focus:outline-none"
          >
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Notification Banner */}
      {lastActionMessage && (
        <div className="bg-amber-400/10 border border-amber-400/40 rounded-xl p-3.5 text-xs text-amber-300 font-medium flex items-center justify-between animate-fadeIn">
          <span>{lastActionMessage}</span>
          <button
            onClick={() => setLastActionMessage(null)}
            className="text-amber-400/70 hover:text-amber-200 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* External Feed Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
              Live Telemetry Feed
            </div>
            <div className="text-xs font-bold text-zinc-200 mt-0.5">Tissot / A.S.O. Open JSON</div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
              Provisional Results API
            </div>
            <div className="text-xs font-bold text-zinc-200 mt-0.5">RapidAPI Cycling Service</div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Synced
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-500 font-mono">
              Official Classifications
            </div>
            <div className="text-xs font-bold text-zinc-200 mt-0.5">UCI Data Hub Engine</div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">
            Standby (Post-Race)
          </span>
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <div className="text-xs font-mono uppercase text-amber-400 font-semibold">
              Live Simulation Stage
            </div>
            <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2 mt-0.5">
              Race Status:{" "}
              <span
                className={`uppercase px-2.5 py-0.5 rounded-lg text-xs font-mono font-black ${
                  currentStatus === "scheduled"
                    ? "bg-zinc-800 text-zinc-300"
                    : currentStatus === "locked"
                    ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                    : currentStatus === "in_progress"
                    ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}
              >
                {currentStatus.replace("_", " ")}
              </span>
            </h3>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Race
          </button>
        </div>

        {/* 4 Interactive Test Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Action 1: KM 0 Lockout */}
          <button
            onClick={handleLockout}
            disabled={currentStatus !== "scheduled"}
            className="p-4 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-950 border-zinc-800 hover:border-amber-400/60"
          >
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              1. Trigger KM 0 Lockout
            </div>
            <div className="text-[11px] text-zinc-400 mt-1.5">
              Executes atomic auto-substitution: any DNS starter is replaced by Alternate 1.
            </div>
          </button>

          {/* Action 2: Live In-Race Telemetry */}
          <button
            onClick={handleLiveBreakaway}
            disabled={currentStatus !== "locked"}
            className="p-4 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-950 border-zinc-800 hover:border-red-400/60"
          >
            <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              2. Simulate Live Breakaway
            </div>
            <div className="text-[11px] text-zinc-400 mt-1.5">
              Broadcasts live situation (42.5 KM to go, +1:45 breakaway gap) via Tissot feed.
            </div>
          </button>

          {/* Action 3: Finish Line Sprint */}
          <button
            onClick={handleFinish}
            disabled={currentStatus !== "in_progress"}
            className="p-4 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-950 border-zinc-800 hover:border-emerald-400/60"
          >
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              3. Simulate Sprint Finish
            </div>
            <div className="text-[11px] text-zinc-400 mt-1.5">
              Ingests top 10 finishers, calculates official UCI points, and updates standings.
            </div>
          </button>
        </div>
      </div>

      {/* Live Telemetry Display (Visible when in progress) */}
      {currentTelemetry && (
        <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                Live Broadcast Telemetry: {selectedRace.name}
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Speed: {currentTelemetry.currentSpeedKmh} km/h • Provider: {currentTelemetry.provider}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentTelemetry.groups.map((group, idx) => (
              <div
                key={idx}
                className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-200">{group.name}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {group.riderIds.length > 0 ? `${group.riderIds.length} Riders` : "Main Peloton"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-amber-400">
                    {group.gapFormatted}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {currentTelemetry.kmRemaining} KM remaining
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Startlist & Pre-Race DNS Scratch Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Confirmed Startlist ({startlist.length} Riders)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Official bib numbers assigned by race commissaires at team presentation.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 uppercase font-mono text-zinc-500 border-b border-zinc-800 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Bib</th>
                  <th className="py-2.5 px-3">Rider</th>
                  <th className="py-2.5 px-3">Team</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Pre-Race Test Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {startlist.map((entry) => {
                  const isDns = entry.status === "dns";
                  return (
                    <tr
                      key={entry.id}
                      className={isDns ? "bg-red-500/10 text-red-300" : "hover:bg-zinc-800/30"}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-400">
                        {entry.bibNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-zinc-200">
                        {entry.rider.firstName} {entry.rider.lastName}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {entry.rider.proTeam?.uciCode}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isDns
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isDns ? (
                          <span className="text-[10px] text-red-400 font-mono">
                            Scratched (DNS)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleScratch(entry.rider)}
                            disabled={currentStatus !== "scheduled"}
                            className="text-[11px] text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Simulate DNS
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Substitution Audit Log */}
        <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-lg">
          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              DNS Substitution Audit Log
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live records of pre-race scratches and promoted alternates.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {substitutionLogs.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-500 text-xs p-4">
                <CheckCircle2 className="w-8 h-8 text-zinc-700 mb-2" />
                No DNS auto-substitutions triggered yet. Scratch a starter on the left and trigger
                KM 0 rollout to test the automatic replacement engine!
              </div>
            ) : (
              substitutionLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-sky-500/30 rounded-xl p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                    <span className="text-sky-400 font-bold uppercase">
                      PROMOTED: {log.alternateRoleUsed}
                    </span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-zinc-200">
                    Starter <strong className="text-red-400">{log.scratchRider.lastName} (DNS)</strong>{" "}
                    replaced by <strong className="text-emerald-400">{log.promotedAlternate.lastName}</strong>
                  </div>
                  <div className="text-[10px] text-zinc-500 italic">{log.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
