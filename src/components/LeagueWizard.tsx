"use client";

import React, { useState } from "react";
import { usePalmares } from "@/context/palmares-context";
import { ScoringSettings } from "@/types";
import {
  Trophy,
  Users,
  Settings2,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
  Award,
} from "lucide-react";

interface LeagueWizardProps {
  onSuccess: () => void;
}

export function LeagueWizard({ onSuccess }: LeagueWizardProps) {
  const { createLeague, races } = usePalmares();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: League Identity
  const [leagueName, setLeagueName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  // Step 2: Roster & Gameplay Rules
  const [maxRiderUses, setMaxRiderUses] = useState(3);
  const [startersCount, setStartersCount] = useState(8);
  const [alternatesCount, setAlternatesCount] = useState(3);

  // Step 3: Scoring Settings
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings>({
    useOfficialUci: true,
    captainMultiplier: 1.5,
    grandTourDailyStageWeight: 1.0,
    komPointsEnabled: true,
    sprintPointsEnabled: true,
  });

  // Step 4: Participating Races
  const [selectedRaceIds, setSelectedRaceIds] = useState<string[]>(
    races.map((r) => r.id)
  );

  const monuments = races.filter((r) => r.isMonument);
  const grandTours = races.filter((r) => r.isGrandTour);

  const applyPackage = (type: "all" | "monuments" | "grandtours") => {
    if (type === "all") {
      setSelectedRaceIds(races.map((r) => r.id));
    } else if (type === "monuments") {
      setSelectedRaceIds(monuments.map((r) => r.id));
    } else if (type === "grandtours") {
      setSelectedRaceIds(grandTours.map((r) => r.id));
    }
  };

  const toggleRace = (raceId: string) => {
    if (selectedRaceIds.includes(raceId)) {
      if (selectedRaceIds.length === 1) return; // Prevent 0 races
      setSelectedRaceIds(selectedRaceIds.filter((id) => id !== raceId));
    } else {
      setSelectedRaceIds([...selectedRaceIds, raceId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) return;

    createLeague({
      name: leagueName.trim(),
      teamName: teamName.trim() || "My Team",
      isPrivate,
      maxRiderUses,
      startersCount,
      alternatesCount,
      scoringSettings,
      participatingRaceIds: selectedRaceIds,
    });

    onSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Wizard Stepper Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              League Creation Wizard
            </span>
            <h1 className="text-2xl font-black text-zinc-100 mt-1">
              {step === 1 && "1. Name Your League"}
              {step === 2 && "2. Roster Rules & Quota"}
              {step === 3 && "3. Scoring & Points Settings"}
              {step === 4 && "4. Select Participating Races"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? "bg-amber-400 text-zinc-950 ring-2 ring-amber-400/30"
                    : step > s
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: League Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-2">
                League Name *
              </label>
              <input
                type="text"
                required
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="e.g. Flamme Rouge Champions, The Gruppetto Banter League"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Give your league a recognizable, memorable cycling title.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-200 mb-2">
                Your Team Name in this League *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Pogi Attack Squad, Cobble Crushers"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                The name of your personal squad that will appear on the leaderboard.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-zinc-200 mb-2">
                Privacy
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isPrivate
                      ? "bg-amber-400/10 border-amber-400/50 text-zinc-100"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Private League (Recommended)
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Only friends with your 6-8 character join code can participate.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !isPrivate
                      ? "bg-amber-400/10 border-amber-400/50 text-zinc-100"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    Public Open League
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Listed on the Palmares public directory for anyone to join.
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Roster & Gameplay Rules */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-400">
                    Flagship Engine: The 3-Race Maximum Quota
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Managers can select any pro rider a <strong>maximum of 3 times</strong> across
                    the entire season calendar. This ensures wild strategic variety without
                    requiring everyone to be online for a live draft!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Rider Quota (Max Uses)
                </label>
                <select
                  value={maxRiderUses}
                  onChange={(e) => setMaxRiderUses(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 font-semibold"
                >
                  <option value={2}>2 Races Max</option>
                  <option value={3}>3 Races Max (Official Standard)</option>
                  <option value={4}>4 Races Max</option>
                  <option value={5}>5 Races Max</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Number of times a manager can deploy a superstar like Pogačar or Remco.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Active Starters per Race
                </label>
                <select
                  value={startersCount}
                  onChange={(e) => setStartersCount(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 font-semibold"
                >
                  <option value={6}>6 Riders</option>
                  <option value={8}>8 Riders (Standard Pelotón)</option>
                  <option value={9}>9 Riders (Grand Tour Classic)</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Riders active on the road scoring points for each event.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Alternates (Reserves Bench)
                </label>
                <select
                  value={alternatesCount}
                  onChange={(e) => setAlternatesCount(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-zinc-100 font-semibold"
                >
                  <option value={1}>1 Alternate</option>
                  <option value={2}>2 Alternates</option>
                  <option value={3}>3 Alternates (Standard)</option>
                </select>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Ordered reserves who auto-substitute if a starter is DNS before roll-out.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Scoring Settings */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="pr-4">
                <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Official UCI Points Scale
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Riders score points identical to official UCI world tour scales (e.g. 800 pts for
                  Monuments, 1300 pts for Tour de France GC, 210 for stage wins).
                </div>
              </div>
              <input
                type="checkbox"
                checked={scoringSettings.useOfficialUci}
                onChange={(e) =>
                  setScoringSettings({ ...scoringSettings, useOfficialUci: e.target.checked })
                }
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="pr-4">
                <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  Captain Point Multiplier (1.5x)
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Designate 1 of your 8 starters as Team Captain to earn 1.5x UCI points for that
                  race.
                </div>
              </div>
              <select
                value={scoringSettings.captainMultiplier}
                onChange={(e) =>
                  setScoringSettings({
                    ...scoringSettings,
                    captainMultiplier: Number(e.target.value),
                  })
                }
                className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-lg p-2 font-semibold"
              >
                <option value={1.0}>1.0x (Disabled)</option>
                <option value={1.5}>1.5x (Standard Boost)</option>
                <option value={2.0}>2.0x (High Stakes)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="pr-4">
                <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-sky-400" />
                  Grand Tour Daily Stage Action
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Full stage win and podium points rewarded on every stage of Giro, Tour, and
                  Vuelta, keeping leagues active every single day.
                </div>
              </div>
              <input
                type="checkbox"
                checked={scoringSettings.grandTourDailyStageWeight === 1.0}
                onChange={(e) =>
                  setScoringSettings({
                    ...scoringSettings,
                    grandTourDailyStageWeight: e.target.checked ? 1.0 : 0.5,
                  })
                }
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Step 4: Participating Races */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="text-xs text-zinc-400">
                <strong className="text-amber-400">{selectedRaceIds.length}</strong> of{" "}
                {races.length} races selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPackage("all")}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => applyPackage("monuments")}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Monuments Only (5)
                </button>
                <button
                  type="button"
                  onClick={() => applyPackage("grandtours")}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Grand Tours (3)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {races.map((race) => {
                const isSelected = selectedRaceIds.includes(race.id);
                return (
                  <div
                    key={race.id}
                    onClick={() => toggleRace(race.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-zinc-950 border-amber-400/60 shadow-sm"
                        : "bg-zinc-950/40 border-zinc-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-100">{race.name}</span>
                        {race.isMonument && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded uppercase font-semibold">
                            Monument
                          </span>
                        )}
                        {race.isGrandTour && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded uppercase font-semibold">
                            Grand Tour
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {race.startDate} • {race.country} • {race.distanceKm} km
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        isSelected ? "bg-amber-400 text-zinc-950" : "border border-zinc-700"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={step === 1 && !leagueName.trim()}
              onClick={() => setStep((step + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-zinc-950 text-sm font-bold shadow-md shadow-amber-400/20 transition-all"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-sm font-black shadow-lg shadow-amber-500/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finish & Create League
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
