export type Player = {
  id: string;
  name: string;
  color: string; // hex
  tiles: number;
};

export const PLAYER_COLORS = [
  "#a855f7", // purple
  "#22d3ee", // cyan
  "#3b82f6", // blue
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
];

export const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "NeonReaper", color: "#a855f7", tiles: 412 },
  { id: "p2", name: "CyberFox", color: "#22d3ee", tiles: 367 },
  { id: "p3", name: "VoidQueen", color: "#ec4899", tiles: 298 },
  { id: "p4", name: "Pixelord", color: "#3b82f6", tiles: 241 },
  { id: "p5", name: "GlitchKing", color: "#10b981", tiles: 188 },
  { id: "p6", name: "Hexbyte", color: "#f59e0b", tiles: 142 },
  { id: "p7", name: "ZeroCool", color: "#8b5cf6", tiles: 97 },
  { id: "p8", name: "Nullify", color: "#ef4444", tiles: 64 },
];

export const MOCK_FEED = [
  { id: 1, player: "NeonReaper", color: "#a855f7", action: "captured 4 tiles in Sector 7" },
  { id: 2, player: "CyberFox", color: "#22d3ee", action: "overtook VoidQueen's stronghold" },
  { id: 3, player: "GlitchKing", color: "#10b981", action: "started a chain reaction" },
  { id: 4, player: "Pixelord", color: "#3b82f6", action: "captured a locked relic tile" },
  { id: 5, player: "Hexbyte", color: "#f59e0b", action: "joined the battlefield" },
  { id: 6, player: "VoidQueen", color: "#ec4899", action: "reclaimed 12 tiles" },
  { id: 7, player: "ZeroCool", color: "#8b5cf6", action: "broke a defense line" },
  { id: 8, player: "Nullify", color: "#ef4444", action: "captured an edge zone" },
];

export const GRID_SIZE = 40;

export type TileState = {
  ownerId: string | null;
  locked?: boolean;
};

// Pre-seed the grid: ~35% claimed, sprinkle locked tiles
export function buildInitialGrid(): TileState[] {
  const total = GRID_SIZE * GRID_SIZE;
  const grid: TileState[] = [];
  // deterministic-ish PRNG so SSR/CSR match
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < total; i++) {
    const r = rand();
    if (r < 0.04) grid.push({ ownerId: null, locked: true });
    else if (r < 0.4) {
      const p = MOCK_PLAYERS[Math.floor(rand() * MOCK_PLAYERS.length)];
      grid.push({ ownerId: p.id });
    } else grid.push({ ownerId: null });
  }
  return grid;
}
