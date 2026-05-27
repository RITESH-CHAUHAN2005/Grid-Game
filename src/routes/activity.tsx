import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ScrollText,
  Sparkles,
  LogIn,
  Plus,
  Users,
  Target,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BattleModal } from "@/components/BattleModal";
import { api, type ActivityItem } from "@/lib/api";

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  signup: { label: "Signed up", icon: <Sparkles className="h-3.5 w-3.5" />, tone: "text-[--royal-gold]" },
  guest_signup: { label: "Joined as guest", icon: <Sparkles className="h-3.5 w-3.5" />, tone: "text-[--royal-gold]" },
  login: { label: "Logged in", icon: <LogIn className="h-3.5 w-3.5" />, tone: "text-[--royal-emerald-bright]" },
  match_create: { label: "Created room", icon: <Plus className="h-3.5 w-3.5" />, tone: "text-[--royal-gold-bright]" },
  match_join: { label: "Joined room", icon: <Users className="h-3.5 w-3.5" />, tone: "text-[--royal-emerald]" },
  match_leave: { label: "Left room", icon: <Users className="h-3.5 w-3.5" />, tone: "text-muted-foreground" },
  tile_capture: { label: "Captured tile", icon: <Target className="h-3.5 w-3.5" />, tone: "text-[--royal-crimson-bright]" },
};

export function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.activity.me(100);
      setItems(r.activity);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.action] = (acc[it.action] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar onStart={() => setModal(true)} />

      <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="pointer-events-none absolute -top-20 right-0 h-[280px] w-[280px] rounded-full bg-[--royal-gold]/6 blur-[120px]" />

        <div className="relative mb-5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-[--royal-gold]/20 bg-[--royal-onyx]/60 px-3 py-1.5 text-xs text-[--royal-cream] transition hover:border-[--royal-gold]/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-[--royal-gold]/20 bg-[--royal-onyx]/60 px-3 py-1.5 text-xs text-[--royal-cream] transition hover:border-[--royal-gold]/50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">My activity</div>
          <h1 className="mt-1 flex items-center gap-2 text-3xl text-[--royal-cream] sm:text-4xl">
            <ScrollText className="h-6 w-6 text-[--royal-gold] sm:h-7 sm:w-7" /> Activity Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your recent games, captures, and room joins.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Total actions" value={items.length} accent="--royal-gold" />
            <StatCard label="Tiles captured" value={summary.tile_capture || 0} accent="--royal-crimson" />
            <StatCard
              label="Games played"
              value={(summary.match_create || 0) + (summary.match_join || 0)}
              accent="--royal-emerald"
            />
          </div>

          <div className="ornament-corners mt-5 rounded-2xl royal-border p-3 shadow-xl sm:p-4">
            {loading ? (
              <div className="py-10 text-center text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No activity yet.</p>
                <button
                  onClick={() => setModal(true)}
                  className="mt-3 rounded-full bg-gradient-to-r from-[--royal-gold] to-[--royal-gold-bright] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[--royal-onyx]"
                >
                  Start your first game
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-[--royal-gold]/10">
                {items.map((it) => {
                  const meta = ACTION_META[it.action] || {
                    label: it.action,
                    icon: <ScrollText className="h-3.5 w-3.5" />,
                    tone: "text-muted-foreground",
                  };
                  return (
                    <li key={it.id} className="flex items-start gap-3 py-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[--royal-gold]/15 bg-[--royal-onyx]/60 ${meta.tone}`}
                      >
                        {meta.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-sm font-medium text-[--royal-cream]">{meta.label}</span>
                          {it.meta?.matchCode && (
                            <Link
                              to={`/match/${it.meta.matchCode}`}
                              className="font-mono text-[11px] tracking-[0.2em] text-[--royal-gold-bright] hover:underline"
                            >
                              {it.meta.matchCode}
                            </Link>
                          )}
                          {typeof it.meta?.tileIdx === "number" && (
                            <span className="text-[11px] text-muted-foreground">
                              · tile #{it.meta.tileIdx}
                            </span>
                          )}
                          {it.meta?.stoleFrom && (
                            <span className="rounded-full bg-[--royal-crimson]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[--royal-crimson-bright]">
                              Stolen
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(it.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <BattleModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="rounded-2xl border bg-[--royal-onyx]/60 p-4"
      style={{ borderColor: `var(${accent})40` }}
    >
      <div className="font-mono text-3xl font-bold" style={{ color: `var(${accent})` }}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
    </div>
  );
}
