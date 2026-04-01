#!/bin/bash
# Run this in the Codespaces terminal to deploy everything
set -e

echo "🚀 FinGuardian AI — Cloud Deploy Script"
echo "========================================"

DB_URL="postgresql://neondb_owner:npg_Vw1WqzuGBM5y@ep-plain-forest-a1e0ap7c-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 1. Write .env
cd /workspaces/finguardian-ai/backend
cat > .env << ENVEOF
DATABASE_URL="${DB_URL}"
JWT_SECRET="finguardian-jwt-2024-$(openssl rand -hex 16)"
OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-key-here}"
FRONTEND_URL="https://placeholder.vercel.app"
PORT=4000
NODE_ENV=production
ENVEOF
echo "✅ .env written"

# 2. Push DB schema
export DATABASE_URL="$DB_URL"
npx prisma db push --accept-data-loss
echo "✅ Database schema pushed to Neon"

# 3. Seed data
npx ts-node prisma/seed.ts
echo "✅ Demo data seeded"

# 4. Deploy frontend to Vercel
cd /workspaces/finguardian-ai/frontend
echo ""
echo "📦 Deploying frontend to Vercel..."
echo "You'll be asked to log in to Vercel — follow the prompts"
vercel --yes --prod --scope "chetan-sharmas-projects-5d8d47b5"

echo ""
echo "✅ Frontend deployed!"
echo ""
echo "Next: Deploy backend on railway.app (see BROWSER-DEPLOY.md)"
