// One-off smoke test for the optimized tile:capture path.
// Usage: node server/smoke-capture.js
// Spawns a throwaway user, creates a match, captures 5 tiles via socket, prints timings.
const { io } = require("socket.io-client");

const API = "http://localhost:5000";

async function post(path, body, token) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${path} -> ${r.status} ${JSON.stringify(j)}`);
  return j;
}

(async () => {
  const tag = Date.now().toString(36);
  const email = `smoke_${tag}@test.local`;
  const password = "smoketest123";

  console.log("→ signup");
  const su = await post("/api/auth/signup", { name: `Smoke ${tag}`, email, password });
  const token = su.token;

  console.log("→ create match");
  const cm = await post("/api/matches", null, token);
  const code = cm.match.code;
  console.log("   code:", code);

  console.log("→ socket connect");
  const sock = io(API, {
    auth: { token },
    transports: ["websocket"],
  });

  await new Promise((res, rej) => {
    sock.once("connect", res);
    sock.once("connect_error", rej);
  });
  console.log("   connected:", sock.id);

  await new Promise((res, rej) => {
    sock.emit("match:join", { code }, (r) => (r?.error ? rej(new Error(r.error)) : res(r)));
  });
  console.log("   joined room");

  const updates = [];
  sock.on("tile:updated", (p) => updates.push({ idx: p.idx, t: performance.now() }));

  const captures = 8;
  const timings = [];
  for (let i = 0; i < captures; i++) {
    const idx = i * 13 + 5;
    const t0 = performance.now();
    await new Promise((res, rej) => {
      sock.emit("tile:capture", { code, idx }, (r) =>
        r?.error ? rej(new Error(r.error)) : res(r),
      );
    });
    timings.push(performance.now() - t0);
  }

  // Wait briefly for broadcasts to arrive
  await new Promise((r) => setTimeout(r, 250));

  console.log(`→ ${captures} captures done`);
  console.log("   ack timings ms:", timings.map((t) => t.toFixed(1)));
  const avg = timings.reduce((s, v) => s + v, 0) / timings.length;
  console.log(`   avg ack: ${avg.toFixed(1)}ms · broadcasts received: ${updates.length}`);

  sock.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error("SMOKE FAIL:", e);
  process.exit(1);
});
