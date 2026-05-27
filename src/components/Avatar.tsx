import { initials } from "@/lib/profile";

type Props = {
  name: string;
  color: string;
  size?: number;
  className?: string;
};

export function PlayerAvatar({ name, color, size = 40, className = "" }: Props) {
  const text = initials(name);
  // deterministic accent from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const rot = hash % 360;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from ${rot}deg, ${color}, #000 40%, ${color} 70%, #1a1a2e 100%)`,
        boxShadow: `0 0 0 1px ${color}88, 0 0 14px ${color}55`,
        fontSize: size * 0.38,
        letterSpacing: "-0.04em",
      }}
    >
      {/* subtle grid texture */}
      <span
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px)",
          backgroundSize: `${Math.max(6, size / 6)}px ${Math.max(6, size / 6)}px`,
        }}
      />
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{text}</span>
    </div>
  );
}
