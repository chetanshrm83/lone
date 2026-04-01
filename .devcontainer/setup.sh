#!/bin/bash
echo "🛡️ FinGuardian AI — Codespaces Auto-Setup"
cd /workspaces/finguardian-ai/backend && npm install
cd /workspaces/finguardian-ai/frontend && npm install
npm install -g vercel @railway/cli
echo ""
echo "✅ All dependencies installed!"
echo "Run: bash .devcontainer/deploy.sh to deploy"
