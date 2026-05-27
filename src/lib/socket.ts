import { io, Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = getToken();
  socket = io(API_BASE, {
    auth: { token: token || undefined },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 800,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function refreshSocketAuth() {
  // Used after login/logout — drop the old socket so a fresh one connects with the new token.
  disconnectSocket();
}

export type TileUpdate = {
  idx: number;
  ownerId: string;
  ownerName: string;
  color: string;
  stoleFrom: string | null;
  tileCounts: Array<{ userId: string; tiles: number }>;
};
