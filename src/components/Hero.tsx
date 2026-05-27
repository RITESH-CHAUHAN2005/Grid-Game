import { Swords, Trophy, Crown } from "lucide-react";

export function Hero({ onJoin: onStart }: { onJoin: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/40 grid-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[380px] w-[640px] -translate-x-1/2 rounded-full bg-[--royal-gold]/8 blur-[120px]" />
        <div className="absolute right-10 top-40 h-[220px] w-[220px] rounded-full bg-[--royal-emerald]/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-12 text-center sm:py-16 md:px-6 md:py-24">
        {/* Crest */}
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[--royal-gold]/40 to-[--royal-emerald]/20 blur-md" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[--royal-gold]/60 bg-[--royal-onyx] sm:h-14 sm:w-14">
              <Crown className="h-6 w-6 text-[--royal-gold] sm:h-7 sm:w-7" />
            </div>
          </div>
        </div>

        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[10px] tracking-[0.25em] text-[--royal-cream]/70 sm:px-4 sm:text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[--royal-emerald]" />
          LIVE GAME
        </div>

        <h2 className="mx-auto mt-5 max-w-4xl text-3xl leading-[1.1] sm:text-4xl md:text-6xl lg:text-7xl">
          <span className="block text-[--royal-cream]">Claim Every Tile.</span>
          <span className="block text-gradient">Rule the Grid.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          A real-time multiplayer arena. Create a room, share a 6-letter code with friends,
          and capture tiles to claim territory. Steal opponents' tiles to grow your empire.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onStart}
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[--royal-gold] via-[--royal-gold-bright] to-[--royal-gold] px-6 py-3.5 text-sm font-semibold tracking-wide text-[--royal-onyx] shadow-[0_10px_40px_-10px_rgba(212,162,83,0.6)] transition active:scale-[0.98] sm:w-auto sm:px-8"
          >
            <Swords className="h-4 w-4" />
            Start Playing
          </button>
          <a
            href="#leaderboard"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-[--royal-gold]/30 bg-transparent px-6 py-3.5 text-sm font-semibold tracking-wide text-[--royal-cream] transition hover:border-[--royal-gold]/60 hover:bg-[--royal-gold]/5 sm:w-auto sm:px-7"
          >
            <Trophy className="h-4 w-4 text-[--royal-gold]" />
            Leaderboard
          </a>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
          {[
            { v: "400", l: "Tiles" },
            { v: "8", l: "Players max" },
            { v: "∞", l: "Captures" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-[--royal-gold]/15 bg-[--royal-onyx]/60 px-3 py-3 sm:px-4 sm:py-4"
            >
              <div className="font-mono text-lg font-bold text-[--royal-gold-bright] sm:text-xl md:text-2xl">
                {s.v}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground sm:text-[10px] sm:tracking-[0.18em]">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
