// Grid Dominion — Custom Node.js + Express + MongoDB backend
require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const matchRoutes = require("./routes/matchRoutes");
const activityRoutes = require("./routes/activityRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const { attachSocket } = require("./socket/gameSocket");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim());

// Security
app.use(helmet());
app.use(
  cors({
    origin: CORS_ORIGINS.includes("*") ? true : CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// Rate limiting (auth endpoints stricter)
app.use(
  "/api/",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }),
);
app.use(
  "/api/auth/",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }),
);

// Health
app.get("/health", (_req, res) => res.json({ ok: true, service: "grid-dominion-api" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/activity", activityRoutes);

// 404 + error
app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
attachSocket(httpServer, CORS_ORIGINS.includes("*") ? true : CORS_ORIGINS);

async function start() {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Grid Dominion API listening on http://localhost:${PORT}`);
      console.log(`   Socket.IO live · CORS: ${CORS_ORIGINS.join(", ")}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
