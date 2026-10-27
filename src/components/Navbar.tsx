"use client";

import React from "react";
import { usePalmares } from "@/context/palmares-context";
import { Trophy, Calendar, Users, PlusCircle, ShieldCheck } from "lucide-react";

interface NavbarProps {
  currentTab: "leagues" | "calendar" | "create";
  setCurrentTab: (tab: "leagues" | "calendar" | "create") => void;
  onOpenJoinModal: () => void;
}

export function Navbar({ currentTab, setCurrentTab, onOpenJoinModal }: NavbarProps) {
  const { currentUser, leagues, activeLeague, setActiveLeague } = usePalmares();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      {/* UCI Rainbow top bar */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-sky-500" />
        <div className="h-full flex-1 bg-red-500" />
        <div className="h-full flex-1 bg-black" />
        <div className="h-full flex-1 bg-amber-400" />
        <div className="h-full flex-1 bg-emerald-500" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab("leagues")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20">
            P
          </div>
          <div>
            <div className="text-xl font-black tracking-tight flex items-center gap-1.5">
              PALMARES
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30">
                PRO CYCLING
              </span>
            </div>
            <p className="text-xs text-zinc-400">Fantasy Football for Cycling</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setCurrentTab("leagues")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === "leagues"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            My League
          </button>
          <button
            onClick={() => setCurrentTab("calendar")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === "calendar"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-4 h-4 text-sky-400" />
            2027 Calendar
          </button>
          <button
            onClick={() => setCurrentTab("create")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              currentTab === "create"
                ? "bg-amber-400 text-zinc-950 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create League
          </button>
        </nav>

        {/* League Switcher & Actions */}
        <div className="flex items-center gap-3">
          {leagues.length > 0 && (
            <select
              value={activeLeague?.id || ""}
              onChange={(e) => {
                const found = leagues.find((l) => l.id === e.target.value);
                if (found) {
                  setActiveLeague(found);
                  setCurrentTab("leagues");
                }
              }}
              className="bg-zinc-900 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {leagues.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onOpenJoinModal}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            Join Code
          </button>

          {/* User profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-full ring-1 ring-amber-400/40 overflow-hidden bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-400">
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.displayName[0]
              )}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                {currentUser.displayName}
                <ShieldCheck className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">@{currentUser.username}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
