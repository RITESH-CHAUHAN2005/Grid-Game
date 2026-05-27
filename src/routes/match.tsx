import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Check, Users, Crown, Zap, LogOut, Wifi, WifiOff } from "lucide-react";
import { api, type Match } from "@/lib/api";
import { getSocket, type TileUpdate } from "@/lib/socket";
import { useAuth } from "@/lib/auth";

// Lean Tile: minimal CSS, no heavy hover effects on mobile
const Tile = memo(
  function Tile({
    idx,
    color,
    mine,
    onClick,
  }: {
    idx: number;
    color: string | null;
    mine: boolean;
    onClick: (idx: number) => void;
  }) {
    return (
      <button
        data-tile-idx={idx}
        onClick={() => onClick(idx)}
        className={`relative aspect-square touch-manipulation rounded-[2px] transition-transform duration-75 ease-out active:scale-95 sm:hover:z-10 sm:hover:scale-[1.15] ${
          mine ? "ring-1 ring-[--royal-gold]/45" : ""
        }`}
        style={{
          background: color || "rgba(245, 236, 214, 0.025)",
          boxShadow: color ? `inset 0 0 0 1px ${color}cc` : "inset 0 0 0 1px rgba(212, 162, 83, 0.08)",
        }}
        aria-label={color ? "Captured tile" : "Empty tile"}
      />
    );
  },
  (a, b) => a.color === b.color && a.mine === b.mine && a.idx === b.idx,
);

export function MatchPage() {
  const { code = "" } = useParams<{ code: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastCapture, setLastCapture] = useState<TileUpdate | null>(null);

  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const lastClickRef = useRef<{ idx: number; at: number }>({ idx: -1, at: 0 });

  const upper = code.toUpperCase();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let m: Match;
        try {
          const r = await api.matches.get(upper);
          m = r.match;
        } catch {
          const r = await api.matches.join(upper);
          m = r.match;
        }
        if (user && !m.players.some((p) => p.userId === user.id)) {
          const r = await api.matches.join(upper);
          m = r.match;
        }
        if (alive) setMatch(m);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Could not load game");
      }
    })();
    return () => {
      alive = false;
    };
  }, [upper, user]);

  useEffect(() => {
    if (!match) return;
    const sock = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    if (sock.connected) setConnected(true);

    sock.emit("match:join", { code: upper }, (resp: any) => {
      if (resp?.error) setErr(resp.error);
      else if (resp?.match) setMatch(resp.match);
    });

    const onTile = (payload: TileUpdate) => {
      setLastCapture(payload);
      setMatch((m) => {
        if (!m) return m;
        const grid = m.grid.slice();
        grid[payload.idx] = { ownerId: payload.ownerId, color: payload.color };
        const players = m.players.map((p) => {
          const c = payload.tileCounts.find((t) => t.userId === p.userId);
          return c ? { ...p, tiles: c.tiles } : p;
        });
        return { ...m, grid, players, captures: m.captures + 1 };
      });

      if (gridContainerRef.current) {
        const el = gridContainerRef.current.querySelector(
          `[data-tile-idx="${payload.idx}"]`,
        ) as HTMLElement | null;
        if (el) {
          el.classList.remove("tile-flash");
          void el.offsetWidth;
          el.classList.add("tile-flash");
        }
      }
    };
    sock.on("tile:updated", onTile);

    const onOnline = ({ userId }: any) => {
      setMatch((m) =>
        m
          ? {
              ...m,
              players: m.players.map((p) => (p.userId === userId ? { ...p, online: true } : p)),
            }
          : m,
      );
    };
    const onOffline = ({ userId }: any) => {
      setMatch((m) =>
        m
          ? {
              ...m,
              players: m.players.map((p) => (p.userId === userId ? { ...p, online: false } : p)),
            }
          : m,
      );
    };
    sock.on("player:online", onOnline);
    sock.on("player:offline", onOffline);

    return () => {
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
      sock.off("tile:updated", onTile);
      sock.off("player:online", onOnline);
      sock.off("player:offline", onOffline);
      sock.emit("match:leave", { code: upper });
    };
  }, [match?.id, upper]);

  const me = useMemo(() => match?.players.find((p) => p.userId === user?.id) || null, [match, user]);

  const handleCapture = useCallback(
    (idx: number) => {
      if (!match || !me) return;
      const now = performance.now();
      if (lastClickRef.current.idx === idx && now - lastClickRef.current.at < 80) return;
      lastClickRef.current = { idx, at: now };

      setMatch((m) => {
        if (!m) return m;
        const current = m.grid[idx];
        if (current.ownerId === me.userId) return m;
        const grid = m.grid.slice();
        grid[idx] = { ownerId: me.userId, color: me.color };
        const players = m.players.map((p) => {
          if (p.userId === me.userId) return { ...p, tiles: p.tiles + 1 };
          if (current.ownerId && p.userId === current.ownerId) {
            return { ...p, tiles: Math.max(0, p.tiles - 1) };
          }
          return p;
        });
        return { ...m, grid, players };
      });

      if (gridContainerRef.current) {
        const el = gridContainerRef.current.querySelector(
          `[data-tile-idx="${idx}"]`,
        ) as HTMLElement | null;
        if (el) {
          el.classList.remove("tile-flash");
          void el.offsetWidth;
          el.classList.add("tile-flash");
        }
      }

      const sock = getSocket();
      sock.emit("tile:capture", { code: upper, idx }, (resp: any) => {
        if (resp?.error) setErr(resp.error);
      });
    },
    [match, me, upper],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(upper);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (err && !match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl text-[--royal-cream]">Can't enter room</h2>
          <p className="mt-2 text-sm text-muted-foreground">{err}</p>
          <button
            onClick={() => nav("/")}
            className="mt-4 rounded-full border border-[--royal-gold]/40 px-4 py-2 text-sm text-[--royal-gold] hover:bg-[--royal-gold]/10"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm tracking-[0.3em] text-muted-foreground">LOADING ROOM…</div>
      </div>
    );
  }

  const gridSize = match.gridSize;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[280px] w-[500px] -translate-x-1/2 rounded-full bg-[--royal-gold]/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5">
        {/* Compact top bar - mobile-friendly */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-1.5 rounded-full border border-[--royal-gold]/20 bg-[--royal-onyx]/60 px-2.5 py-1.5 text-xs text-[--royal-cream] transition hover:border-[--royal-gold]/50 sm:px-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </button>

          <div className="order-3 flex w-full items-center justify-center sm:order-none sm:w-auto">
            <div className="ornament-corners flex items-center gap-1.5 rounded-2xl border border-[--royal-gold]/30 bg-[--royal-onyx]/80 px-3 py-1.5 sm:gap-2 sm:px-5">
              <Crown className="h-3.5 w-3.5 text-[--royal-gold]" />
              <span className="hidden text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:inline">Code</span>
              <span className="font-mono text-base font-bold tracking-[0.25em] text-[--royal-gold-bright] sm:text-lg sm:tracking-[0.3em]">{upper}</span>
              <button
                onClick={copyCode}
                className="ml-1 rounded-full p-1 text-muted-foreground transition hover:bg-[--royal-gold]/10 hover:text-[--royal-gold]"
                aria-label="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[--royal-emerald]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 sm:gap-1.5 sm:px-3 ${
                connected
                  ? "border border-[--royal-emerald]/40 bg-[--royal-emerald]/10 text-[--royal-emerald-bright]"
                  : "border border-amber-500/40 bg-amber-500/10 text-amber-300"
              }`}
            >
              {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{connected ? "Live" : "Reconnecting"}</span>
            </div>
            <button
              onClick={async () => {
                try {
                  await api.matches.leave(upper);
                } catch {}
                nav("/");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-[--royal-crimson]/30 bg-[--royal-crimson]/10 px-2.5 py-1.5 text-[--royal-crimson-bright] transition hover:border-[--royal-crimson]/60 sm:gap-1.5 sm:px-3"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* Layout: board first on mobile, sidebar below */}
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_240px]">
          {/* CENTER on desktop / TOP on mobile: Board */}
          <div className="order-1 flex w-full items-start justify-center lg:order-2">
            <div className="ornament-corners relative w-full max-w-[min(80vh,720px)] rounded-2xl royal-border p-2 shadow-[0_30px_80px_-25px_rgba(0,0,0,0.7)] sm:rounded-3xl sm:p-3 md:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <h2 className="text-base text-[--royal-cream] sm:text-lg md:text-xl">Game Board</h2>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
                  {match.captures} captures · {match.players.length} player{match.players.length === 1 ? "" : "s"} · {gridSize}×{gridSize}
                </p>
              </div>

              <div className="aspect-square w-full">
                <div
                  ref={gridContainerRef}
                  className="grid h-full w-full gap-[2px] rounded-xl bg-black/40 p-1 sm:rounded-2xl sm:p-1.5 md:p-2"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    contain: "layout paint style",
                  }}
                >
                  {match.grid.map((tile, i) => (
                    <Tile
                      key={i}
                      idx={i}
                      color={tile.color}
                      mine={tile.ownerId === user?.id}
                      onClick={handleCapture}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:tracking-[0.25em]">
                Tap a tile to capture · steal opponents' tiles
              </p>
            </div>
          </div>

          {/* SIDEBAR: Players + your info */}
          <aside className="order-2 space-y-3 lg:order-1 lg:sticky lg:top-4 lg:self-start">
            <PlayerList players={match.players} meId={user?.id || ""} />
            {me && (
              <div className="rounded-2xl border border-[--royal-gold]/25 bg-[--royal-onyx]/70 p-3">
                <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  You
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ background: me.color, boxShadow: `0 0 8px ${me.color}` }}
                  />
                  <span className="text-sm font-semibold text-[--royal-cream]">{me.name}</span>
                  <span className="ml-auto font-mono text-base font-bold text-[--royal-gold-bright]">
                    {me.tiles}
                  </span>
                </div>
              </div>
            )}
          </aside>

          {/* Right column (xl+): last capture + score */}
          <div className="order-3 hidden space-y-3 xl:block xl:sticky xl:top-4 xl:self-start">
            {lastCapture ? (
              <LastCaptureCard data={lastCapture} />
            ) : (
              <div className="rounded-2xl border border-[--royal-gold]/15 bg-[--royal-onyx]/50 p-4 text-[11px] text-muted-foreground">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[--royal-gold]">
                  <Zap className="h-3 w-3" /> Last capture
                </div>
                Waiting for first capture...
              </div>
            )}
            <ScoreCard players={match.players} />
          </div>
        </div>

        {/* On smaller screens, last-capture stacks under */}
        {lastCapture && (
          <div className="mt-3 xl:hidden">
            <LastCaptureCard data={lastCapture} />
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerList({ players, meId }: { players: Match["players"]; meId: string }) {
  const sorted = [...players].sort((a, b) => b.tiles - a.tiles);
  return (
    <div className="rounded-2xl royal-border p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h3 className="flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] text-[--royal-gold]">
          <Users className="h-3.5 w-3.5" /> Players
        </h3>
        <span className="text-[10px] text-muted-foreground">{players.length} in room</span>
      </div>
      <ul className="space-y-2">
        {sorted.map((p, idx) => (
          <li
            key={p.userId}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
              p.userId === meId
                ? "border-[--royal-gold]/40 bg-[--royal-gold]/8"
                : "border-[--royal-gold]/10 bg-[--royal-onyx]/40"
            }`}
          >
            {idx === 0 && <Crown className="h-3.5 w-3.5 text-[--royal-gold]" />}
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{
                background: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                opacity: p.online ? 1 : 0.35,
              }}
            />
            <span className="truncate text-sm font-medium text-[--royal-cream]">{p.name}</span>
            {p.userId === meId && (
              <span className="rounded-full bg-[--royal-gold]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[--royal-gold]">
                You
              </span>
            )}
            <span className="ml-auto font-mono text-sm font-bold text-[--royal-gold-bright]">{p.tiles}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreCard({ players }: { players: Match["players"] }) {
  const total = players.reduce((s, p) => s + p.tiles, 0) || 1;
  const sorted = [...players].sort((a, b) => b.tiles - a.tiles);
  return (
    <div className="rounded-2xl border border-[--royal-gold]/15 bg-[--royal-onyx]/60 p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-[--royal-gold]">
        Territory
      </div>
      <ul className="space-y-2">
        {sorted.map((p) => {
          const pct = Math.round((p.tiles / total) * 100);
          return (
            <li key={p.userId} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="truncate text-[--royal-cream]/85">{p.name}</span>
                <span className="font-mono text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[--royal-onyx]/80">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${pct}%`, background: p.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LastCaptureCard({ data }: { data: TileUpdate }) {
  return (
    <div
      className="rounded-2xl border bg-[--royal-onyx]/60 p-3 text-xs"
      style={{ borderColor: `${data.color}55` }}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <Zap className="h-3 w-3" style={{ color: data.color }} /> Last capture
      </div>
      <div className="flex items-center gap-2 text-[--royal-cream]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: data.color }} />
        <span className="font-semibold">{data.ownerName}</span>
        {data.stoleFrom ? (
          <span className="text-[--royal-crimson-bright]">stole tile #{data.idx}</span>
        ) : (
          <span className="text-muted-foreground">captured tile #{data.idx}</span>
        )}
      </div>
    </div>
  );
}
