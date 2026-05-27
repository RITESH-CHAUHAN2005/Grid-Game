import { Crown } from "lucide-react";
import type { Player } from "@/lib/mock";

export function Leaderboard({ players, totalTiles }: { players: Player[]; totalTiles: number }) {
  const sorted = [...players].sort((a, b) => b.tiles - a.tiles);
  const max = sorted[0]?.tiles || 1;

  return (
    <div id="leaderboard" className="ornament-corners rounded-2xl royal-border p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-[0.3em] text-[--royal-gold]">Leaderboard</h3>
        <span className="rounded-full bg-[--royal-emerald]/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[--royal-emerald-bright]">
          Demo
        </span>
      </div>
      <ul className="space-y-3">
        {sorted.slice(0, 8).map((p, i) => (
          <li key={p.id} className="group">
            <div className="flex items-center gap-3">
              <span className="w-5 text-center font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative">
                <div
                  className="h-8 w-8 rounded-full ring-2 ring-[--royal-gold]/10"
                  style={{
                    background: `linear-gradient(135deg, ${p.color}, ${p.color}88)`,
                    boxShadow: `0 0 12px ${p.color}55`,
                  }}
                />
                {i === 0 && (
                  <Crown className="absolute -top-2.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 fill-[--royal-gold] text-[--royal-gold] drop-shadow-[0_0_4px_rgba(212,162,83,0.9)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[--royal-cream]">{p.name}</span>
                  <span className="font-mono text-xs font-bold text-[--royal-gold-bright]">
                    {p.tiles}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[--royal-onyx]/80">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${(p.tiles / max) * 100}%`,
                      background: `linear-gradient(90deg, ${p.color}, ${p.color}aa)`,
                      boxShadow: `0 0 8px ${p.color}66`,
                    }}
                  />
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {((p.tiles / totalTiles) * 100).toFixed(1)}% territory
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
