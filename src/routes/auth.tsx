import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Mail, KeyRound, User2, ArrowRight, Swords, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PLAYER_COLORS } from "@/lib/api";

type Mode = "guest" | "login" | "signup";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("guest");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState<string>(PLAYER_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { login, signup, guestLogin } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "guest") {
        if (name.trim().length < 2) throw new Error("Name must be at least 2 characters");
        await guestLogin(name.trim(), color);
      } else if (mode === "signup") {
        if (name.trim().length < 2) throw new Error("Name must be at least 2 characters");
        await signup(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[--royal-gold]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-[--royal-emerald]/6 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          {/* Left intro — hidden on mobile */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-[--royal-gold]/40 bg-[--royal-gold]/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">
              <Crown className="h-3 w-3" />
              Grid Dominion
            </div>
            <h1 className="mt-5 text-5xl leading-[1.05] text-[--royal-cream]">
              Capture tiles. <span className="text-gradient">Rule the grid.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A real-time multiplayer game. Create a room, share the code, and
              capture tiles to claim territory. Steal opponents' tiles to grow your empire.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                { i: <Crown className="h-4 w-4 text-[--royal-gold]" />, t: "Live multiplayer rooms" },
                { i: <Swords className="h-4 w-4 text-[--royal-emerald]" />, t: "Tap a tile to capture it" },
                { i: <Sparkles className="h-4 w-4 text-[--royal-gold]" />, t: "Pick your color and play instantly" },
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--royal-gold]/20 bg-[--royal-onyx]/60">
                    {f.i}
                  </span>
                  {f.t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right card */}
          <div className="w-full">
            <div className="relative rounded-3xl royal-border p-5 sm:p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              {/* Mobile-only logo */}
              <div className="mb-4 flex items-center gap-2 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[--royal-gold]/40 bg-[--royal-gold]/10">
                  <Crown className="h-5 w-5 text-[--royal-gold]" />
                </div>
                <h1 className="text-xl text-gradient">Grid Dominion</h1>
              </div>

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">
                    {mode === "guest" ? "Quick play" : mode === "signup" ? "Create account" : "Welcome back"}
                  </div>
                  <h2 className="mt-1 text-xl sm:text-2xl text-[--royal-cream]">
                    {mode === "guest" ? "Play as guest" : mode === "signup" ? "Sign up" : "Log in"}
                  </h2>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="mb-5 grid grid-cols-3 gap-1 rounded-full border border-[--royal-gold]/20 bg-[--royal-onyx]/80 p-1 text-[11px] font-semibold">
                {(["guest", "login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setErr(null);
                    }}
                    className={`rounded-full py-1.5 transition ${
                      mode === m
                        ? "bg-[--royal-gold]/15 text-[--royal-gold]"
                        : "text-muted-foreground hover:text-[--royal-cream]"
                    }`}
                  >
                    {m === "guest" ? "Guest" : m === "login" ? "Log in" : "Sign up"}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="space-y-3">
                {(mode === "guest" || mode === "signup") && (
                  <Field
                    icon={<User2 className="h-4 w-4" />}
                    placeholder={mode === "guest" ? "Your name" : "Display name"}
                    value={name}
                    onChange={setName}
                    type="text"
                    autoComplete="name"
                  />
                )}

                {mode !== "guest" && (
                  <>
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      placeholder="Email"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      autoComplete="email"
                    />
                    <Field
                      icon={<KeyRound className="h-4 w-4" />}
                      placeholder={mode === "signup" ? "Password (min 8 chars)" : "Password"}
                      value={password}
                      onChange={setPassword}
                      type="password"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                  </>
                )}

                {/* Color picker - only for guest mode (signup users pick later) */}
                {mode === "guest" && (
                  <div className="rounded-xl border border-[--royal-gold]/15 bg-[--royal-onyx]/50 px-3.5 py-3">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Choose your color
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PLAYER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`h-8 w-8 rounded-lg transition ${
                            color === c
                              ? "scale-110 ring-2 ring-[--royal-gold]"
                              : "ring-1 ring-white/10 hover:scale-105"
                          }`}
                          style={{ background: c, boxShadow: `0 0 10px ${c}66` }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {err && (
                  <div className="rounded-xl border border-[--royal-crimson]/40 bg-[--royal-crimson]/10 px-3 py-2 text-xs text-[--royal-crimson-bright]">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[--royal-gold] via-[--royal-gold-bright] to-[--royal-gold] py-3.5 text-sm font-bold text-[--royal-onyx] shadow-[0_8px_30px_-8px_rgba(212,162,83,0.6)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy
                    ? "Loading..."
                    : mode === "guest"
                      ? "Start playing"
                      : mode === "signup"
                        ? "Create account"
                        : "Log in"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </form>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                {mode === "guest"
                  ? "No signup needed - just pick a name and play!"
                  : mode === "signup"
                    ? "Already have an account? "
                    : "New here? "}
                {mode !== "guest" && (
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                    className="font-semibold text-[--royal-gold] hover:underline"
                  >
                    {mode === "signup" ? "Log in" : "Sign up"}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  type,
  autoComplete,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete?: string;
}) {
  return (
    <label className="group flex items-center gap-3 rounded-xl border border-[--royal-gold]/15 bg-[--royal-onyx]/70 px-3.5 py-3 text-sm transition focus-within:border-[--royal-gold]/60 focus-within:ring-2 focus-within:ring-[--royal-gold]/20">
      <span className="text-muted-foreground group-focus-within:text-[--royal-gold]">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full bg-transparent text-[--royal-cream] outline-none placeholder:text-muted-foreground/60"
      />
    </label>
  );
}
