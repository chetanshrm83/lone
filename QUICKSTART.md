# ⚡ FinGuardian AI — Quick Deploy (3 Steps)

Your Neon database is already configured. Run these commands on your machine:

---

## Step 1 — Initialize Database (1 command)

```bash
cd backend
cp .env.example .env
# Edit .env: add JWT_SECRET and OPENAI_API_KEY
npm install
npx prisma db push
npx ts-node prisma/seed.ts
```

**Your Neon DB URL is already in `.env.example`** ✅

---

## Step 2 — Push to GitHub

```bash
# From the finguardian/ root folder:
git init && git add . && git commit -m "FinGuardian AI"
git remote add origin https://github.com/YOUR_USERNAME/finguardian-ai.git
git push -u origin main
```

---

## Step 3A — Deploy Frontend to Vercel (2 commands)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

When Vercel asks:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select "Chetan Sharma's projects"
- **Link to existing project?** → `N`
- **Project name?** → `finguardian-ai`
- **In which directory is your code?** → `./` (press Enter)

Then set the environment variable:
```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://finguardian-backend.up.railway.app/api/v1
```

---

## Step 3B — Deploy Backend to Railway

1. Go to **railway.app** → New Project → Deploy from GitHub → `finguardian-ai`
2. Set **Root Directory**: `backend`
3. Add these environment variables:

```
DATABASE_URL = postgresql://neondb_owner:npg_Vw1WqzuGBM5y@ep-plain-forest-a1e0ap7c-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET   = (same value from your .env)
OPENAI_API_KEY = sk-your-key
FRONTEND_URL = https://finguardian-ai.vercel.app
NODE_ENV     = production
PORT         = 4000
```

4. Once deployed, copy your Railway URL and update in Vercel:
```bash
cd frontend
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://YOUR-RAILWAY-URL.up.railway.app/api/v1
vercel --prod
```

---

## ✅ Done! Test with:
- URL: `https://finguardian-ai.vercel.app`
- Email: `arjun@demo.com`
- Password: `Demo@1234`

---

## 🔐 Security reminder
After deployment, consider rotating your Neon database password at:
**console.neon.tech → Settings → Reset password**
