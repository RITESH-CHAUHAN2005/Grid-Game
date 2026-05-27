import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Crown, ScrollText, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { disconnectSocket } from "@/lib/socket";

type Props = {
  onStart: () => void;
};

export function Navbar({ onStart }: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    disconnectSocket();
    nav("/auth", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[--royal-gold]/15 bg-[--royal-onyx]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[--royal-gold]/40 bg-gradient-to-br from-[--royal-gold]/25 to-[--royal-emerald]/15 sm:h-11 sm:w-11">
            <Crown className="h-5 w-5 text-[--royal-gold]" />
          </div>
          <div>
            <h1 className="text-base leading-none text-gradient sm:text-lg">Grid Dominion</h1>
            <p className="hidden text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block">
              Real-time tile game
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <a href="#leaderboard" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-[--royal-gold]">
            Leaderboard
          </a>
          <Link to="/activity" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-[--royal-gold]">
            Activity
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={onStart}
            className="rounded-full bg-gradient-to-r from-[--royal-gold] via-[--royal-gold-bright] to-[--royal-gold] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[--royal-onyx] shadow-[0_8px_30px_-8px_rgba(212,162,83,0.5)] transition active:scale-[0.98] sm:px-5"
          >
            Start Game
          </button>
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-[--royal-gold]/20 bg-[--royal-onyx]/80 px-2.5 py-1.5 text-xs transition hover:border-[--royal-gold]/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[--royal-gold] to-[--royal-emerald] text-[10px] font-bold text-[--royal-onyx]">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden font-medium text-[--royal-cream] md:block">{user.name}</span>
                {user.isGuest && (
                  <span className="rounded-full bg-[--royal-gold]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[--royal-gold]">
                    Guest
                  </span>
                )}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl royal-border p-1 shadow-2xl">
                  <div className="border-b border-[--royal-gold]/15 px-3 py-2.5 text-[11px]">
                    <div className="font-semibold text-[--royal-cream]">{user.name}</div>
                    <div className="truncate text-muted-foreground">
                      {user.isGuest ? "Guest player" : user.email}
                    </div>
                  </div>
                  <Link
                    to="/activity"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[--royal-cream] transition hover:bg-[--royal-gold]/10"
                  >
                    <ScrollText className="h-3.5 w-3.5 text-[--royal-gold]" /> Activity
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[--royal-crimson-bright] transition hover:bg-[--royal-crimson]/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="rounded-md p-1.5 text-[--royal-cream] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[--royal-gold]/15 md:hidden">
          <div className="flex flex-col gap-3 px-4 py-4">
            {user && (
              <div className="flex items-center gap-2 rounded-xl border border-[--royal-gold]/20 bg-[--royal-onyx]/70 px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[--royal-gold] to-[--royal-emerald] text-xs font-bold text-[--royal-onyx]">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[--royal-cream]">{user.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {user.isGuest ? "Guest player" : user.email}
                  </div>
                </div>
              </div>
            )}
            <a
              href="#leaderboard"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-[--royal-gold]/10"
            >
              Leaderboard
            </a>
            <Link
              to="/activity"
              className="rounded-lg px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:bg-[--royal-gold]/10"
              onClick={() => setOpen(false)}
            >
              Activity
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                onStart();
              }}
              className="rounded-full bg-gradient-to-r from-[--royal-gold] to-[--royal-gold-bright] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[--royal-onyx]"
            >
              Start Game
            </button>
            {user && (
              <button
                onClick={handleLogout}
                className="rounded-full border border-[--royal-crimson]/40 px-4 py-2.5 text-xs uppercase tracking-wider text-[--royal-crimson-bright]"
              >
                <LogOut className="mr-1 inline h-3.5 w-3.5" /> Log out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
