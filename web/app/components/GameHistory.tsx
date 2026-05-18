"use client";

interface Game {
  id: string;
  lane: number | null;
  league: string | null;
  total_score: number | null;
  created_at: string;
}

export default function GameHistory({ games }: { games: Game[] }) {
  if (!games.length) {
    return <p className="text-slate-400 text-sm text-center py-8">No games yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left border-b border-slate-100">
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">League</th>
            <th className="pb-3 font-medium">Lane</th>
            <th className="pb-3 font-medium text-right">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {games.map((g) => (
            <tr key={g.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-600">
                {new Date(g.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 text-slate-600">{g.league ?? "—"}</td>
              <td className="py-3 text-slate-600">{g.lane ?? "—"}</td>
              <td className="py-3 text-right font-bold text-slate-800">
                {g.total_score ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
