# Deployment Guide — SC MIS

**Architecture:** Backend on Railway · Frontend on Netlify

---

## Step 1 — Deploy Backend on Railway

1. Go to **https://railway.app** → log in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select **Pratikgala03/sc-mis**
4. When asked for root directory, type: `backend`
5. Click **Variables** and add:

| Variable | Value |
|---|---|
| `SECRET_KEY` | `mySuperSecretKey2026SureCareApp` |
| `ADMIN_EMAIL` | pratik.gala1@gmail.com |
| `ADMIN_PASSWORD` | Choose a strong password |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `CORS_ORIGINS` | `*` (update after Netlify deploy) |

6. Also click **Add PostgreSQL** when Railway offers it — sets DATABASE_URL automatically
7. Wait for green **Deployed** badge
8. Go to **Settings → Networking → Generate Domain** — copy this URL

---

## Step 2 — Deploy Frontend on Netlify

1. Go to **https://netlify.com** → log in with GitHub
2. Click **Add new site → Import existing project → GitHub**
3. Select **Pratikgala03/sc-mis**
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`
5. **Show advanced → New variable:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Railway URL (no trailing slash) |

6. Click **Deploy site** — wait for green Published

---

## Step 3 — Lock down CORS (optional)

In Railway Variables, change `CORS_ORIGINS` from `*` to your Netlify URL.

---

## Login

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in Railway.
