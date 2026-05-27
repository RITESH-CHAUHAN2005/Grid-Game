// Frontend API client for the custom Node.js backend.
// Set VITE_API_URL in your env (defaults to http://localhost:5000).
export const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "gd_token_v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`);
  return data as T;
}

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  preferredColor?: string | null;
  isGuest?: boolean;
  created_at: string;
};

export const PLAYER_COLORS = [
  "#a855f7", // purple
  "#22d3ee", // cyan
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ef4444", // red
  "#8b5cf6", // violet
];

export type MatchPlayer = {
  userId: string;
  name: string;
  color: string;
  online: boolean;
  tiles: number;
};

export type MatchTile = {
  ownerId: string | null;
  color: string | null;
};

export type Match = {
  id: string;
  code: string;
  hostId: string;
  status: "lobby" | "active" | "ended";
  gridSize: number;
  captures: number;
  players: MatchPlayer[];
  grid: MatchTile[];
  createdAt: string;
  endedAt: string | null;
};

export type ActivityItem = {
  id: string;
  action: string;
  meta: Record<string, any>;
  createdAt: string;
  user?: { id: string; name: string } | null;
};

export const api = {
  signup: (body: { name: string; email: string; password: string }) =>
    request<{ user: ApiUser; token: string }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ user: ApiUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  guest: (body: { name: string; color?: string }) =>
    request<{ user: ApiUser; token: string }>("/api/auth/guest", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<{ user: ApiUser }>("/api/auth/me"),
  updateColor: (color: string) =>
    request<{ user: ApiUser }>("/api/auth/color", {
      method: "POST",
      body: JSON.stringify({ color }),
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  matches: {
    create: () => request<{ match: Match }>("/api/matches", { method: "POST" }),
    get: (code: string) => request<{ match: Match }>(`/api/matches/${code}`),
    join: (code: string) =>
      request<{ match: Match; rejoined: boolean }>(`/api/matches/${code}/join`, {
        method: "POST",
      }),
    leave: (code: string) =>
      request<{ ok: true }>(`/api/matches/${code}/leave`, { method: "POST" }),
    mine: () =>
      request<{ matches: Array<{ id: string; code: string; status: string; playerCount: number; captures: number; createdAt: string }> }>(
        "/api/matches/mine",
      ),
  },

  activity: {
    me: (limit = 50) =>
      request<{ activity: ActivityItem[] }>(`/api/activity/me?limit=${limit}`),
    feed: (limit = 20) =>
      request<{ activity: ActivityItem[] }>(`/api/activity/feed?limit=${limit}`),
  },
};
