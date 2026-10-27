"use client";

import React, { useState } from "react";
import { usePalmares } from "@/context/palmares-context";
import { X, Users, ArrowRight } from "lucide-react";

interface JoinLeagueModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinLeagueModal({ onClose, onSuccess }: JoinLeagueModalProps) {
  const { joinLeague } = usePalmares();
  const [code, setCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const res = joinLeague(code.trim(), teamName.trim());
    if (res.success) {
      onSuccess();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Join a Friend&apos;s League</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              League Invite Code *
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. PELOTON7"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 text-sm font-mono tracking-widest uppercase placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Your Team Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mont Ventoux Flyers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 font-medium bg-red-400/10 border border-red-400/20 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-amber-400/20"
            >
              Join League
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
