# AI Investment Coach — Phase 0 + Sprint 1 Financial Performance PoC

Polished landing page + interactive mobile-first product walkthrough for validating whether self-directed investors value structured thesis-building, decision journaling and transparent behavioural patterns.

Educational decision-support only. Not personal financial advice. Not a trading, screener or tip product.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend (Sprint 1):** .NET 8 Web API under `backend/` (isolated from Agency CFO)
- Harborline path: local fictional sample data
- Apple path: SEC-sourced annual revenue via the .NET API (fixture mode by default)

## Setup

### Frontend

```bash
cd ai-investment-coach
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (required for Apple SEC mode)

```powershell
cd ai-investment-coach/backend
dotnet restore
dotnet run --project src/TenYearExplorer.Api
```

API listens on [http://localhost:5080](http://localhost:5080). The Next.js route ` /api/companies/[symbol]/financial-history` proxies to that base URL (`API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:5080`).

SEC User-Agent identification stays on the .NET backend only — never exposed to the browser.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local frontend |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run build` | Production frontend build |
| `npm start` | Serve production build |
| `dotnet test` (in `backend/`) | Backend fixture-based tests |

## Configuration

Frontend CTAs: edit `src/lib/config.ts`.

Backend SEC: see `backend/README.md`, `backend/appsettings.Example.json`, and `backend/.env.example`.

Default backend mode uses fixtures (`SEC__UseFixtureData=true`) so local demos work without SEC identity. For live SEC:

```powershell
$env:SEC__ApplicationName = "YOUR_NAME TenYearExplorer"
$env:SEC__ContactEmail = "your-email@example.com"
$env:SEC__UseFixtureData = "false"
```

Do not commit real personal email addresses.

## Prototype flow

Interactive phone preview (section **Try the prototype**):

1. **Guided Research** — fictional company *Harborline Logistics*
2. **Financial Performance** — Harborline fictional decade **or** Apple SEC annual revenue (toggle)
3. **Thesis Builder** — structured reasoning; may flag missing valuation notes (no investment recommendation)
4. **Decision Journal** — stance, confidence, reconsider triggers (neutral language)
5. **Reflection & Playbook** — later observations, lessons, multi-decision pattern with Confirm / Correct / Dismiss

State is local to the browser session and resets with “Restart walkthrough”.

### Dataset modes (Financial Performance)

| Mode | Source | Notes |
| --- | --- | --- |
| Harborline demo | Local Sprint 0 sample series | Fully offline; unchanged fictional experience |
| Apple (SEC) | `GET .../AAPL/financial-history` | Chart + table use the same API payload; YoY/CAGR from backend |

## Sprint 1 scope

- Apple Inc. / AAPL / CIK 0000320193
- Metric: annual revenue only
- Latest 10 completed fiscal years
- Deterministic normalization + calculations
- No company search, other KPIs, AI, auth, or database

## Validation goals

Use this prototype to test whether visitors:

- Understand the product quickly
- Find structured thinking valuable
- Care about reviewing past reasoning
- Find decision-pattern coaching useful rather than intrusive
- Join early access or volunteer for an interview
