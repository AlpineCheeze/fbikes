"use client";

import React, { useState } from "react";
import { PalmaresProvider } from "@/context/palmares-context";
import { Navbar } from "@/components/Navbar";
import { LeagueDashboard } from "@/components/LeagueDashboard";
import { LeagueWizard } from "@/components/LeagueWizard";
import { CalendarView } from "@/components/CalendarView";
import { RaceOperationsDashboard } from "@/components/RaceOperationsDashboard";
import { JoinLeagueModal } from "@/components/JoinLeagueModal";

function PalmaresApp() {
  const [currentTab, setCurrentTab] = useState<"leagues" | "calendar" | "create" | "operations">("leagues");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
      />

      <main className="flex-1 pb-16">
        {currentTab === "leagues" && <LeagueDashboard />}
        {currentTab === "calendar" && <CalendarView />}
        {currentTab === "operations" && <RaceOperationsDashboard />}
        {currentTab === "create" && (
          <LeagueWizard
            onSuccess={() => {
              setCurrentTab("leagues");
            }}
          />
        )}
      </main>

      {/* Global Join Code Modal */}
      {isJoinModalOpen && (
        <JoinLeagueModal
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={() => {
            setIsJoinModalOpen(false);
            setCurrentTab("leagues");
          }}
        />
      )}

      {/* Cycling Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">PALMARES</span> • Fantasy Road Cycling
          </div>
          <div>
            Built with 3-Race Maximum Quotas, Official UCI Scoring & Atomic DNS Auto-Substitution
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <PalmaresProvider>
      <PalmaresApp />
    </PalmaresProvider>
  );
}
