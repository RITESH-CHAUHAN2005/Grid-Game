import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Swords,
  Plus,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
  Users,
  Crown,
  Loader2,
  Palette,
} from "lucide-react";
import { api, PLAYER_COLORS } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Step = "choose" | "create" | "join";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BattleModal({ open, onClose }: Props) {
  const { user, updateColor } = useAuth();
  const [step, setStep] = useState<Step>("choose");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [color, setColor] = useState<string>(
    user?.preferredColor || PLAYER_COLORS[0],
  );
  const nav = useNavigate();

  useEffect(() => {
    if (open) {
      setStep("choose");
      setCode("");
      setCopied(false);
      setErr(null);
      setColor(user?.preferredColor || PLAYER_COLORS[0]);
    }
  }, [open, user?.preferredColor]);

  const ensureColorSaved = async () => {
    if (color !== user?.preferredColor) {
      try {
        await updateColor(color);
      } catch {}
    }
  };

  const startCreate = async () => {
    setBusy(true);
    setErr(null);
    try {
      await ensureColorSaved();
      const { match } = await api.matches.create();
      setCode(match.code);
      setStep("create");
    } catch (e: any) {
      setErr(e?.message || "Failed to create room");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const enterMatch = (c: string) => {
    onClose();
    nav(`/match/${c}`);
  };

  const onJoin = async () => {
    setBusy(true);
    setErr(null);
    try {
      await ensureColorSaved();
      const { match } = await api.matches.join(code);
      enterMatch(match.code);
    } catch (e: any) {
      setErr(e?.message || "Could not join room");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="ornament-corners relative w-full max-w-lg rounded-t-3xl royal-border p-5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] sm:rounded-3xl sm:p-7"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-[--royal-gold]/10 hover:text-[--royal-gold] sm:right-4 sm:top-4"
            >
              <X className="h-4 w-4" />
            </button>

            {step === "choose" && (
              <>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">
                  Start a game
                </div>
                <h3 className="mt-1 text-xl text-[--royal-cream] sm:text-2xl">Play now</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Create a new room or join a friend's room with their code.
                </p>

                {/* Color picker */}
                <div className="mt-4 rounded-xl border border-[--royal-gold]/15 bg-[--royal-onyx]/50 px-3.5 py-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    <Palette className="h-3 w-3" /> Your color
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
                        style={{ background: c, boxShadow: `0 0 8px ${c}55` }}
                        aria-label={`Pick color ${c}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Option
                    onClick={startCreate}
                    icon={busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                    title="Create room"
                    desc="Start a new room and get a 6-letter code."
                    accent="--royal-gold"
                    disabled={busy}
                  />
                  <Option
                    onClick={() => setStep("join")}
                    icon={<KeyRound className="h-5 w-5" />}
                    title="Join with code"
                    desc="Enter a friend's code to join their room."
                    accent="--royal-emerald"
                  />
                </div>

                {err && (
                  <div className="mt-4 rounded-xl border border-[--royal-crimson]/40 bg-[--royal-crimson]/10 px-3 py-2 text-xs text-[--royal-crimson-bright]">
                    {err}
                  </div>
                )}
              </>
            )}

            {step === "create" && (
              <>
                <BackBar onBack={() => setStep("choose")} />
                <div className="text-[10px] uppercase tracking-[0.3em] text-[--royal-gold]">
                  Room created
                </div>
                <h3 className="mt-1 text-xl text-[--royal-cream] sm:text-2xl">Share your code</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Send this code to friends so they can join your room.
                </p>

                <div className="mt-5 rounded-2xl border border-[--royal-gold]/40 bg-gradient-to-br from-[--royal-gold]/10 to-[--royal-emerald]/5 p-5 text-center">
                  <div className="font-mono text-3xl font-bold tracking-[0.3em] text-[--royal-gold-bright] sm:text-5xl sm:tracking-[0.4em]">
                    {code}
                  </div>
                  <button
                    onClick={copyCode}
                    className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-[--royal-gold]/30 bg-[--royal-onyx]/60 px-3 py-1.5 text-xs text-[--royal-cream] transition hover:border-[--royal-gold]/60"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-[--royal-emerald-bright]" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy code"}
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-[--royal-gold]/15 bg-[--royal-onyx]/60 px-4 py-2.5 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> Room
                  </span>
                  <span className="font-mono text-[--royal-cream]">You're the host - share to invite</span>
                </div>

                <button
                  onClick={() => enterMatch(code)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[--royal-gold] via-[--royal-gold-bright] to-[--royal-gold] py-3.5 text-sm font-bold uppercase tracking-wider text-[--royal-onyx] shadow-[0_10px_40px_-10px_rgba(212,162,83,0.6)] transition active:scale-[0.98]"
                >
                  <Swords className="h-4 w-4" />
                  Enter room
                </button>
              </>
            )}

            {step === "join" && (
              <>
                <BackBar onBack={() => setStep("choose")} />
                <div className="text-[10px] uppercase tracking-[0.3em] text-[--royal-emerald-bright]">
                  Join room
                </div>
                <h3 className="mt-1 text-xl text-[--royal-cream] sm:text-2xl">Enter the code</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  6 letters - your friend gave you one.
                </p>

                <div className="mt-5">
                  <input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                    }
                    placeholder="ABC123"
                    inputMode="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="w-full rounded-xl border border-[--royal-gold]/20 bg-[--royal-onyx]/70 px-4 py-4 text-center font-mono text-xl tracking-[0.4em] text-[--royal-gold-bright] outline-none transition focus:border-[--royal-gold]/60 focus:ring-2 focus:ring-[--royal-gold]/20 sm:text-2xl sm:tracking-[0.5em]"
                  />
                  <p className="mt-2 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    6-letter code
                  </p>
                </div>

                {err && (
                  <div className="mt-4 rounded-xl border border-[--royal-crimson]/40 bg-[--royal-crimson]/10 px-3 py-2 text-xs text-[--royal-crimson-bright]">
                    {err}
                  </div>
                )}

                <button
                  disabled={code.length !== 6 || busy}
                  onClick={onJoin}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[--royal-emerald] via-[--royal-emerald-bright] to-[--royal-emerald] py-3.5 text-sm font-bold uppercase tracking-wider text-[--royal-onyx] shadow-[0_10px_40px_-10px_rgba(16,182,122,0.6)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
                  {busy ? "Joining..." : "Join room"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="mb-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-[--royal-gold]"
    >
      <ArrowLeft className="h-3 w-3" /> Back
    </button>
  );
}

function Option({
  onClick,
  icon,
  title,
  desc,
  accent,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden rounded-2xl border bg-[--royal-onyx]/60 p-4 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ borderColor: `var(${accent})33` }}
    >
      <div
        className="relative mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `var(${accent})12`,
          color: `var(${accent})`,
          boxShadow: `inset 0 0 0 1px var(${accent})55`,
        }}
      >
        {icon}
      </div>
      <div className="relative font-semibold text-[--royal-cream]">{title}</div>
      <div className="relative mt-1 text-[11px] leading-relaxed text-muted-foreground">{desc}</div>
    </button>
  );
}
