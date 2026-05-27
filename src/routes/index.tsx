import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, KeyRound, ScrollText, Clock, Crown, Palette } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Leaderboard } from "@/components/Leaderboard";
import { BattleModal } from "@/components/BattleModal";
import { MOCK_PLAYERS, GRID_SIZE as MOCK_GRID } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { api, PLAYER_COLORS } from "@/lib/api";

export function HomePage() {
  const { user, updateColor } = useAuth();
  const [modal, setModal] = useState(false);
  const [myMatches, setMyMatches] = useState<
    Array<{ id: string; code: string; status: string; playerCount: number; captures: number; createdAt: string }>
  >([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api.matches.mine();
        if (alive) setMyMatches(r.matches);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleColorChange = async (c: string) => {
    try {
      await updateColor(c);
    } catch {}
  };

  return (
    <div className="min-h-screen">
      <Navbar onStart={() => setModal(true)} />
      <Hero onJoin={() => setModal(true)} />

      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:py-12 md:px-6">
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5">
            {/* Welcome card */}
            <div className="ornament-corners rounded-2xl royal-border p-5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">
                Welcome
              </div>
              <h3 className="mt-1 text-xl text-[--royal-cream] sm:text-2xl">
                {user?.name || "Player"}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Start a new game or join a friend's room with their code.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModal(true)}
                  className="group flex flex-col items-start gap-1 rounded-xl border border-[--royal-gold]/30 bg-[--royal-gold]/8 p-3 text-left transition active:scale-[0.97] hover:border-[--royal-gold]/60"
                >
                  <Plus className="h-4 w-4 text-[--royal-gold]" />
                  <span className="text-xs font-semibold text-[--royal-cream]">Create</span>
                  <span className="text-[10px] text-muted-foreground">New room</span>
                </button>
                <button
                  onClick={() => setModal(true)}
                  className="group flex flex-col items-start gap-1 rounded-xl border border-[--royal-emerald]/30 bg-[--royal-emerald]/8 p-3 text-left transition active:scale-[0.97] hover:border-[--royal-emerald]/60"
                >
                  <KeyRound className="h-4 w-4 text-[--royal-emerald]" />
                  <span className="text-xs font-semibold text-[--royal-cream]">Join</span>
                  <span className="text-[10px] text-muted-foreground">With code</span>
                </button>
              </div>
            </div>

            {/* Color picker */}
            <div className="rounded-2xl royal-border p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-[--royal-gold]">
                <Palette className="h-3.5 w-3.5" /> Your color
              </h3>
              <div className="flex flex-wrap gap-2">
                {PLAYER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorChange(c)}
                    className={`h-9 w-9 rounded-lg transition ${
                      user?.preferredColor === c
                        ? "scale-110 ring-2 ring-[--royal-gold]"
                        : "ring-1 ring-white/10 hover:scale-105"
                    }`}
                    style={{ background: c, boxShadow: `0 0 8px ${c}55` }}
                    aria-label={`Pick color ${c}`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Used in your next game.
              </p>
            </div>

            {/* Recent matches */}
            <div className="rounded-2xl royal-border p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-[--royal-gold]">
                  <ScrollText className="h-3.5 w-3.5" /> Recent games
                </h3>
                <Link to="/activity" className="text-[10px] text-[--royal-emerald-bright] hover:underline">
                  See all
                </Link>
              </div>
              {myMatches.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No games yet. Create a room to start.
                </p>
              ) : (
                <ul className="space-y-2">
                  {myMatches.slice(0, 5).map((m) => (
                    <Link
                      key={m.id}
                      to={`/match/${m.code}`}
                      className="flex items-center justify-between rounded-xl border border-[--royal-gold]/10 bg-[--royal-onyx]/40 px-3 py-2 transition hover:border-[--royal-gold]/40"
                    >
                      <div>
                        <div className="font-mono text-xs font-bold tracking-[0.25em] text-[--royal-gold-bright]">
                          {m.code}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-[10px]">
                        <div className="text-[--royal-cream]">{m.playerCount} player{m.playerCount === 1 ? "" : "s"}</div>
                        <div className="text-muted-foreground">{m.captures} captures</div>
                      </div>
                    </Link>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div className="space-y-5">
            <section id="leaderboard">
              <Leaderboard players={MOCK_PLAYERS} totalTiles={MOCK_GRID * MOCK_GRID} />
            </section>

            <div className="ornament-corners rounded-2xl royal-border p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">
                <Crown className="h-3.5 w-3.5" /> How to play
              </div>
              <h3 className="text-xl text-[--royal-cream] sm:text-2xl">3 simple steps</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { n: "1", t: "Create a room", d: "Click Start Game. You'll get a 6-letter code." },
                  { n: "2", t: "Share the code", d: "Send the code to friends so they can join." },
                  { n: "3", t: "Capture tiles", d: "Tap tiles to claim them. Steal from opponents to grow." },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="rounded-xl border border-[--royal-gold]/15 bg-[--royal-onyx]/50 p-4 transition hover:border-[--royal-gold]/40"
                  >
                    <div className="font-mono text-3xl text-gradient">{s.n}</div>
                    <div className="mt-1 text-sm font-semibold text-[--royal-cream]">{s.t}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-10 border-t border-[--royal-gold]/15 py-6 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        <p>© 2026 · Grid Dominion</p>
      </footer>

      <BattleModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
