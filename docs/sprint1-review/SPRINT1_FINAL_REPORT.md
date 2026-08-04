# Sprint 1 Final Report — Ten-Year Financial Performance Explorer (Apple SEC PoC)

**Re-verified:** 2026-08-04 (fixture mode). Live services: API `http://localhost:5080`, frontend `http://localhost:3000`.  
**Implementation agent:** [Sprint 1 Apple PoC](66c07bc0-d84a-450a-9140-512171860497)

---

## Pre-implementation inspection

1. **Existing frontend architecture:** Next.js App Router prototype under `ai-investment-coach` (`PrototypeApp` + marketing landing). Phone-frame guided loop: Research → Finance → Thesis → Decision → Reflect.
2. **Current Financial Performance implementation (pre-Sprint 1):** Harborline-only fictional decade via local `harborlineRevenueSeries` + client `financial-calcs` (YoY / CAGR / summary / observation).
3. **Whether a .NET backend already exists:** Yes — Agency CFO under `Learning/backend` (Clerk, EF Core, PostgreSQL, agency domain). **Not reusable** for this PoC without product coupling.
4. **Existing test infrastructure:** Frontend had `npm run typecheck` / `lint` / `build` only (no Jest/Playwright suite for the coach prototype). No investment-coach .NET tests yet.
5. **Existing configuration conventions:** Frontend `src/lib/config.ts` for CTAs; no financial API base URL yet. Agency CFO used its own appsettings / Clerk / DB patterns.
6. **Proposed backend projects/folders:** **Option A** — isolated `ai-investment-coach/backend` (TenYearExplorer: Api / Application / Domain / Infrastructure + xUnit tests + fixtures).
7. **How Sprint 0 coexists with Apple PoC:** Finance-step dataset toggle — **Harborline demo** (default, local fictional) vs **Apple (SEC)** (API / fixture).
8. **Technical / product risks:** NuGet network path issues (mitigated with local `NuGet.config` + `.nuget-packages`); live SEC requires identifying User-Agent; fixture is reduced/constructed when live capture is blocked; only Apple / revenue / annual / 10y in scope.

---

## Sprint 1 final report

### 1. Overall status

**Complete with non-blocking follow-up**

Live SEC verification remains blocked because `SEC__ApplicationName` / `SEC__ContactEmail` were not set. Fixture mode delivers the full PoC (API → chart → exact-value table → calculations → source metadata).

### 2. Architecture implemented

Isolated .NET 8 solution `TenYearExplorer`:

| Layer | Role |
|---|---|
| `TenYearExplorer.Api` | HTTP contracts, controllers, CORS, DI host |
| `TenYearExplorer.Application` | Options, normalizer, calculator, history service |
| `TenYearExplorer.Domain` | Models / enums |
| `TenYearExplorer.Infrastructure` | SEC HTTP client, fixture client, facts provider, memory cache |
| `TenYearExplorer.Tests` | xUnit + Moq |

Abstractions: `ISecEdgarClient`, `IFinancialFactsProvider`, `IXbrlKpiNormalizer`, `IFinancialMetricsCalculator`, `IFinancialHistoryService`, `IFinancialDataCache`.

Default **fixture mode** (`SEC:UseFixtureData=true`). Live SEC client used when identity is configured and `UseFixtureData=false`.

Frontend: Next.js proxy `GET /api/companies/[symbol]/financial-history` → `http://localhost:5080` (SEC User-Agent stays on .NET only).

### 3. Files created/changed (high level)

- **New backend:** `ai-investment-coach/backend/**` (solution, projects, fixtures, tests, docs, README, `.env.example`, `appsettings.Example.json`, `NuGet.config`)
- **Frontend:** `FinancialPerformance.tsx` (Harborline/Apple toggle), `apple-financial-api.ts`, `apple-trend-copy.ts`, proxy route, README / `.env.example` / `.gitignore`, USD formatting in `financial-calcs.ts`

### 4. Exact official SEC endpoints used

- `GET https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json`
- `GET https://data.sec.gov/submissions/CIK0000320193.json`

(Live calls only when identity configured; this re-verification used fixtures.)

### 5. SEC config and User-Agent behaviour

- Config keys: `SEC:ApplicationName`, `ContactEmail`, `BaseUrl`, `CacheDurationMinutes`, `RequestTimeoutSeconds`, `UseFixtureData`
- Env overrides: `SEC__*`
- User-Agent = `{ApplicationName} {ContactEmail}`
- Never returned to clients; live requests refused if missing or placeholder
- See `backend/appsettings.Example.json`, `backend/.env.example`

### 6. Revenue concept mappings and priority

1. `RevenueFromContractWithCustomerExcludingAssessedTax` (ASC 606 / Apple primary)
2. `Revenues`
3. `SalesRevenueNet`

Details: `backend/docs/REVENUE_CONCEPT_MAPPING.md`

### 7. Detailed normalization rules

- USD units only
- Forms: `10-K` / `10-K/A`
- Prefer `fp=FY` when present
- Period start required; duration **350–380** days
- Reject 10-Q / quarterly fragments
- Fiscal year label from **period-end year** (not `fy` alone)
- Prefer own-period facts over later comparative restatements
- Conflicting ambiguous facts → exclude + warning (no guessing)
- Return latest **10 completed** fiscal years, chronological

### 8. Complete selected Apple dataset (API actuals, fixture mode)

Live re-fetch of `GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10` on 2026-08-04:

| FY | Start | End | Revenue (USD) | Unit | Concept | Form | Filed | Accession |
|---|---|---|---:|---|---|---|---|---|
| FY2016 | 2015-09-27 | 2016-09-24 | 215,639,000,000 | USD | RevenueFromContractWithCustomerExcludingAssessedTax | 10-K | 2016-10-26 | 0001628280-16-020309 |
| FY2017 | 2016-09-25 | 2017-09-30 | 229,234,000,000 | USD | same | 10-K | 2017-11-03 | 0000320193-17-000070 |
| FY2018 | 2017-10-01 | 2018-09-29 | 265,595,000,000 | USD | same | 10-K | 2018-11-05 | 0000320193-18-000145 |
| FY2019 | 2018-09-30 | 2019-09-28 | 260,174,000,000 | USD | same | 10-K | 2019-10-31 | 0000320193-19-000119 |
| FY2020 | 2019-09-29 | 2020-09-26 | 274,515,000,000 | USD | same | 10-K | 2020-10-30 | 0000320193-20-000096 |
| FY2021 | 2020-09-27 | 2021-09-25 | 365,817,000,000 | USD | same | 10-K | 2021-10-29 | 0000320193-21-000105 |
| FY2022 | 2021-09-26 | 2022-09-24 | 394,328,000,000 | USD | same | 10-K | 2022-10-28 | 0000320193-22-000108 |
| FY2023 | 2022-09-25 | 2023-09-30 | 383,285,000,000 | USD | same | 10-K | 2023-11-03 | 0000320193-23-000106 |
| FY2024 | 2023-10-01 | 2024-09-28 | 391,035,000,000 | USD | same | 10-K | 2024-11-01 | 0000320193-24-000123 |
| FY2025 | 2024-09-29 | 2025-09-27 | 416,161,000,000 | USD | same | 10-K | 2025-10-31 | 0000320193-25-000079 |

- `status`: Success  
- `sourceProvider`: SEC EDGAR fixture  
- `warnings`: `[]`  
- Fixture note: live capture blocked; reduced Company Facts shape documented in `backend/fixtures/FIXTURE_README.md`.

### 9. Calculation results (API actuals)

- Start: FY2016 `215639000000` → End: FY2025 `416161000000`
- Intervals: **9**
- Unrounded CAGR: **0.0757862960319591** (UI displays **+7.6%**)
- YoY first year `null`; of 9 YoY periods: positives **7**, negatives **2**, flat **0**
- Highest: FY2025 (`416161000000`); Lowest: FY2016 (`215639000000`)
- Largest increase: FY2021 absolute `91302000000`, relative ≈ **+33.3%**
- Largest decline: FY2023 absolute `-11043000000`, relative ≈ **-2.8%**

### 10. API response structure and result states

`GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10`

DTO fields: `status`, `company`/`symbol`/`cik`, `currency`, `metric`, `period`, `years`, `points[]` (FY/dates/value/YoY/filing meta/concept/unit), `summary`, `sourceProvider`, `retrievedAtUtc`, `cacheStatus`, `warnings`, `detail`.

HTTP mapping:

| Status | HTTP |
|---|---|
| Success / PartiallySupported | 200 |
| UnsupportedMetric | 400 |
| InsufficientHistory | 422 |
| ProviderUnavailable / InvalidConfiguration | 503 |

### 11. Cache behaviour + evidence of hit

In-memory cache key pattern: `AAPL|revenue|annual|10`.  
Re-verification response: `"cacheStatus":"Hit"`. UI showed **Cache Hit** beside source/retrieved timestamp. Failures / cancellation are not cached.

### 12. Automated test commands and results (fresh re-run 2026-08-04)

**Backend**

```powershell
cd ai-investment-coach/backend
dotnet test TenYearExplorer.sln --verbosity minimal
```

Result: **Passed! Failed: 0, Passed: 27, Skipped: 0, Total: 27** — exit code **0**

**Frontend**

```powershell
cd ai-investment-coach
npm run typecheck   # exit 0
npm run lint        # exit 0
npm run build       # exit 0 (compiled successfully; Next.js workspace-root lockfile warning only)
```

No separate frontend unit suite.

### 13. Manual frontend tests completed (re-verified in browser)

- Harborline demo remains selectable; fictional series path intact
- Apple (SEC): identity `Apple Inc. · AAPL · CIK 0000320193`, Revenue KPI, chart + table from API
- Summary sentences match API (CAGR +7.6%, FY2016→FY2025, largest decline FY2023 −2.8%)
- Source line: `SEC EDGAR fixture · Retrieved … · Cache Hit`
- Filing metadata expandable per row (Filed / Period / Accession / Concept)
- Thesis observation seeded from Apple API identity (not an investment conclusion)
- Proxy `GET /api/companies/AAPL/financial-history…` returned HTTP 200

### 14. Live SEC verification

**Blocked.** Environment had empty `SEC__ApplicationName` / `SEC__ContactEmail`; anonymous/fake User-Agent was not used.

To enable:

```powershell
$env:SEC__ApplicationName = "YOUR_NAME TenYearExplorer"
$env:SEC__ContactEmail = "you@example.com"
$env:SEC__UseFixtureData = "false"
dotnet test --filter Live_CompanyFacts_Reachable_For_Apple
```

### 15. Evidence chart/table match

Same API `points[]` drives chart and table. Browser showed FY2016–FY2025 exact values (`$215,639,000,000` … `$416,161,000,000`) and compact chart levels (`$215.64b` → `$416.16b`) with CAGR **+7.6%**, matching the API payload.

Screenshots:

- `docs/sprint1-review/apple-chart.png`
- `docs/sprint1-review/apple-exact-value-table.png`
- `docs/sprint1-review/apple-source-details-warnings.png`

### 16. Evidence Sprint 0 still works

Harborline demo remains the default Finance toggle; Research → Harborline fictional finance flow unchanged. Apple path is additive.

### 17. Known limitations / warnings

- Fixture ≠ live SEC download until identity is configured and fixtures re-captured
- Sprint 1 scope only: AAPL / revenue / annual / 10 years
- Ambiguous conflicting facts are excluded (no guessing)
- Success-path fixture response has empty `warnings[]` (warning list UI only appears when present)
- Local NuGet package folder under `backend/.nuget-packages`
- Pre-existing hydration warning in landing / StepRail (unrelated to Sprint 1 Apple path)

### 18. Review before Sprint 2

- Capture real Apple Company Facts / Submissions with a valid User-Agent and replace fixtures
- Confirm whether `PartiallySupported` should surface for informational warnings vs only hard ambiguity
- Clean hydration warning in StepRail / Header later
- Decide persistence for Apple thesis observations (still session-only)

**Stop here — Sprint 2 not started. No commit / push / deploy performed for this delivery.**
