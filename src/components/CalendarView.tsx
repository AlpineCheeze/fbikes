"use client";

import React, { useState } from "react";
import { usePalmares } from "@/context/palmares-context";
import { Race } from "@/types";
import { LineupBuilderModal } from "./LineupBuilderModal";
import {
  Calendar as CalendarIcon,
  MapPin,
  Mountain,
  Flame,
  ArrowRight,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export function CalendarView() {
  const { races, activeLeague, currentMember, lineups } = usePalmares() as any;
  const [filter, setFilter] = useState<"all" | "monuments" | "grandtours">("all");
  const [search, setSearch] = useState("");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  const filteredRaces = races.filter((r: Race) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "monuments" && r.isMonument) ||
      (filter === "grandtours" && r.isGrandTour);

    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.country.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-sky-400" />
            2027 Professional Cycling WorldTour Calendar
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Official UCI WorldTour schedule, Monument Classics, and Grand Tours.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All WorldTour
          </button>
          <button
            onClick={() => setFilter("monuments")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "monuments"
                ? "bg-red-500/20 text-red-400 border border-red-500/30 font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Monuments (5)
          </button>
          <button
            onClick={() => setFilter("grandtours")}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === "grandtours"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Grand Tours (3)
          </button>
        </div>
      </div>

      {/* Grid of Races */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRaces.map((race: Race) => {
          return (
            <div
              key={race.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatDate(race.startDate)}
                  </span>
                  <div className="flex items-center gap-1">
                    {race.isMonument && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                        Monument
                      </span>
                    )}
                    {race.isGrandTour && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                        Grand Tour
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-black text-zinc-100">{race.name}</h3>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{race.country}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>{race.distanceKm} km</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Mountain className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{race.elevationGainM.toLocaleString()} m climbing</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRace(race)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                Set 8-Rider Lineup
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {selectedRace && (
        <LineupBuilderModal
          race={selectedRace}
          onClose={() => setSelectedRace(null)}
        />
      )}
    </div>
  );
}
