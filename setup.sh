#!/bin/bash
# FinGuardian AI — One-shot local setup + deploy script
# Run this on YOUR machine after unzipping

set -e
echo "🛡️ FinGuardian AI Setup Script"
echo "================================"

# ── Colors ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── 1. Check prereqs ──
echo -e "\n${YELLOW}[1/7] Checking prerequisites...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not found. Install from nodejs.org${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}❌ Git not found.${NC}"; exit 1; }
echo -e "${GREEN}✅ Node $(node -v), Git $(git --version | cut -d' ' -f3)${NC}"

# ── 2. Install backend deps + push DB schema ──
echo -e "\n${YELLOW}[2/7] Installing backend & pushing DB schema to Neon...${NC}"
cd backend
npm install
export DATABASE_URL="postgresql://neondb_owner:npg_Vw1WqzuGBM5y@ep-plain-forest-a1e0ap7c-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx prisma db push --accept-data-loss
echo -e "${GREEN}✅ Schema pushed to Neon${NC}"

# ── 3. Seed database ──
echo -e "\n${YELLOW}[3/7] Seeding database with demo data...${NC}"
npx ts-node prisma/seed.ts
echo -e "${GREEN}✅ Database seeded — demo: arjun@demo.com / Demo@1234${NC}"
cd ..

# ── 4. Install frontend deps ──
echo -e "\n${YELLOW}[4/7] Installing frontend dependencies...${NC}"
cd frontend
npm install
echo -e "${GREEN}✅ Frontend deps installed${NC}"
cd ..

# ── 5. Push to GitHub ──
echo -e "\n${YELLOW}[5/7] Pushing to GitHub...${NC}"
echo -e "${YELLOW}Enter your GitHub repo URL (e.g. https://github.com/USERNAME/finguardian-ai.git):${NC}"
read -r GITHUB_URL

if [ -n "$GITHUB_URL" ]; then
  git init
  git add .
  git commit -m "feat: FinGuardian AI — production build"
  git remote add origin "$GITHUB_URL" 2>/dev/null || git remote set-url origin "$GITHUB_URL"
  git branch -M main
  git push -u origin main
  echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
  echo -e "${YELLOW}⚠️  Skipping GitHub push${NC}"
fi

# ── 6. Deploy frontend to Vercel ──
echo -e "\n${YELLOW}[6/7] Deploying frontend to Vercel...${NC}"
npm install -g vercel 2>/dev/null || true
cd frontend

echo -e "${YELLOW}You'll be prompted to log in to Vercel...${NC}"
vercel --yes \
  --env NEXT_PUBLIC_API_URL=https://finguardian-backend.up.railway.app/api/v1

echo -e "${GREEN}✅ Frontend deployed!${NC}"
VERCEL_URL=$(vercel --prod 2>&1 | grep -oP 'https://[^\s]+vercel\.app' | head -1)
echo -e "${GREEN}🌐 Live at: $VERCEL_URL${NC}"
cd ..

# ── 7. Summary ──
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     FinGuardian AI Setup Complete! 🎉    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy backend on Railway → railway.app"
echo "     - Connect GitHub repo"
echo "     - Set Root Directory: /backend"
echo "     - Add env vars (see DEPLOY.md)"
echo "  2. Update NEXT_PUBLIC_API_URL in Vercel once Railway is live"
echo "  3. Test: arjun@demo.com / Demo@1234"
echo ""
echo "Database: Neon (ap-southeast-1) ✅"
echo "Frontend: Vercel ✅"
echo "Backend:  Railway (manual step above)"
