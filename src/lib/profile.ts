import { PLAYER_COLORS } from "./mock";

export type Profile = {
  id: string;
  name: string;
  color: string;
  tier: string;
  tiles: number;
  wins: number;
  matches: number;
  joinedAt: number;
};

const KEY = "gd_profile_v1";

function randomName() {
  const adj = ["Neon", "Void", "Cyber", "Glitch", "Pixel", "Hex", "Zero", "Null", "Quantum", "Shadow"];
  const noun = ["Reaper", "Fox", "Queen", "Lord", "King", "Byte", "Cool", "Wolf", "Knight", "Phantom"];
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}`;
}

// SSR-safe placeholder — deterministic so first client render matches server.
export function placeholderProfile(): Profile {
  return {
    id: "me",
    name: "Commander",
    color: PLAYER_COLORS[0],
    tier: "Recruit",
    tiles: 0,
    wins: 0,
    matches: 0,
    joinedAt: 0,
  };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return placeholderProfile();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const p: Profile = {
    id: "me",
    name: randomName(),
    color: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
    tier: "Recruit",
    tiles: 0,
    wins: 0,
    matches: 0,
    joinedAt: Date.now(),
  };
  saveProfile(p);
  return p;
}

export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function initials(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  if (!cleaned) return "??";
  const parts = cleaned.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

export function tierFor(tiles: number) {
  if (tiles > 500) return "Warlord";
  if (tiles > 250) return "Commander";
  if (tiles > 100) return "Captain";
  if (tiles > 25) return "Operative";
  return "Recruit";
}
