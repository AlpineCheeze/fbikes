"use client";

import React, { useState, useMemo } from "react";
import { usePalmares } from "@/context/palmares-context";
import { Race, Rider } from "@/types";
import {
  X,
  Star,
  ShieldAlert,
  Info,
  CheckCircle,
  Search,
  ArrowUpDown,
  Flame,
  Award,
} from "lucide-react";
import { formatUciPoints } from "@/lib/utils";

interface LineupBuilderModalProps {
  race: Race;
  onClose: () => void;
}

export function LineupBuilderModal({ race, onClose }: LineupBuilderModalProps) {
  const {
    currentUser,
    activeLeague,
    leagueMembers,
    riders,
    lineups,
    saveLineup,
    getRiderQuotaUsage,
  } = usePalmares();

  const currentMember = leagueMembers.find(
    (m) => m.leagueId === activeLeague?.id && m.userId === currentUser.id
  );

  const existingLineup = currentMember
    ? lineups[`${currentMember.id}_${race.id}`]
    : undefined;

  // Selected Starters: 8 slots
  const [starters, setStarters] = useState<string[]>(() => {
    if (existingLineup) {
      return existingLineup.slots
        .filter((s) => s.slotRole === "starter")
        .map((s) => s.riderId);
    }
    return [];
  });

  // Selected Captain (must be in starters)
  const [captainId, setCaptainId] = useState<string | null>(() => {
    if (existingLineup) {
      const captain = existingLineup.slots.find((s) => s.isCaptain);
      return captain ? captain.riderId : null;
    }
    return null;
  });

  // Selected Alternates: 3 slots
  const [alternates, setAlternates] = useState<string[]>(() => {
    if (existingLineup) {
      return existingLineup.slots
        .filter((s) => s.slotRole.startsWith("alternate"))
        .sort((a, b) => a.slotRole.localeCompare(b.slotRole))
        .map((s) => s.riderId);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [saveStatus, setSaveStatus] = useState<{ success?: boolean; message?: string } | null>(
    null
  );

  const startersCount = activeLeague?.startersCount || 8;
  const alternatesCount = activeLeague?.alternatesCount || 3;

  // Filter riders
  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      const matchesSearch =
        r.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.proTeam?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.proTeam?.uciCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSpecialty =
        selectedSpecialty === "all" || r.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [riders, searchQuery, selectedSpecialty]);

  const toggleStarter = (rider: Rider) => {
    if (!currentMember) return;
    const isAlreadyStarter = starters.includes(rider.id);

    if (isAlreadyStarter) {
      setStarters(starters.filter((id) => id !== rider.id));
      if (captainId === rider.id) setCaptainId(null);
    } else {
      if (starters.length >= startersCount) return;
      if (alternates.includes(rider.id)) {
        setAlternates(alternates.filter((id) => id !== rider.id));
      }

      // Check quota
      const quota = getRiderQuotaUsage(currentMember.id, rider.id);
      if (quota.remaining <= 0) {
        alert(
          `Season Quota Reached: You have already picked ${rider.firstName} ${rider.lastName} ${quota.max} times!`
        );
        return;
      }

      const newStarters = [...starters, rider.id];
      setStarters(newStarters);
      if (!captainId) setCaptainId(rider.id);
    }
  };

  const toggleAlternate = (rider: Rider) => {
    if (!currentMember) return;
    const isAlreadyAlt = alternates.includes(rider.id);

    if (isAlreadyAlt) {
      setAlternates(alternates.filter((id) => id !== rider.id));
    } else {
      if (alternates.length >= alternatesCount) return;
      if (starters.includes(rider.id)) {
        setStarters(starters.filter((id) => id !== rider.id));
        if (captainId === rider.id) setCaptainId(null);
      }
      setAlternates([...alternates, rider.id]);
    }
  };

  const handleSave = () => {
    if (!currentMember) return;

    if (starters.length !== startersCount) {
      setSaveStatus({
        success: false,
        message: `Please select exactly ${startersCount} starters for your active lineup.`,
      });
      return;
    }

    const starterPayload = starters.map((id) => ({
      riderId: id,
      isCaptain: id === captainId,
    }));

    const altPayload = alternates.map((id) => ({
      riderId: id,
    }));

    const result = saveLineup(currentMember.id, race.id, starterPayload, altPayload);
    setSaveStatus(result);
    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30 uppercase">
                Lineup Builder
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Locks: {new Date(race.lockoutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h2 className="text-xl font-black text-zinc-100 mt-1 flex items-center gap-2">
              {race.name}
              <span className="text-sm font-normal text-zinc-400">
                ({race.distanceKm} km • {race.elevationGainM}m elevation)
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Your Selected Squad */}
          <div className="lg:col-span-5 space-y-5">
            {/* Starters Section */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  Active Starting 8 ({starters.length}/{startersCount})
                </div>
                <span className="text-[11px] text-zinc-400">⭐ Tap star for Captain (1.5x)</span>
              </div>

              <div className="space-y-1.5 min-h-[260px] bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
                {starters.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-zinc-500 text-xs">
                    <Award className="w-8 h-8 text-zinc-700 mb-2" />
                    No starters selected yet. Tap &ldquo;+ Starter&rdquo; from the peloton list on the right.
                  </div>
                ) : (
                  starters.map((riderId, index) => {
                    const rider = riders.find((r) => r.id === riderId);
                    if (!rider) return null;
                    const isCaptain = captainId === rider.id;
                    const quota = currentMember
                      ? getRiderQuotaUsage(currentMember.id, rider.id)
                      : { used: 0, max: 3, remaining: 3 };

                    return (
                      <div
                        key={rider.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 text-zinc-500 font-mono text-[10px]">{index + 1}</span>
                          <span className="font-bold text-zinc-200 truncate">
                            {rider.firstName} {rider.lastName}
                          </span>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {rider.proTeam?.uciCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCaptainId(rider.id)}
                            title="Set as Captain (1.5x Points)"
                            className={`p-1 rounded transition-colors ${
                              isCaptain
                                ? "text-amber-400 bg-amber-400/20"
                                : "text-zinc-600 hover:text-amber-400"
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {quota.remaining}/{quota.max} left
                          </span>
                          <button
                            onClick={() => toggleStarter(rider)}
                            className="text-zinc-500 hover:text-red-400 text-[11px] px-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Alternates Bench Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Ordered Alternates Bench ({alternates.length}/{alternatesCount})
                </div>
                <span className="text-[10px] text-zinc-500">Auto-promoted on DNS</span>
              </div>

              <div className="space-y-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5">
                {alternates.length === 0 ? (
                  <div className="py-4 text-center text-zinc-500 text-xs">
                    Select up to 3 reserves. (Alternate 1, 2, 3)
                  </div>
                ) : (
                  alternates.map((riderId, index) => {
                    const rider = riders.find((r) => r.id === riderId);
                    if (!rider) return null;
                    return (
                      <div
                        key={rider.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-sky-400 uppercase">
                            ALT {index + 1}
                          </span>
                          <span className="font-semibold text-zinc-300">
                            {rider.firstName} {rider.lastName}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleAlternate(rider)}
                          className="text-zinc-500 hover:text-red-400 text-[11px]"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DNS Auto-Substitution Logic Box */}
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-[11px] text-sky-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
              <div>
                <strong>Palmares DNS Safety Guarantee:</strong> If an active starter pulls out or is
                officially marked DNS before the neutralized roll-out, your reserves (ALT 1, 2, 3)
                will automatically slot into the starting lineup!
              </div>
            </div>
          </div>

          {/* Right Column: Peloton Rider Pool */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search pro riders or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="all">All Specialties</option>
                <option value="climber">Climber</option>
                <option value="puncheur">Puncheur</option>
                <option value="sprinter">Sprinter</option>
                <option value="all_rounder">All-Rounder</option>
                <option value="time_trialist">Time Trialist</option>
              </select>
            </div>

            {/* Rider List */}
            <div className="flex-1 overflow-y-auto max-h-[460px] space-y-2 pr-1">
              {filteredRiders.map((rider) => {
                const isStarter = starters.includes(rider.id);
                const isAlt = alternates.includes(rider.id);
                const quota = currentMember
                  ? getRiderQuotaUsage(currentMember.id, rider.id)
                  : { used: 0, max: 3, remaining: 3 };

                const isLockedOut = !isStarter && quota.remaining <= 0;

                return (
                  <div
                    key={rider.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isStarter
                        ? "bg-amber-400/10 border-amber-400/50"
                        : isAlt
                        ? "bg-sky-500/10 border-sky-500/50"
                        : isLockedOut
                        ? "bg-zinc-950/40 border-zinc-800 opacity-40 cursor-not-allowed"
                        : "bg-zinc-950 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">
                          {rider.firstName} {rider.lastName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          {rider.proTeam?.uciCode}
                        </span>
                        <span className="text-[10px] text-zinc-400 capitalize">
                          {rider.specialty.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-400">
                        <span>UCI Pts: {formatUciPoints(rider.currentUciPoints)}</span>
                        <span className="text-zinc-600">•</span>
                        <span
                          className={`font-mono text-[10px] font-semibold ${
                            quota.remaining === 0
                              ? "text-red-400"
                              : quota.remaining === 1
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          Season Quota: {quota.remaining}/{quota.max} left
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLockedOut ? (
                        <span className="text-[10px] font-semibold text-red-400 uppercase px-2 py-1 bg-red-400/10 rounded">
                          Quota Exhausted
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleStarter(rider)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                              isStarter
                                ? "bg-amber-400 text-zinc-950"
                                : starters.length >= startersCount
                                ? "opacity-30 cursor-not-allowed bg-zinc-800 text-zinc-400"
                                : "bg-zinc-800 hover:bg-amber-400/20 text-zinc-200 hover:text-amber-300"
                            }`}
                          >
                            {isStarter ? "✓ Starter" : "+ Starter"}
                          </button>
                          <button
                            onClick={() => toggleAlternate(rider)}
                            className={`text-xs px-2 py-1.5 rounded-lg font-medium transition-all ${
                              isAlt
                                ? "bg-sky-400 text-zinc-950 font-bold"
                                : alternates.length >= alternatesCount
                                ? "opacity-30 cursor-not-allowed bg-zinc-800 text-zinc-400"
                                : "bg-zinc-800 hover:bg-sky-500/20 text-zinc-400 hover:text-sky-300"
                            }`}
                          >
                            {isAlt ? "✓ Alt" : "+ Alt"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div>
            {saveStatus && (
              <span
                className={`text-xs font-semibold ${
                  saveStatus.success ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {saveStatus.message}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black shadow-lg shadow-amber-400/20 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Save & Lock In Lineup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
