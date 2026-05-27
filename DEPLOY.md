# Grid Dominion — Deploy Guide

Three pieces, three places:

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Hostinger      │─────▶│  Render.com      │─────▶│ MongoDB      │
│  (frontend)     │ HTTPS│  (backend API +  │ TLS  │ Atlas        │
│  static dist/   │      │  Socket.IO)      │      │ (DB)         │
└─────────────────┘      └──────────────────┘      └──────────────┘
```

You'll do these in order:

1. [Push code to GitHub](#1-push-code-to-github)
2. [Whitelist all IPs on MongoDB Atlas](#2-whitelist-all-ips-on-mongodb-atlas)
3. [Deploy backend on Render](#3-deploy-backend-on-render)
4. [Build frontend with the Render URL](#4-build-frontend-pointed-at-render)
5. [Upload `dist/` to Hostinger](#5-upload-dist-to-hostinger)
6. [Lock CORS on Render to your Hostinger URL](#6-lock-cors-on-render-to-your-hostinger-url)
7. [Test the full flow](#7-test-end-to-end)

---

## 1. Push code to GitHub

If you don't have a repo yet, I will git-init locally and you push to a fresh GitHub repo.

**Your steps:**

1. Go to https://github.com/new → create empty repo named `grid-dominion`. **Do not** add README / .gitignore / license (we already have them).
2. Copy the SSH or HTTPS URL GitHub shows (e.g. `https://github.com/yourname/grid-dominion.git`).
3. Back in this folder, run:

```bash
git remote add origin https://github.com/<yourname>/grid-dominion.git
git branch -M main
git push -u origin main
```

> If `git push` asks for a password, use a [Personal Access Token](https://github.com/settings/tokens) (classic, `repo` scope) instead of your account password.

---

## 2. Whitelist all IPs on MongoDB Atlas

Render's outbound IPs rotate, so a single-IP whitelist won't work.

**Your steps:**

1. Open https://cloud.mongodb.com → your project → **Network Access** (left sidebar).
2. Click **+ ADD IP ADDRESS** → **ALLOW ACCESS FROM ANYWHERE** (`0.0.0.0/0`) → **Confirm**.
3. Wait ~1 minute for it to go active (green dot).

> Security note: this is fine because Mongo still needs the DB user + password. The connection string already has them.

---

## 3. Deploy backend on Render

Render reads `render.yaml` at the repo root and provisions everything in one click.

**Your steps:**

1. Sign up / log in: https://render.com (use GitHub login — easiest).
2. Top right **New +** → **Blueprint**.
3. Connect your `grid-dominion` GitHub repo.
4. Render detects `render.yaml`. It will show one service: `grid-dominion-api`.
5. Before clicking **Apply**, it'll ask you to fill three secrets in the dashboard:

| Key            | Value                                                                                              |
|----------------|----------------------------------------------------------------------------------------------------|
| `MONGODB_URI`  | Paste from Atlas → Connect → Drivers → "mongodb+srv://…" (replace `<password>` with the real one) |
| `JWT_SECRET`   | A long random string — generate one (see below)                                                    |
| `CORS_ORIGIN`  | For now set to `*` (we'll tighten in step 6 once Hostinger URL is known)                          |

**Generate a JWT secret** (any of these works — pick one):

```bash
# Local terminal:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Or use https://generate-secret.vercel.app/64 in browser.

6. Click **Apply**. Render will build (~3 min) and deploy.
7. When status is green ✅, copy your backend URL — something like:
   ```
   https://grid-dominion-api.onrender.com
   ```
8. Verify it works:
   ```
   https://grid-dominion-api.onrender.com/health
   → {"ok":true,"service":"grid-dominion-api"}
   ```

> **Free tier quirk**: After 15 min of no traffic the service sleeps. First request after sleep takes ~30 sec to wake. Upgrade to **Starter** ($7/mo) to kill sleep.

---

## 4. Build frontend pointed at Render

Now we bake the Render URL into the frontend bundle.

**Your steps (run on your local PC):**

```bash
# From the project root
echo "VITE_API_URL=https://grid-dominion-api.onrender.com" > .env.production
npm run build
```

> Replace the URL with the one Render actually gave you in step 3.

This creates a fresh `dist/` folder. Inside it:
```
dist/
├── index.html
├── .htaccess           ← Hostinger uses this for routing + caching + HTTPS
├── assets/
│   ├── index-<hash>.js
│   └── index-<hash>.css
└── favicon.png
```

**Verify** the API URL is baked in:
```bash
grep -o "onrender.com" dist/assets/index-*.js | head -1
# should print: onrender.com
```

---

## 5. Upload `dist/` to Hostinger

Two ways — pick whichever you're comfortable with.

### Option A — Hostinger File Manager (easiest, no software needed)

1. Log in to Hostinger → **Hosting** → your domain → **File Manager**.
2. Go to `public_html/` folder.
3. **Delete** the default `index.html` / `default.html` that's already there.
4. Click **Upload** → **Files** → select **everything inside `dist/`** (not the folder itself — its contents). Make sure `.htaccess` is included (enable "show hidden files" if needed).
5. Wait for upload to finish.
6. Open your domain in browser. You should see the Grid Dominion login.

### Option B — FTP (if you upload often)

1. Hostinger → **Hosting** → **Advanced → FTP Accounts**. Note the host, username, password.
2. Use FileZilla / WinSCP / `lftp`. Connect, navigate to `public_html`.
3. Drag everything from local `dist/` into remote `public_html/`. Overwrite when prompted.

### Verify it loads

- Open `https://yourdomain.com` — should show the auth page (royal seal + login form).
- Open browser DevTools → Network tab → refresh → check the JS bundle loads OK.
- Try logging in. The Network tab should show requests to `https://grid-dominion-api.onrender.com/api/auth/...`. If first request is slow (~30s), Render woke from sleep — second click will be instant.

> If you reload to a non-root URL (e.g. `/match/ABCDEF`) and get a 404, the `.htaccess` didn't upload. Check `public_html/.htaccess` exists.

---

## 6. Lock CORS on Render to your Hostinger URL

Right now backend allows any origin (`*`). Once you confirm the site works, tighten this.

**Your steps:**

1. Render dashboard → `grid-dominion-api` → **Environment** tab.
2. Edit `CORS_ORIGIN` → set to your exact Hostinger URL (no trailing slash):
   ```
   https://yourdomain.com,https://www.yourdomain.com
   ```
3. **Save Changes** — Render will auto-redeploy (~30s).

> If you have both `yourdomain.com` and `www.yourdomain.com`, list both. Use commas.

---

## 7. Test end to end

Open `https://yourdomain.com` in two different browsers (or one regular + one incognito) so you have two accounts.

- [ ] Sign up in browser A.
- [ ] Sign up in browser B.
- [ ] Browser A: **Start Battle** → **Summon chamber** → copy the 6-letter sigil.
- [ ] Browser B: **Start Battle** → **Enter with sigil** → paste the code.
- [ ] Both should land in the same Royal Board.
- [ ] Click tiles in browser A — they should appear in browser B within ~100ms.
- [ ] Click an opponent's tile to steal it. Counts should update on both sides.
- [ ] Refresh the page — match state should persist.
- [ ] Disconnect/reconnect WiFi — you should see "Reconnecting" then "Live" again.

If all ✅, you're live.

---

## Updating after first deploy

### Backend code change
```bash
git add . && git commit -m "your message" && git push
```
Render auto-redeploys (autoDeploy is on in `render.yaml`).

### Frontend code change
```bash
npm run build
# Re-upload everything inside dist/ to public_html/ (overwrite)
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login spins forever, then "Failed to fetch" | Backend asleep on Render free tier | Wait 30 sec, retry. Or upgrade to Starter |
| `ERR_CONNECTION_REFUSED` to onrender.com | Wrong URL baked in dist | Rebuild with correct `VITE_API_URL`, re-upload |
| `CORS error` in browser console | `CORS_ORIGIN` doesn't include your domain | Add it in Render dashboard, save |
| `MongoServerSelectionError` in Render logs | Atlas IP whitelist missing 0.0.0.0/0 | Re-do step 2 |
| Login works, but board is empty / capture fails | Socket.IO blocked | Check Hostinger doesn't block WSS (rare); check browser console |
| Refresh on `/match/XYZ123` shows 404 | `.htaccess` missing in public_html | Re-upload it (enable "show hidden files" in File Manager) |
| Get "Match not found" on join | Different MongoDB databases per env | Make sure all env vars on Render point to the same Atlas DB |

---

## Files in this repo that drive deployment

| File | Purpose |
|---|---|
| `render.yaml` | Render Blueprint — defines the backend service |
| `public/.htaccess` | Hostinger routing/caching/HTTPS rules (auto-copied to `dist/`) |
| `.env.example` | Frontend env template |
| `server/.env.example` | Backend env template |
| `.gitignore` | Excludes `dist/`, `node_modules/`, env files from git |

---

## Costs

| Service | Free tier | Paid (if you outgrow) |
|---|---|---|
| Hostinger | Already paid (your existing plan) | — |
| Render backend | Free w/ sleep, 750h/month | $7/mo Starter (no sleep) |
| MongoDB Atlas | 512 MB free (M0) | $9/mo M2 (2 GB) |
| GitHub | Free unlimited public+private | — |

So **₹0 extra** until traffic grows. Total upgrade later is ~$7-16/mo.
