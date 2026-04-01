# 🛡️ FinGuardian AI — Your AI CFO for Debt, Money & Peace of Mind

> **Production-ready fintech SaaS** | Next.js 14 + NestJS + PostgreSQL + OpenAI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

| Module | What it does |
|---|---|
| 🔐 Auth | JWT login/register, bcrypt hashing, protected routes |
| 📊 Dashboard | Total debt, EMI summary, AI stress score, cashflow charts |
| 🏦 Loans | Add/edit/delete loans, EMI schedule, overdue highlighting |
| 🎯 Priority Engine | Deterministic `priorityScore = (rate×0.5) + (overdue×0.3) + (penalty×0.2)` |
| 🤖 AI Advisor | GPT-4o chat with full financial context injected as system prompt |
| 🧠 Decision Engine | Hybrid rule-based + LLM — rules run first, AI explains |
| 🛡️ Protection Center | Generate call/email scripts (Polite / Firm / Legal-Aware) |
| 📈 Investment Engine | SIP/FD/PPF calculator with growth charts and scheme comparison |
| 🧾 Tax Helper | Old vs New regime comparison, 80C/80D suggestions |

---

## 🏗️ Architecture

```
finguardian/
├── backend/          # NestJS modular monolith
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         JWT login, register, guards
│   │   │   ├── users/        Profile, dashboard summary
│   │   │   ├── loans/        CRUD + EMI priority engine
│   │   │   ├── transactions/ Income/expense tracking
│   │   │   ├── investments/  SIP/FD calculator
│   │   │   ├── ai/           Hybrid decision + chat
│   │   │   ├── communication Script gen + logging
│   │   │   └── tax/          Old/new regime calculator
│   │   ├── common/
│   │   │   ├── guards/       JWT auth guard
│   │   │   ├── decorators/   CurrentUser decorator
│   │   │   └── filters/      Global exception handler
│   │   └── config/           Prisma service/module
│   └── prisma/
│       ├── schema.prisma     Full DB schema
│       └── seed.ts           Demo data
│
└── frontend/         # Next.js 14 App Router
    ├── app/
    │   ├── auth/             Login / Register
    │   └── (dashboard)/
    │       ├── dashboard/    Overview + charts
    │       ├── loans/        Loan management
    │       ├── advisor/      AI chat interface
    │       ├── investments/  Calculator + portfolio
    │       ├── protection/   Script generator + logs
    │       └── tax/          Tax estimator
    ├── lib/
    │   ├── api.ts            Typed API client
    │   └── utils.ts          formatCurrency, dates
    └── store/
        └── auth.ts           Zustand auth store
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Neon/Supabase URL)
- Redis (optional, for future queue features)
- OpenAI API key

---

### 1. Clone & Install

```bash
git clone https://github.com/youruser/finguardian.git
cd finguardian

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

---

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/finguardian"
JWT_SECRET="super-secret-jwt-key-min-32-chars-change-in-production"
OPENAI_API_KEY="sk-your-openai-api-key"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

### 3. Database Setup

```bash
cd backend

# Push schema to database
npx prisma db push

# Seed with demo data
npm run prisma:seed
```

**Demo credentials after seeding:**
- Email: `arjun@demo.com`
- Password: `Demo@1234`

---

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 4000)
cd backend
npm run start:dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

## 🌐 API Reference

All endpoints require `Authorization: Bearer <token>` except auth routes.

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/v1/auth/register` | `{ name, email, password, monthlyIncome? }` |
| POST | `/api/v1/auth/login` | `{ email, password }` |
| GET | `/api/v1/auth/me` | — |

### Loans
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/v1/loans` | All user loans, sorted by priority |
| POST | `/api/v1/loans` | Create loan, auto-computes priority score |
| PUT | `/api/v1/loans/:id` | Update loan |
| DELETE | `/api/v1/loans/:id` | Remove loan |
| GET | `/api/v1/loans/priority` | Sorted repayment order + explanation |
| GET | `/api/v1/loans/dashboard` | Summary stats |

### AI
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/v1/ai/stress-score` | 0–100 financial stress score |
| GET | `/api/v1/ai/decision` | Hybrid rule+AI decision |
| POST | `/api/v1/ai/chat` | `{ message, conversationId? }` |
| GET | `/api/v1/ai/conversations` | Chat history list |

### Investments
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/v1/investments/calculate?monthly=5000&rate=12&months=60` | SIP/FD/Govt comparison |
| POST | `/api/v1/investments` | Add investment |

### Tax
| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/v1/tax/calculate` | `{ annualIncome, deductions: {...} }` |

---

## 🎯 EMI Priority Engine

The core rule-based algorithm (no LLM dependency):

```typescript
priorityScore = (interestRate × 0.5) + (overdueDays × 0.3) + (normalizedPenalty × 0.2)

// normalizedPenalty = Math.min(penaltyRate × 10, 100)
```

**Example scoring:**
- Axis Credit Card: 36% rate, 18 days overdue → score = 18.0 + 5.4 + ~3 = **26.4** 🔴 HIGH
- HDFC Personal: 18.5% rate, 12 days overdue → score = 9.25 + 3.6 + 2 = **14.85** 🟡 MEDIUM
- SBI Home Loan: 8.5% rate, 0 days overdue → score = 4.25 + 0 + 0 = **4.25** 🟢 LOW

---

## 🔐 Security

- Passwords hashed with `bcrypt` (cost factor 12)
- JWT tokens (7-day expiry, configurable)
- All inputs validated via `class-validator` DTOs
- Route guards on every protected endpoint
- SQL injection impossible via Prisma ORM parameterisation
- CORS restricted to `FRONTEND_URL`
- Global exception filter — no stack traces in production responses
- Sensitive env vars never in source code

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod

# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1
```

### Backend → Railway
```bash
# Install Railway CLI
npm install -g railway

cd backend
railway login
railway init
railway up

# Set env vars in Railway dashboard:
# DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, FRONTEND_URL
```

### Database → Neon (Serverless PostgreSQL)
1. Create project at neon.tech
2. Copy connection string
3. Set as `DATABASE_URL` in backend
4. Run `npx prisma db push`

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Recharts, Zustand |
| Backend | NestJS, Passport JWT, class-validator |
| Database | PostgreSQL via Prisma ORM |
| AI | OpenAI GPT-4o-mini + rule-based engine |
| Auth | JWT + bcryptjs |
| Deployment | Vercel (FE) + Railway (BE) + Neon (DB) |

---

## ⚠️ Compliance Notice

> FinGuardian AI provides **financial guidance**, not regulated financial advice.
>
> - We do **not** execute trades or financial transactions
> - We do **not** auto-handle collection calls
> - We do **not** store raw bank credentials
> - Tax estimates are **educational only** — consult a CA for filing
> - AI-generated scripts are communication aids, not legal documents
> - All investment projections are **estimates**, not guarantees

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

Built with ❤️ for people under financial stress.
