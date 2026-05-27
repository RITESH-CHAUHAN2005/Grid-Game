const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createUser, findByEmail, findById, toPublicUser, updatePreferredColor } = require("../models/userModel");
const { signToken } = require("../utils/jwt");
const { Session } = require("../models/sessionModel");
const { ActivityLog } = require("../models/activityLogModel");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password are required" });
    }
    if (typeof name !== "string" || name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Invalid name" });
    }
    if (!EMAIL_RE.test(email) || email.length > 255) {
      return res.status(400).json({ error: "Invalid email" });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: "Password must be 8-200 characters" });
    }

    const existing = await findByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, passwordHash });

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    await ActivityLog.create({
      userId: user.id,
      action: "signup",
      meta: { ip: req.ip },
    });

    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    await Session.create({
      userId: user._id,
      token,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
    });
    await ActivityLog.create({
      userId: user._id,
      action: "login",
      meta: { ip: req.ip },
    });

    res.json({ user: toPublicUser(user), token });
  } catch (e) {
    next(e);
  }
}

async function guest(req, res, next) {
  try {
    const { name, color } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      return res.status(400).json({ error: "Name must be 2-30 characters" });
    }
    const preferredColor =
      color && typeof color === "string" && COLOR_RE.test(color) ? color : null;

    const randomId = crypto.randomBytes(6).toString("hex");
    const email = `guest_${randomId}@guest.local`;
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 8);

    const user = await createUser({
      name: trimmedName,
      email,
      passwordHash,
      role: "guest",
      preferredColor,
      isGuest: true,
    });

    const token = signToken({ id: user.id, role: user.role, email: user.email });

    await ActivityLog.create({
      userId: user.id,
      action: "guest_signup",
      meta: { ip: req.ip },
    });

    res.status(201).json({ user, token });
  } catch (e) {
    next(e);
  }
}

async function me(req, res, next) {
  try {
    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (e) {
    next(e);
  }
}

async function updateColor(req, res, next) {
  try {
    const { color } = req.body || {};
    if (!color || !COLOR_RE.test(color)) {
      return res.status(400).json({ error: "Invalid color" });
    }
    await updatePreferredColor(req.user.id, color);
    const user = await findById(req.user.id);
    res.json({ user });
  } catch (e) {
    next(e);
  }
}

async function logout(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
      await Session.deleteOne({ token });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { signup, login, guest, me, updateColor, logout };
