"use client";

import { useEffect, useState } from "react";
import { getSummary, getBowlerGames } from "./lib/api";
import StrikeSpareChart from "./components/StrikeSpareChart";
import LeaveBreakdown from "./components/LeaveBreakdown";
import GameHistory from "./components/GameHistory";

// MVP: hardcoded bowler — replace with auth later
const BOWLER_ID = "00000000-0000-0000-0000-000000000001";

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSummary(BOWLER_ID), getBowlerGames(BOWLER_ID)])
      .then(([s, g]) => {
        setSummary(s);
        setGames(g);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    );
  }

  const noData = !summary || summary.total_frames === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">PinDex</h1>
          <p className="text-blue-300 text-sm">Your bowling analytics dashboard</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {noData ? (
          <div className="text-center py-24 text-slate-400">
            <p className="text-xl font-semibold">No games logged yet</p>
            <p className="text-sm mt-2">Open the PinDex mobile app to log your first game.</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Frames" value={summary.total_frames} />
              <StatCard label="Strike Rate" value={`${summary.strike_rate}%`} color="text-green-600" />
              <StatCard label="Spare Conversion" value={`${summary.spare_conversion_rate}%`} color="text-blue-600" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Strike vs Spare Rate">
                <StrikeSpareChart summary={summary} />
              </Card>
              <Card title="Most Common Leaves">
                <LeaveBreakdown leaves={summary.top_leaves} />
              </Card>
            </div>

            {/* Game history */}
            <Card title="Recent Games">
              <GameHistory games={games} />
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color = "text-slate-800" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
      <h2 className="text-slate-700 font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
