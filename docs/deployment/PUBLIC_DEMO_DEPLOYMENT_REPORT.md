# AI Investment Coach Public Demo Deployment Report

**Deployment date:** 2026-09-18

## Public endpoints

- Frontend: https://ai-investment-coach-cyan.vercel.app
- Direct prototype: https://ai-investment-coach-cyan.vercel.app/#prototype
- Backend health: https://ai-investment-coach-api.azurewebsites.net/api/health

All three endpoints are public and require no application, GitHub, Vercel, Azure,
or ChatGPT login.

## Git release

- Product branch: `feat/sprint4-public-demo`
- Product PR: https://github.com/nikimpatel/ai-investment-coach/pull/11
- Vercel production-target fix: https://github.com/nikimpatel/ai-investment-coach/pull/12
- Guided confidence control fix: https://github.com/nikimpatel/ai-investment-coach/pull/13
- Native Vercel Git cleanup: https://github.com/nikimpatel/ai-investment-coach/pull/14
- Accepted application commit: `48e0834edfefac5e59e518db33cafd0d862dd48a`
- Native Vercel Git baseline: `ba3753d` (the documentation PR will advance `main`)

All listed PRs were merged only after Backend, Frontend, and applicable Vercel
checks passed.

## Azure backend

- Subscription: personal `Azure subscription 1`
- Resource group: `ai-investment-coach-rg`
- Region: Australia East
- App Service plan: `ai-investment-coach-plan`
- Plan: Linux F1 Free
- Web App: `ai-investment-coach-api`
- Runtime: `DOTNETCORE|8.0`
- HTTPS only: enabled
- Health path: `/api/health`
- Deployment: GitHub Actions with repository-specific Azure OIDC
- Deployment identity role: `Website Contributor`, scoped only to the new Web App

The existing AgencyCFO Windows F1 plan was inspected only for compatibility and
was not reused or modified. `agency-cfo-api` was not redeployed. No Flow Power
account, resource, plan, credential, or configuration was used for deployment.

### Cost impact

The new plan is F1 Free, so the incremental App Service plan cost is **USD $0**.
The user explicitly selected F1 after being shown the alternative Australia East
Linux B1 retail rate of USD $0.019/hour (approximately USD $13.87/month at 730
hours, before tax).

## Vercel frontend

- Account scope: personal
- Project: `ai-investment-coach`
- Framework: Next.js
- Repository: `nikimpatel/ai-investment-coach`
- Repository root: `.`
- Production branch: `main`
- Node.js: `20.x`
- Install command: `npm ci`
- Build command: `npm run build`
- Deployment: native Vercel Git integration
- Project authentication / SSO protection: disabled for this project
- Stable production alias: `ai-investment-coach-cyan.vercel.app`

A temporary token-based GitHub Actions fallback was removed after native Vercel
Git integration was confirmed. Its GitHub token and project-ID variables were
also removed.

## Configuration names

Azure application settings:

- `ASPNETCORE_ENVIRONMENT`
- `SEC__UseFixtureData`

Vercel environment:

- `API_BASE_URL` — Preview and Production, server-side only

GitHub Azure deployment settings:

- `AZURE_INVESTMENT_COACH_CLIENT_ID`
- `AZURE_INVESTMENT_COACH_TENANT_ID`
- `AZURE_INVESTMENT_COACH_SUBSCRIPTION_ID`
- `AZURE_INVESTMENT_COACH_WEBAPP_NAME`

No values, publish profiles, account tokens, personal SEC email addresses, or
Azure/Vercel credentials are committed.

## Fixture mode

`SEC__UseFixtureData=true` is explicitly enabled. No `SEC__ApplicationName` or
`SEC__ContactEmail` value is configured. Public traffic reads the included
authentic captured SEC fixture; the UI and API honestly label it
`SEC EDGAR fixture`.

## Verification results

Frontend local and CI:

- `npm ci` — passed
- `npm test` — 10 passed, 0 failed, Node built-in test runner
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run build` — passed with Next.js 16.2.12

Backend local, CI, and deployment:

- `dotnet restore backend/TenYearExplorer.sln` — passed
- Release build — passed, 0 warnings and 0 errors
- Release tests — 96 passed, 0 failed
- Published output contained both reduced fixture JSON files
- Corrected OIDC deployment workflow — passed
- `GET /api/health` — HTTP 200 with `TenYearExplorer` status `ok`

Production API:

- `revenue` — Success, 10 points
- `gross-profit` — Success, 10 points
- `operating-income` — Success, 10 points
- `net-income` — Success, 10 points
- `diluted-eps` — PartiallySupported, 8 comparable split-adjusted points
- `operating-cash-flow` — PartiallySupported, 10 points
- `capital-expenditure` — PartiallySupported, 10 points
- `free-cash-flow` — PartiallySupported, 10 points, formula and two SEC inputs
- `cash-and-equivalents` — PartiallySupported, 10 points
- `total-debt` — PartiallySupported, 10 points, formula and three debt inputs

Every production response retained fixture source metadata. Response scans found
no SEC identity, environment-variable, or credential detail.

## Production acceptance

A fresh logged-out browser session completed:

- landing and direct `/#prototype` navigation
- Finance → Apple (SEC), all three metric groups, and all ten metric controls
- deterministic `Retail business` Circle of Competence interpretation
- bias introduction and pre-judgment bias acknowledgement
- a complete recorded Revenue judgment with counter-evidence, alternative
  explanation, missing information, mind-changer, and shared confidence 6/10
- complete review plus Defer/Uncertain paths through Stages 2–5
- Bias and Counter-Evidence Review with Stage 1 marked fully reviewed
- Apple Analysis Summary with separate facts, explanations, judgment, bias,
  counter-evidence, open questions, source badge, and educational disclaimer
- Revenue packet saved to Thesis as Supports with fixture source badge
- refresh and exact Summary resume

No login, console, hydration, mixed-content, CORS, API, or network errors were
observed. Keyboard focus/navigation worked. Desktop and approximately 390px
layouts remained usable outside and inside the phone frame.

## Evidence paths

- `docs/deployment/evidence/local-guided-summary.png`
- `docs/deployment/evidence/local-mobile-390-prototype.png`
- `docs/deployment/evidence/production-desktop-apple-finance.png`
- `docs/deployment/evidence/production-mobile-390-apple-finance.png`
- `docs/sprint4/SPRINT4_IMPLEMENTATION_REPORT.md`
- `.azure/deployment-plan.md`

## Security result

- No committed secrets or personal SEC identity
- Server-only `API_BASE_URL`; no production `NEXT_PUBLIC_API_BASE_URL`
- Azure OIDC role scoped to the new Web App
- HTTPS-only backend
- No auth, database, Clerk, OpenAI key, analytics, or tracking
- Learner analysis remains browser-local
- AgencyCFO and Flow Power resources unchanged

## Known limitations

- Linux F1 can cold start, has no SLA, and is limited to 60 CPU minutes/day.
  Reddit traffic above that quota can temporarily exhaust the backend.
- The Vercel stable alias includes `-cyan` because the unsuffixed global domain
  was already assigned to an older deployment.
- The Windows junction used locally triggers a non-blocking Turbopack root
  warning; builds pass and Vercel’s repository checkout does not use the junction.
- GitHub runner annotations note upcoming action-runtime/Ubuntu migrations; the
  application and Vercel project remain pinned to Node 20 as required.

## Final status

Application release, Azure backend, native Vercel production deployment, CI,
logged-out acceptance, and evidence capture are complete. Final Git status will
be recorded after this report is merged.
