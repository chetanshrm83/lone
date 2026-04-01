# 🌐 FinGuardian AI — Deploy from Browser Only
## No local machine / no terminal needed!

---

## THE PLAN
```
Your Browser
    ↓ Upload ZIP
GitHub (free)
    ↓ Codespaces (cloud terminal)
    ├── Neon DB ← prisma db push (auto)
    ├── Vercel  ← vercel --prod (auto)
    └── Railway ← connect via dashboard
```

---

## STEP 1 — Create GitHub Repository (2 minutes)

1. Open: **https://github.com/new**
2. Fill in:
   - Name: `finguardian-ai`
   - Visibility: **Private**
   - ✅ Check **"Add a README file"** (important!)
3. Click **Create repository**

---

## STEP 2 — Upload Your Code (3 minutes)

On your new empty repo page:

1. Click **"+"** button → **"Upload files"**
2. On your computer: **right-click the zip → Extract All** (built into Windows, no software needed)
3. Open the extracted `finguardian` folder
4. Select ALL files inside it (Ctrl+A)
5. Drag them into the GitHub upload page
6. Scroll down → Commit message: `FinGuardian AI initial build`
7. Click **"Commit changes"**

> 💡 Tip: GitHub may warn about large uploads — just wait, it works.

---

## STEP 3 — Open GitHub Codespaces (Cloud Terminal)

1. In your repo, click the green **"<> Code"** button
2. Click **"Codespaces"** tab
3. Click **"Create codespace on main"**
4. Wait ~2 minutes for the cloud environment to load
5. You now have a **full VS Code + terminal in your browser!**

---

## STEP 4 — Run the Deploy Script (in Codespaces terminal)

In the Codespaces terminal at the bottom, run:

```bash
bash .devcontainer/deploy.sh
```

This automatically:
- ✅ Creates all database tables in Neon
- ✅ Loads demo data (arjun@demo.com / Demo@1234)
- ✅ Deploys frontend to your Vercel account

When it asks you to log in to Vercel:
- Open the displayed URL in a new tab
- Log in to your Vercel account
- Come back and press Enter

---

## STEP 5 — Deploy Backend on Railway (5 minutes, browser)

1. Open: **https://railway.app** → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select: `finguardian-ai`
4. When asked **Root Directory** → type: `backend`
5. Go to **"Variables"** tab → click **"Raw Editor"** → paste:

```
DATABASE_URL=postgresql://neondb_owner:npg_Vw1WqzuGBM5y@ep-plain-forest-a1e0ap7c-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=finguardian-jwt-secret-change-me-2024
OPENAI_API_KEY=sk-your-openai-api-key-here
FRONTEND_URL=https://finguardian-ai.vercel.app
NODE_ENV=production
PORT=4000
```

6. Railway auto-deploys. Copy your Railway URL when done.

---

## STEP 6 — Connect Frontend ↔ Backend

1. In Vercel dashboard → **finguardian-ai** project → **Settings → Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_API_URL = https://YOUR-RAILWAY-URL.up.railway.app/api/v1
   ```
3. Click **Redeploy**

In Railway → Your service → **Variables** → update:
```
FRONTEND_URL = https://finguardian-ai.vercel.app
```

---

## ✅ You're Live!

- **Frontend**: `https://finguardian-ai.vercel.app`
- **API**: `https://your-backend.up.railway.app/api/v1`
- **Database**: Neon (ap-southeast-1) ✅

**Test login:** `arjun@demo.com` / `Demo@1234`

---

## 🆘 If Something Goes Wrong

**DB error?** In Codespaces terminal:
```bash
cd backend && npx prisma db push --accept-data-loss
```

**Frontend not showing data?** Check Vercel env var `NEXT_PUBLIC_API_URL` is set correctly.

**Backend crash?** Check Railway logs → **Deployments → View logs**

---

## 🔐 Security (after it's working)
Rotate your Neon DB password at:
https://console.neon.tech → Settings → Reset password
