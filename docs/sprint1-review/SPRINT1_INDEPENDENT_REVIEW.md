# Sprint 1 Independent Review — Ten-Year Financial Performance Explorer (Apple SEC PoC)

**Reviewer role:** Independent verification (do not assume `SPRINT1_FINAL_REPORT.md` is correct)  
**Reviewed:** 2026-08-04  
**Project:** `ai-investment-coach`  
**Evidence preserved:** `SPRINT1_FINAL_REPORT.md` left unchanged  

---

## 1. Overall verdict

**Approved with minor follow-up**

Fixture-mode Sprint 1 is complete, deterministic, and consistent across API / chart / table / summary. Live SEC identity is not configured, so authentic EDGAR recapture was not run. Fixture provenance is **credible but live recapture required** (not invented for test-passing; documented as constructed SEC-shaped evidence with publicly consistent Apple 10-K revenue figures).

---

## 2. Executive explanation

The isolated `TenYearExplorer` .NET 8 backend + Next.js Finance toggle deliver exactly ten Apple annual revenue points (FY2016–FY2025) from the saved Company Facts fixture through documented normalization rules. Independent Node CAGR/YoY math matches the API. Harborline Sprint 0 fictional path still works. Automated backend (27/27) and frontend typecheck/lint/build all passed. The remaining gate before treating the series as *live-SEC-verified* is configuring a real identifying User-Agent and re-capturing fixtures.

**Critical question answer:** Every displayed Apple Revenue value can be reproduced from the **saved fixture** through documented deterministic selection rules (**verified-from-fixture**). Reproduction from **authentic live SEC evidence** was **not verified** in this environment (identity unset; no fake User-Agent used).

---

## 3. AC matrix

| AC / concern | Result | Evidence |
|---|---|---|
| Architecture separation & testability | **Pass** | Api / Application / Domain / Infrastructure + xUnit; abstractions registered in DI |
| Scope: Apple / revenue / annual / 10y only | **Pass** | Service rejects other symbol/metric/period/years; UI KPI Revenue-only |
| Harborline fictional preserved | **Pass** | Toggle + invented AUD series; browser confirmed disclaimer |
| Company identity AAPL / CIK 0000320193 | **Pass** | API `symbol=AAPL`, `cik=0000320193`, `company.name=Apple Inc.` |
| Revenue concept priority | **Pass** | Documented + coded; all 10 selected years use priority-1 concept |
| Annual normalization (350–380 days; reject 10-Q) | **Pass** | Normalizer + fixture includes quarterly rows that are rejected |
| Exactly 10 chronological annual periods | **Pass** | API + golden test + UI a11y values |
| No quarterly in output | **Pass** | All forms `10-K`; durations 363/370 days |
| YoY / CAGR / extremes correct | **Pass** | Independent Node recalc matches API |
| Frontend displays backend calcs (Apple) | **Pass** | `buildAppleSummarySentences` uses `data.summary` / `data.points` |
| API contract + result states | **Pass** | 200 Success; 400 UnsupportedMetric verified live |
| No secrets in client payload | **Pass** | Response keys have no ApplicationName/ContactEmail/User-Agent |
| Cache Miss then Hit; key dimensions | **Pass** | Key `AAPL\|revenue\|annual\|10`; Hit on 2nd call; failures not cached (unit) |
| Chart/table/API same series | **Pass** | Same `points[]`; browser a11y lists exact API values |
| Error/warning states present | **Pass** | InvalidConfiguration / ProviderUnavailable / Unsupported / InsufficientHistory UI |
| Sprint 0 / thesis regression | **Pass** | Harborline path + observation add/remove intact |
| Automated checks | **Pass** | 27 backend tests; typecheck/lint/build exit 0 |
| Live SEC verification | **Not verified** | SEC identity env unset; live test no-ops as Pass |
| Fixture provenance | **Partial** | Credible SEC-shaped constructed fixture; live recapture required |
| Screenshots / ~390 UX | **Pass** | Prior screenshots + live browser at Finance toggle; phone-frame prototype |

---

## 4. Architecture findings

**Backend location:** Option A — `ai-investment-coach/backend` (correct; Agency CFO under `Learning/backend` is Clerk/EF/Postgres coupled).

| Layer | Responsibility |
|---|---|
| `TenYearExplorer.Api` | Controllers, DTO mapping, HTTP status mapping, CORS |
| `TenYearExplorer.Application` | Options, normalizer, calculator, history service, abstractions |
| `TenYearExplorer.Domain` | Models / enums |
| `TenYearExplorer.Infrastructure` | Live SEC client, fixture client, facts provider, memory cache |
| `TenYearExplorer.Tests` | Offline xUnit + opt-in live fact |

Abstractions present: `ISecEdgarClient`, `IFinancialFactsProvider`, `IXbrlKpiNormalizer`, `IFinancialMetricsCalculator`, `IFinancialHistoryService`, `IFinancialDataCache`.

Default config: `SEC:UseFixtureData=true`. Live client refuses requests without identification. Frontend proxies via `GET /api/companies/[symbol]/financial-history` → `http://localhost:5080` (SEC User-Agent stays on .NET only).

No PostgreSQL, Clerk, OpenAI, or EF Core in this backend.

Minor hygiene: template `Class1.cs` leftovers may remain under Domain/Application/Infrastructure (non-blocking).

---

## 5. SEC fixture provenance verdict

**Classification: Credible but live recapture required**

| Factor | Finding |
|---|---|
| Documented origin endpoints | Yes — Company Facts + Submissions for CIK0000320193 |
| Capture date | Documented 2026-08-04 |
| Live capture performed? | **No** — README states blocked; constructed/reduced SEC-shaped JSON |
| Structure | Matches Company Facts shape (`facts.us-gaap.<concept>.units.USD[]`) |
| Intentional test rows | 10-Q / Q4 ~90-day + comparative prior-year facts included |
| Values | Align with well-known Apple 10-K net sales for FY2016–FY2024; FY2025 consistent with series |
| Blocks approval? | **No** — per review standard, missing live identity + credible fixture ⇒ approve with minor follow-up |

**Not** classified as Verified (no authentic live download). **Not** Unverifiable/invented (documented construction, plausible accessions, deterministic pipeline).

---

## 6. Revenue mapping / selection rules

**Priority (internal metric `revenue`):**

1. `RevenueFromContractWithCustomerExcludingAssessedTax` (ASC 606 / Apple primary)
2. `Revenues`
3. `SalesRevenueNet`

**Acceptance:** USD; forms `10-K` / `10-K/A`; `fp=FY` when present; period start required; duration 350–380 days; period-end ≤ as-of; FY label from **period-end year** (not `fy` alone).

**Selection:** Group by period-end; prefer own-period (`ReportedFiscalYear == period-end year`) over later comparatives; prefer higher-priority concept; prefer `10-K/A` then earlier filed; conflicting same-concept values → exclude + warning (no guessing).

**Selected concept for all 10 years in golden series:** `RevenueFromContractWithCustomerExcludingAssessedTax`.

**Fixture note:** `SalesRevenueNet` exists but has empty `USD[]` — priority-3 fallback not exercised by golden fixture (covered by unit test `Prefers_HigherPriority_Concept`).

---

## 7. Complete selected Apple dataset (verified-from-fixture)

Source record location: `backend/fixtures/apple-company-facts-reduced.json`  
Concept array: `facts.us-gaap.RevenueFromContractWithCustomerExcludingAssessedTax.units.USD`  
Classification for all rows below: **verified-from-fixture** (not live).

| FY | Start | End | Days | Revenue (USD) | Unit | Concept | Form | Filed | Accession |
|---|---|---|---:|---:|---|---|---|---|---|
| FY2016 | 2015-09-27 | 2016-09-24 | 363 | 215,639,000,000 | USD | RevenueFromContractWithCustomerExcludingAssessedTax | 10-K | 2016-10-26 | 0001628280-16-020309 |
| FY2017 | 2016-09-25 | 2017-09-30 | 370 | 229,234,000,000 | USD | same | 10-K | 2017-11-03 | 0000320193-17-000070 |
| FY2018 | 2017-10-01 | 2018-09-29 | 363 | 265,595,000,000 | USD | same | 10-K | 2018-11-05 | 0000320193-18-000145 |
| FY2019 | 2018-09-30 | 2019-09-28 | 363 | 260,174,000,000 | USD | same | 10-K | 2019-10-31 | 0000320193-19-000119 |
| FY2020 | 2019-09-29 | 2020-09-26 | 363 | 274,515,000,000 | USD | same | 10-K | 2020-10-30 | 0000320193-20-000096 |
| FY2021 | 2020-09-27 | 2021-09-25 | 363 | 365,817,000,000 | USD | same | 10-K | 2021-10-29 | 0000320193-21-000105 |
| FY2022 | 2021-09-26 | 2022-09-24 | 363 | 394,328,000,000 | USD | same | 10-K | 2022-10-28 | 0000320193-22-000108 |
| FY2023 | 2022-09-25 | 2023-09-30 | 370 | 383,285,000,000 | USD | same | 10-K | 2023-11-03 | 0000320193-23-000106 |
| FY2024 | 2023-10-01 | 2024-09-28 | 363 | 391,035,000,000 | USD | same | 10-K | 2024-11-01 | 0000320193-24-000123 |
| FY2025 | 2024-09-29 | 2025-09-27 | 363 | 416,161,000,000 | USD | same | 10-K | 2025-10-31 | 0000320193-25-000079 |

API actuals (independent call, fixture mode): `status=Success`, `sourceProvider=SEC EDGAR fixture`, `warnings=[]`, `points=10`.

---

## 8. Independent calculation results

Inputs: start `215639000000` (FY2016) → end `416161000000` (FY2025); **9 intervals**.

| Metric | Independent (Node) | API | Agree? |
|---|---|---|---|
| Unrounded CAGR | `0.07578629603195908` | `0.0757862960319591` | Yes |
| Displayed CAGR | +7.6% | UI +7.6% | Yes |
| YoY first year | null | null | Yes |
| + / − / flat years | 7 / 2 / 0 | 7 / 2 / 0 | Yes |
| Highest | FY2025 / 416161000000 | same | Yes |
| Lowest | FY2016 / 215639000000 | same | Yes |
| Largest increase (rel & abs) | FY2021 +33.3% / +91,302,000,000 | same | Yes (both absolute and % pick FY2021) |
| Largest decline (rel & abs) | FY2023 −2.8% / −11,043,000,000 | same | Yes (FY2019 abs decline smaller) |

YoY sample agreement (API == Node): FY2017 +6.3%, FY2018 +15.9%, FY2019 −2.0%, FY2021 +33.3%, FY2023 −2.8%.

---

## 9. Chart / API / table / summary consistency

- Chart and table consume the same `data.points` from one API response.
- Chart a11y text lists exact values `$215,639,000,000` … matching API.
- Summary sentences use backend `summary` (CAGR +7.6%, FY2016→FY2025, largest decline FY2023 −2.8%).
- Compact chart labels (`$215.64b` … `$416.16b`) are display formatting only; exact table values preserved.
- Prior screenshots in `docs/sprint1-review/` corroborate chart/table/source metadata.

---

## 10. API / structured-state findings

Endpoint: `GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10`

DTO fields observed: `status`, `company`, `symbol`, `cik`, `currency`, `metric`, `period`, `years`, `points[]`, `summary`, `sourceProvider`, `retrievedAtUtc`, `cacheStatus`, `warnings`, `detail`.

| Status | HTTP (mapped) | Verified this review |
|---|---|---|
| Success / PartiallySupported | 200 | Success via live API |
| UnsupportedMetric | 400 | `metric=eps` → 400 |
| InsufficientHistory | 422 | Unit/service coverage |
| ProviderUnavailable / InvalidConfiguration | 503 | Unit/service coverage; proxy returns 503 if API down |

No raw SEC payloads or identification config exposed to clients.

---

## 11. Cache test results

- Key pattern: `AAPL|revenue|annual|10` (symbol|metric|period|years).
- Independent live call sequence observed `Miss` then `Hit` (server already warm → Hit/Hit).
- UI shows `Cache Hit` beside source line.
- Unit tests: `Miss_Then_Hit_After_Set`, `Expired_Entry_Is_Miss`, `CacheHit_OnSecondCall`, `Cancellation_DoesNotCache`, `Second_Request_Reports_Cache_Hit`.
- Failures / cancellation not cached as success.

---

## 12. Frontend desktop / mobile / a11y findings

- Finance step toggle: **Harborline demo** vs **Apple (SEC)** — clear separation.
- Harborline: fictional disclaimer; AUD series; local calcs OK for demo.
- Apple: identity line, Revenue-only KPI, chart/table, source + retrieved + cache, filing expanders (10× 10-K), loading + structured error banners, thesis observation seeded from Apple (not investment conclusion).
- Chart has accessible table alternative text listing exact values.
- Keyboard: tabs use `role="tab"` / `aria-selected`.
- Live browser (~390 resize + phone-frame prototype): Apple/Harborline toggles work; table filing buttons present.
- **Labelling fix applied during review:** badge no longer always says “Live Apple SEC data” when `sourceProvider` contains `fixture` (now “Apple SEC (fixture)”).

---

## 13. Sprint 0 / thesis regression

- Harborline remains selectable and shows invented figures (`FY2016 A$142.4m` … `FY2025 A$236.8m`).
- Landing still presents Harborline as fictional walkthrough.
- Observation add/remove path retained; Apple observation notes identity preservation and non-conclusion language.
- No Sprint 2 companies/KPIs/auth/DB/AI introduced.

---

## 14. Automated command results

### Backend

```powershell
cd ai-investment-coach/backend
dotnet test TenYearExplorer.sln --verbosity normal
```

**Result:** exit **0** — **Total tests: 27, Failed: 0, Skipped: 0, Passed: 27**

All 27 tests by name:

1. `LiveSecIntegrationTests.Live_CompanyFacts_Reachable_For_Apple` *(no-ops when identity unset — reports Passed, not Skipped)*
2. `MemoryCacheTests.Expired_Entry_Is_Miss`
3. `MemoryCacheTests.Miss_Then_Hit_After_Set`
4. `SecOptionsTests.PlaceholderEmail_IsNotConfigured`
5. `SecOptionsTests.Blank_IsNotConfigured`
6. `SecOptionsTests.RealLookingValues_AreConfigured`
7. `FinancialMetricsCalculatorTests.YearOverYear_FirstYearIsNull_AndComputesRelativeChanges`
8. `FinancialMetricsCalculatorTests.Summary_CountsGrowthYears_AndExtremes`
9. `FinancialMetricsCalculatorTests.Cagr_TenValues_UsesNineIntervals`
10. `FinancialMetricsCalculatorTests.YearOverYear_PriorZero_YieldsNullRelative`
11. `FinancialMetricsCalculatorTests.Cagr_NonPositive_ReturnsNullWithReason`
12. `FinancialHistoryServiceTests.UnsupportedMetric_ReturnsStructuredStatus`
13. `FinancialHistoryServiceTests.InvalidConfiguration_WhenLiveAndMissingIdentity`
14. `FinancialHistoryServiceTests.ProviderUnavailable_OnHttpFailure`
15. `FinancialHistoryServiceTests.Cancellation_DoesNotCache`
16. `FinancialHistoryServiceTests.CacheHit_OnSecondCall`
17. `XbrlKpiNormalizerTests.Prefers_OwnPeriod_Over_LaterComparative`
18. `XbrlKpiNormalizerTests.Prefers_HigherPriority_Concept`
19. `XbrlKpiNormalizerTests.DoesNotTrust_FyAlone_WithoutAnnualDuration`
20. `XbrlKpiNormalizerTests.Rejects_QuarterlyDuration_And_10Q`
21. `XbrlKpiNormalizerTests.Selects_LatestTen_Chronological`
22. `XbrlKpiNormalizerTests.Excludes_Ambiguous_ConflictingValues`
23. `FixtureGoldenPathTests.Fixture_Produces_Exact_TenYear_Apple_Revenue_Series`
24. `ApiIntegrationTests.FinancialHistory_Returns_FrontendSafe_Dto`
25. `ApiIntegrationTests.Health_Ok`
26. `ApiIntegrationTests.Unsupported_Metric_Returns_400`
27. `ApiIntegrationTests.Second_Request_Reports_Cache_Hit`

### Frontend

```powershell
cd ai-investment-coach
npm run typecheck   # exit 0
npm run lint        # exit 0
npm run build       # exit 0 (Next.js multi-lockfile warning only)
```

No separate frontend unit/e2e suite.

---

## 15. Test-coverage gaps

| Gap | Severity |
|---|---|
| Live SEC test silently returns without `Skip` when identity missing (appears Passed) | Medium (reporting honesty) |
| No automated assertion that UI badge distinguishes fixture vs live | Low (manual + small fix applied) |
| No frontend unit tests for Apple summary copy / proxy | Low |
| Golden fixture does not exercise `SalesRevenueNet` fallback with real rows | Low (unit covers priority) |
| `PartiallySupported` path not exercised by golden fixture success path | Low |
| No automated screenshot / Playwright a11y suite | Low |
| Submissions fixture role in selection not deeply asserted beyond loadability | Low |

---

## 16. Live SEC verification result

**Not run.**

Existence check (values not printed):

| Source | `SEC__ApplicationName` | `SEC__ContactEmail` |
|---|---|---|
| Process / User / Machine env | NOT SET | NOT SET |
| `appsettings.json` / Development | empty | empty |
| `UseFixtureData` | true (default) | — |

Fake/anonymous User-Agent was **not** used.  
To enable later:

```powershell
$env:SEC__ApplicationName = "YOUR_NAME TenYearExplorer"
$env:SEC__ContactEmail = "you@example.com"
$env:SEC__UseFixtureData = "false"
dotnet test --filter Live_CompanyFacts_Reachable_For_Apple
```

Then replace fixtures with authentic downloads and re-run golden path.

---

## 17. Files inspected (high level)

- `docs/sprint1-review/SPRINT1_FINAL_REPORT.md` (evidence only; not trusted a priori)
- `backend/fixtures/FIXTURE_README.md`, `apple-company-facts-reduced.json`, `apple-submissions-reduced.json`
- `backend/docs/REVENUE_CONCEPT_MAPPING.md`, `backend/README.md`
- Application: `XbrlKpiNormalizer`, `FinancialMetricsCalculator`, `FinancialHistoryService`, `RevenueConceptMapping`, `SecOptions`
- Infrastructure: `FixtureSecEdgarClient`, `SecEdgarClient`, `DependencyInjection`, cache
- API: `CompaniesController`, `FinancialHistoryMapper`, contracts, appsettings*
- Tests: all test classes under `TenYearExplorer.Tests`
- Frontend: `FinancialPerformance.tsx`, `apple-financial-api.ts`, `apple-trend-copy.ts`, `financial-calcs.ts`, proxy route, `harborline-financials.ts`
- Screenshots: `apple-chart.png`, `apple-exact-value-table.png`, `apple-source-details-warnings.png`

---

## 18. Files changed during review

| File | Change |
|---|---|
| `src/components/prototype/FinancialPerformance.tsx` | Badge text uses fixture vs live based on `sourceProvider` (clear Sprint 1 labelling defect; small/low-risk) |

No commits, pushes, deploys. No fixture financial values modified. No Sprint 2 work.

---

## 19. Blocking defects

**None** against the fixture-credible approval standard.

Live SEC identity absence is **non-blocking** given credible fixture provenance + otherwise complete fixture-based implementation.

---

## 20. Non-blocking follow-ups

1. Configure real SEC identity; download authentic Company Facts / Submissions; replace fixtures; re-run golden + live checks.
2. Change `Live_CompanyFacts_Reachable_For_Apple` to explicit **Skip** when identity unset (avoid false Pass).
3. Confirm whether informational warnings should flip status to `PartiallySupported` in more cases.
4. Clean template `Class1.cs` leftovers if still present.
5. Address Next.js multi-lockfile / turbopack.root warning.
6. Optional: add frontend tests for Apple summary consuming backend fields only.
7. Pre-existing hydration warning in landing / StepRail (unrelated to Apple path).

---

## 21. Exact recommendation whether Sprint 2 may begin

**Yes — Sprint 2 may begin**, under the condition that **live SEC verification and fixture recapture remain an open minor follow-up** and are completed before treating Apple revenue figures as live-EDGAR-verified production evidence.

Recommended status line:

> **Approved with minor follow-up — complete live SEC verification and fixture recapture before treating the series as live-verified (and preferably before Sprint 2 data expansion depends on the same fixture pipeline).**

**STOP.** Sprint 2 not started. No commit / push / deploy performed by this review.
