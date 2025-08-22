# FinVoice — AI-Powered Financial Management & Advisory Assistant

A voice-first personal finance platform that turns speech & receipts into transactions, auto-categorizes spending, provides visual dashboards, proactive advice, and SIP goal planning. Built as a modular SaaS: Web dashboard + voice-capable PWA/mobile client + ML microservices.

---

## Quick Pitch (30s)
FinVoice listens, logs, and teaches. Say “Add dinner 300” and it logs a transaction tagged as **Food**, updates your dashboard, and suggests where to cut spend to reach goals faster. It also scans receipts, links bank accounts (optional), and recommends SIPs for goals like a car or wedding.

---

## Table of Contents
1. Features
2. Architecture overview
3. Tech stack
4. Repo layout
5. Quickstart — Local dev
6. Environment variables
7. Database & data model (high-level)
8. APIs and endpoints
9. Voice & categorization flow
10. ML: models, training & feedback loop
11. Security & privacy
12. Deployment
13. Demo script (for judges)
14. Roadmap & stretch goals
15. Contribution & contact
16. License

---

## 1. Features

### ✅ Implemented Features
- 🔐 **Authentication and Accounts**: Secure user authentication and profile management
- 📊 **Transactions CRUD with Categories UI**: Tables, filters, bulk delete operations
- 📈 **Charts**: Expense Pie, Transaction Bar; Monthly Insights Email
- 💰 **Budgets + Alerts**: With Inngest cron jobs for notifications
- 📸 **AI Receipt Scanner**: OCR + Extraction for automatic transaction entry
- 🔒 **Rate Limiting & Bot Protection**: Using Arcjet
- 🚀 **Deployment on Vercel**: Production-ready hosting

### 🚀 Newly Implemented Features
- 🎙️ **Voice Input → Expense Logger**: Transcribe voice → parse amount/merchant/date → draft transaction
  - Natural language parsing for utterances like "add dinner 300" or "uber 240 yesterday"
  - Automatic extraction of title, amount, date, and category
  - Fallback to manual entry when needed

- 🧠 **Smart Categorization Engine**: Multi-layered approach for accurate transaction categorization
  - Rule-based categorization using merchant keywords
  - ML-based categorization with trained models from model_cat
  - Feedback loop for continuous learning and improvement

- 💬 **Personal Advisory Chatbot**: Data-grounded financial insights and recommendations
  - Interactive chat interface in the dashboard
  - Analysis of spending patterns, budget adherence, and saving opportunities
  - Personalized advice based on user's actual financial data

- 🎯 **Goal Planner & Investment Recommender**: Financial goal setting and SIP calculation
  - Goal creation with target amount, duration, and name
  - SIP calculator using formula: SIP = Target * r / ((1+r)^n - 1)
  - Visual growth projections with interactive charts
  - Progress tracking toward financial goals

### Planned Features
- 🌐 **Multilingual** (planned): English, Hindi, Marathi flows & translations.
- 📈 **Progress tracking**: streaks, mastery/behavior heatmaps.

---

## 2. Architecture (high-level)
- **Frontend**: Next.js (App Router) + Tailwind + shadcn/ui — responsive dashboard + PWA for mic access.
- **Backend**: Next.js API routes / Node.js services or Python microservices (FastAPI) for ML endpoints.
- **DB**: Supabase (Postgres) with pgvector optional; Prisma/Drizzle ORM for schema (user choice).
- **Vector DB / Similarity**: pgvector or Pinecone/FAISS for RAG and embeddings.
- **Jobs**: Inngest for scheduled jobs (budget alerts, recurring txns).
- **Security**: Clerk for auth (or Supabase auth), Arcjet for rate limiting/bot protection.
- **AI**: Local models (TF-IDF/XGBoost, sentence-transformers) for categorization; OpenAI/Gemini optional for advanced features (but not required for MVP).
- **Storage**: S3 / Cloudflare R2 for receipts and PDFs.
- **Hosting**: Vercel for frontend, Cloud Run/Render for backend, Supabase for DB.

Diagram (conceptual):
Mobile/PWA (mic, upload receipt)
↕
Next.js Frontend — API → Next.js Backend / FastAPI
↕ ↕
Supabase Postgres <—— Inngest jobs —— Models (models/*)
↕ ↕
pgvector / embeddings Storage (S3)


---

## 3. Tech Stack
- Frontend: **Next.js**, **Tailwind**, **shadcn/ui**
- Auth: **Clerk** or **Supabase Auth**
- DB: **Supabase (Postgres)** + **pgvector**
- ORM: **Prisma** or **Drizzle**
- Jobs: **Inngest**
- Rate limiting: **Arcjet**
- ML: **scikit-learn**, **xgboost**, **sentence-transformers**
- OCR: **Tesseract** or **Google Vision API**
- AI assistance (optional): **OpenAI / Gemini API**
- Deployment: **Vercel**, backend on **Render/Cloud Run**
- Mobile: Progressive Web App or **React Native** (optional)

---

## 4. Repo layout (example)
/ (root)
├─ frontend/ # Next.js app (dashboard, PWA, mic, UI)
├─ backend/ # Next.js API + FastAPI microservices
├─ model_cat/ # categorization microservice (scripts, models, rules)
├─ receipts/ # image upload handling
├─ jobs/ # Inngest functions (budget alerts, recurring tx)
├─ infra/ # infra scripts, terraform, supabase migrations
├─ docs/ # screenshots, pitch, design
└─ README.md


---

## 5. Quickstart — Local (developer)
> Assumes Node.js, Python (3.10+), and PostgreSQL/Supabase account (or local Postgres).

### A. Frontend (Next.js)
```bash
cd frontend
pnpm install
cp .env.example .env.local   # set NEXT_PUBLIC_* keys
pnpm dev
# open http://localhost:3000

B. Backend & ML (FastAPI or Next API)
cd model_cat
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# preprocess, train, run server
python scripts/preprocess.py
python scripts/train_tfidf_xgb.py
uvicorn app.main:app --reload --port 8000

C. Supabase (local)

Create project on supabase.com or run supabase locally.

Run migrations from infra/ or use the Supabase dashboard.
7. Database — high-level schema

Key tables (simplified):

users — id, email, name, locale, plan

documents — uploaded PDFs/receipts metadata

doc_chunks — chunk_id, doc_id, text, embedding

transactions — id, user_id, date, merchant, description, amount, category, source, created_at

drafts — voice drafts saved, pending confirmation

feedback — corrections (transaction_id, user_id_hashed, predicted, corrected, timestamp)

goals — user goals, target_amount, target_date, risk

investment_plans — SIP plans, monthly_amount, expected_return

topic_mastery — per-user topic scores for recommendations

8. API Endpoints (core)

POST /api/voice — accepts {user_id, transcript} → parse → draft → return draft with auto_confirm flag

POST /api/predict — {merchant, description, amount} → category + confidence + explanation

POST /api/transactions — create new transaction

GET /api/transactions — list user transactions (filter by date/category)

POST /api/feedback — send correction for training

POST /api/upload — signed URL to upload receipts/PDFs

POST /api/ingest — webhook to start OCR + chunk + embed pipeline

POST /api/tutor — RAG-powered tutor: {question, doc_ids} → answer with citations

GET /api/dashboard — aggregated metrics for UI

9. Voice & Categorization Flow (detailed)

Client records audio → STT (client or server): produce transcript.

Send transcript to POST /api/voice.

Parsing: regex-based parse_transcript extracts amount, merchant, date, notes.

Rule-first: check merchant_dict.json (exact or substring).

Model fallback: TF-IDF+XGBoost or embedding+XGBoost predicts category with confidence.

Save draft to DB/drafts.csv; if auto_confirm true → create transaction; else prompt user to confirm.

User corrects → POST /api/feedback stored for later retraining.

UX notes:

If STT confidence low or model confidence low (<0.6), show confirm modal.

Allow user to edit merchant and category before saving.




```
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

GEMINI_API_KEY=

RESEND_API_KEY=

ARCJET_KEY=
```
