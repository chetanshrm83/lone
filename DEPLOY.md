# 🚀 FinGuardian AI — Deployment Guide

This guide deploys:
- **Frontend** (Next.js) → Vercel  
- **Backend** (NestJS) → Railway  
- **Database** (PostgreSQL) → Neon  

Total time: ~20 minutes

---

## STEP 1 — Push to GitHub

### 1a. Create repository on GitHub
1. Go to https://github.com/new
2. Repository name: `finguardian-ai`
3. Set to **Private** (recommended for a SaaS product)
4. Do NOT initialise with README
5. Click **Create repository**

### 1b. Push from your machine
```bash
# Unzip the project
unzip finguardian-ai.zip
cd finguardian

# Initialise git
git init
git add .
git commit -m "feat: initial FinGuardian AI production build"

# Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/finguardian-ai.git
git branch -M main
git push -u origin main
```

✅ Your code is now on GitHub.

---

## STEP 2 — Set Up Database on Neon

1. Go to https://neon.tech → Sign up (free tier is sufficient to start)
2. Create project: **FinGuardian**
3. Select region: **AWS ap-south-1 (Mumbai)** for India users
4. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxxxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this as your `DATABASE_URL` — you'll need it in the next steps

---

## STEP 3 — Deploy Backend on Railway

### 3a. Create Railway project
1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `finguardian-ai` repository
4. Railway will detect it — click **Add service** → select the `backend` folder

### 3b. Set environment variables in Railway dashboard
Go to your service → **Variables** tab → add each:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Your key from https://platform.openai.com/api-keys |
| `FRONTEND_URL` | `https://finguardian.vercel.app` (update after Vercel deploy) |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |

### 3c. Configure Railway root directory
In Railway service settings → **Root Directory** → set to `/backend`

### 3d. Run database migration
In Railway → your backend service → **Shell** tab:
```bash
npx prisma db push
npm run prisma:seed
```

### 3e. Copy your Railway URL
It will look like: `https://finguardian-api-production.up.railway.app`

Save this — you need it for the frontend environment variable.

---

## STEP 4 — Deploy Frontend on Vercel

### Option A: Deploy via Vercel Dashboard (easiest)

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project**
3. Import your `finguardian-ai` GitHub repo
4. **IMPORTANT** — Set Root Directory to `frontend`
5. Framework preset will auto-detect as **Next.js**
6. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-railway-url.up.railway.app/api/v1
   ```
7. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd frontend

# Deploy (follow the prompts)
vercel

# For production
vercel --prod
```

When prompted:
- Link to existing project? **No** → create new
- Project name: `finguardian-ai`
- Root directory: `./` (you're already in frontend/)

Set env via CLI:
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://your-railway-url.up.railway.app/api/v1
```

---

## STEP 5 — Connect GitHub Secrets for CI/CD

Go to your GitHub repo → **Settings → Secrets and variables → Actions** → add:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `RAILWAY_TOKEN` | railway.app → Account Settings → Tokens |
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL + `/api/v1` |
| `DATABASE_URL` | Your Neon connection string |

After adding secrets, every `git push` to `main` will auto-deploy both services.

---

## STEP 6 — Update CORS

Once you have your Vercel URL (e.g. `https://finguardian.vercel.app`), update the `FRONTEND_URL` environment variable in Railway to match exactly.

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Neon database created and `DATABASE_URL` copied
- [ ] Railway backend deployed at `*.railway.app`
- [ ] Database migrated: `prisma db push` + seed run
- [ ] Vercel frontend deployed at `*.vercel.app`
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel pointing to Railway
- [ ] `FRONTEND_URL` set in Railway pointing to Vercel
- [ ] GitHub Actions secrets added
- [ ] Test login with: `arjun@demo.com` / `Demo@1234`

---

## 🌐 Architecture After Deployment

```
User Browser
    │
    ▼
Vercel CDN (Edge)
finguardian.vercel.app
    │ Next.js frontend
    │ NEXT_PUBLIC_API_URL →
    ▼
Railway (Node.js)
finguardian-api.railway.app/api/v1
    │ NestJS + Prisma
    │ DATABASE_URL →
    ▼
Neon PostgreSQL
AWS Mumbai (ap-south-1)
    │
    ◄── OpenAI API (gpt-4o-mini)
```

---

## 💰 Cost Estimate (starting)

| Service | Free Tier | Paid |
|---|---|---|
| Vercel | 100GB bandwidth/mo | $20/mo Pro |
| Railway | $5 free credit/mo | ~$5–10/mo |
| Neon | 0.5GB storage free | $19/mo Pro |
| OpenAI | Pay per use | ~$2–5/mo typical |
| **Total** | **~$0 to start** | **~$30/mo at scale** |

---

## 🔧 Useful Commands Post-Deploy

```bash
# Check backend health
curl https://your-api.railway.app/api/v1/health

# View Railway logs
railway logs --service finguardian-api

# Redeploy frontend
cd frontend && vercel --prod

# Run DB migrations after schema changes
cd backend && npx prisma migrate deploy
```
