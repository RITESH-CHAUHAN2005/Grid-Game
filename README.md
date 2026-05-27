# Grid Dominion

Grid Dominion is a full-stack grid-based multiplayer strategy game (MERN + WebSockets). This repository contains the client built with Vite + React + TypeScript and a Node/Express server for matchmaking and game sockets.

## Structure

- `src/` — Frontend (React + TypeScript)
- `server/` — Backend (Node/Express, socket handling, controllers, models)
- `public/` — Static assets

# Grid Dominion

Grid Dominion is a full-stack, grid-based multiplayer strategy game focused on territorial conquest and short competitive matches. Players place and move units on a grid to capture cells, fight opponents, and climb the leaderboard.

Live demo: https://orangered-spider-610325.hostingersite.com/

**What this repo contains**
- `src/` — Frontend (Vite + React + TypeScript)
- `server/` — Backend (Node + Express) with socket handlers, controllers, and models
- `public/` — Static assets used by the client

**Key features (implemented)**
- Real-time multiplayer gameplay using WebSockets (socket handlers in `server/socket`)
- Matchmaking and session management (`server/controllers` + `server/models`)
- Basic leaderboard and activity logging
- Authentication scaffolding and session model
- Responsive UI components and utilities in `src/components` and `src/lib`

**Planned / Partial features**
- AI opponents (not implemented)
- Advanced persistence/analytics (basic models exist; extend as needed)
- Mobile-specific UX polish and additional game modes

**Architecture & tech stack**
- Frontend: Vite, React, TypeScript
- Backend: Node.js, Express, WebSockets
- Database: MongoDB (see `server/config/db.js`) — configure your connection string in environment variables

**Run locally (development)**
1. Install root deps and backend deps:

```bash
npm install
cd server
npm install
```

2. Start frontend and backend (two terminals):

```bash
# terminal 1 (frontend)
npm run dev

# terminal 2 (backend)
cd server
npm start
```
Made by Ritesh
