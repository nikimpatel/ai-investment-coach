# Sprint 2 Implementation Report — Apple Multi-Metric Financial Performance Explorer

**Date:** 2026-08-04 (EPS split-comparability reopen: 2026-08-05)  
**Working tree:** `C:\Users\Nikita.Patel\PersistentDev\Learning\ai-investment-coach`  
**Status:** Complete with non-blocking follow-ups (Diluted EPS split basis corrected)  

---

## STEP 1 — Pre-implementation inspection (brief)

See also `docs/sprint2/STEP1_INSPECT_BRIEF.md`.

- Sprint 1 revenue-only pipeline (facts provider → annual normalizer → calculator → history cache → API → Apple UI) was preserved and generalized.
- Fixture previously contained only revenue concepts; Sprint 2 extended it from authentic live Company Facts.
- Proposed approach: one allowlist-driven metric pipeline + Company Facts cache + FY-aligned derived margins + frontend metric selector.

---

## 1. Overall result

**Complete with non-blocking follow-ups.**

Sprint 2 delivers five Apple annual metrics (Revenue, Gross Profit, Operating Income, Net Income, Diluted EPS), derived Gross/Operating/Net margins, extended API/cache, deterministic beginner explanations, thesis evidence with user-selected relationship, offline tests, and opt-in live SEC verification.

No commit / push / deploy was performed. Sprint 3 was not started.

---

## 2. Scope completed

| Item | Done |
| --- | --- |
| Revenue (Sprint 1 regression) | Yes |
| Gross Profit | Yes |
| Operating Income | Yes |
| Net Income | Yes |
| Diluted EPS (USD/shares) | Yes |
| Derived margins (gross/operating/net) | Yes |
| Metric allowlist + UnsupportedMetric | Yes |
| Generalized normalizer (single pipeline) | Yes |
| Existing endpoint extended (`metric=…`) | Yes |
| Cache keys by company/metric/period/years | Yes |
| Company Facts in-memory cache | Yes |
| Frontend metric selector + margins UI | Yes |
| Deterministic explanations (no LLM) | Yes |
| Thesis observation + user relationship | Yes |
| Fixture extended from authentic SEC | Yes |
| Offline tests | Yes (63/63 after EPS split reopen) |
| Opt-in live SEC | Yes (6/6 with User Secrets) |
| Sprint 2 report | Yes |
| Screenshots | Yes (8 PNGs; see §16) |

Out of scope deliberately excluded: other companies, quarterly/TTM, prices, valuation, forecasts, peers, brokerage, auth, DB, paid providers, LLM, buy/sell/hold, deploy/commit/push.

---

## 3. Architecture changes

1. **`SupportedMetrics` allowlist** — strongly typed metric definitions (code, label, description, value type, unit, concepts, YoY/CAGR flags, margin participation).
2. **Shared annual pipeline** — `GetFactsAsync(cik, metric)` → `NormalizeAnnual(facts, metric, …)` → calculator → history result (no duplicated per-metric pipelines).
3. **`ICompanyFactsCache` / `MemoryCompanyFactsCache`** — cache underlying Company Facts by CIK to avoid repeated SEC downloads when deriving multiple metrics/margins.
4. **`MarginCalculator`** — FY-aligned margins after normalization; percentage-point YoY; never invent Gross Profit from costs.
5. **API response extended** — metric metadata, reporting unit, display format, summary absolute/total % change, `margins` object; Sprint 1 `metric=revenue` remains valid.
6. **Frontend** — Apple metric selector, per-share formatting, compact profitability section, structured thesis evidence with required user-selected Supports/Weakens/Neutral.

---

## 4. Files added and changed

### Added (backend)

- `Application/Metrics/SupportedMetrics.cs`
- `Application/Metrics/MarginCalculator.cs`
- `Application/Abstractions/ICompanyFactsCache.cs`
- `Domain/Models/DerivedMarginSeries.cs`
- `Infrastructure/Caching/MemoryCompanyFactsCache.cs`
- Tests: `SupportedMetricsTests.cs`, `MarginCalculatorTests.cs`, `XbrlMultiMetricNormalizerTests.cs`
- Extended: `LiveSecIntegrationTests.cs`, `FixtureGoldenPathTests.cs`, `ApiIntegrationTests.cs`, etc.

### Changed (backend)

- `IFinancialFactsProvider`, `IXbrlKpiNormalizer`, `SecFinancialFactsProvider`, `XbrlKpiNormalizer`, `FinancialHistoryService`, `FinancialMetricsCalculator`
- Domain: `FinancialHistoryResult`, `FinancialHistorySummary`, `NormalizedAnnualPoint`
- API: `FinancialHistoryResponse`, `FinancialHistoryMapper`, controller docs
- `DependencyInjection.cs`, `RevenueConceptMapping.cs` (aliases), fixture JSON + `FIXTURE_README.md`, `REVENUE_CONCEPT_MAPPING.md` (now multi-metric)

### Added/changed (frontend)

- `src/lib/apple-metrics.ts`
- `src/lib/apple-financial-api.ts` (`fetchAppleFinancialHistory`)
- `src/lib/apple-trend-copy.ts`
- `src/lib/types.ts` (`PerformanceObservationEvidence`, relationship)
- `FinancialPerformance.tsx`, `ThesisBuilder.tsx`, `PrototypeApp.tsx`, harborline helpers, API proxy fallback fields
- `next.config.ts` — pin `turbopack.root` so App Router `/api/companies/...` is discovered when parent lockfiles exist

### Docs

- `docs/sprint2/STEP1_INSPECT_BRIEF.md`
- `docs/sprint2/SPRINT2_IMPLEMENTATION_REPORT.md` (this file)
- API sample captures `_api_*_call1.json`
- Local live capture `_live_companyfacts_full.json` (gitignored)

---

## 5. Supported metric definitions

| Code | Label | Value type | Unit | Display | Concepts (priority) | Margin |
| --- | --- | --- | --- | --- | --- | --- |
| `revenue` | Revenue | Monetary | USD | currency | ASC 606 → Revenues → SalesRevenueNet | — |
| `gross-profit` | Gross Profit | Monetary | USD | currency | `GrossProfit` | Gross |
| `operating-income` | Operating Income | Monetary | USD | currency | `OperatingIncomeLoss` | Operating |
| `net-income` | Net Income | Monetary | USD | currency | `NetIncomeLoss` | Net |
| `diluted-eps` | Diluted EPS | Per-share | USD/shares | per-share | `EarningsPerShareDiluted` only | — |

Unsupported codes (e.g. `ebitda`, `gross-margin` as request metric) → `UnsupportedMetric` / HTTP 400.

---

## 6. SEC concept mapping and fallback order

Researched from live Apple Company Facts CIK `0000320193` (2026-08-04):

| Metric | Present concepts | Chosen order | Notes |
| --- | --- | --- | --- |
| Revenue | ASC 606, Revenues, SalesRevenueNet | unchanged Sprint 1 | Prefer ASC 606 |
| Gross Profit | `GrossProfit` yes; `GrossProfitLoss` no | `GrossProfit` only | Prefer reported GP; do not invent from costs |
| Operating Income | `OperatingIncomeLoss` yes; `OperatingIncome` no | `OperatingIncomeLoss` | |
| Net Income | `NetIncomeLoss` yes; `ProfitLoss` no | `NetIncomeLoss` | |
| Diluted EPS | `EarningsPerShareDiluted` (`USD/shares`); basic also present | Diluted only | Never mix basic; reject monetary USD |

Shared rules preserved: 10-K/10-K/A, FY, 350–380 day duration, period-end identity (not SEC `fy` alone), own-period over comparative, structured warnings.

Full write-up: `backend/docs/REVENUE_CONCEPT_MAPPING.md`.

---

## 7. Complete ten-year selected datasets (fixture mode)

All series: FY2016 → FY2025, Apple Inc., CIK 0000320193.

### Revenue (Sprint 1 unchanged)

| FY | Value (USD) | Concept | Form | Filed | Accession |
| --- | ---: | --- | --- | --- | --- |
| FY2016 | 215,639,000,000 | RevenueFromContractWithCustomerExcludingAssessedTax | 10-K | 2016-10-26 | 0001628280-16-020309 |
| FY2017 | 229,234,000,000 | same | 10-K | 2017-11-03 | 0000320193-17-000070 |
| FY2018 | 265,595,000,000 | same | 10-K | 2018-11-05 | 0000320193-18-000145 |
| FY2019 | 260,174,000,000 | same | 10-K | 2019-10-31 | 0000320193-19-000119 |
| FY2020 | 274,515,000,000 | same | 10-K | 2020-10-30 | 0000320193-20-000096 |
| FY2021 | 365,817,000,000 | same | 10-K | 2021-10-29 | 0000320193-21-000105 |
| FY2022 | 394,328,000,000 | same | 10-K | 2022-10-28 | 0000320193-22-000108 |
| FY2023 | 383,285,000,000 | same | 10-K | 2023-11-03 | 0000320193-23-000106 |
| FY2024 | 391,035,000,000 | same | 10-K | 2024-11-01 | 0000320193-24-000123 |
| FY2025 | 416,161,000,000 | same | 10-K | 2025-10-31 | 0000320193-25-000079 |

### Gross Profit (`GrossProfit`)

| FY | Value (USD) |
| --- | ---: |
| FY2016 | 84,263,000,000 |
| FY2017 | 88,186,000,000 |
| FY2018 | 101,839,000,000 |
| FY2019 | 98,392,000,000 |
| FY2020 | 104,956,000,000 |
| FY2021 | 152,836,000,000 |
| FY2022 | 170,782,000,000 |
| FY2023 | 169,148,000,000 |
| FY2024 | 180,683,000,000 |
| FY2025 | 195,201,000,000 |

### Operating Income (`OperatingIncomeLoss`)

| FY | Value (USD) |
| --- | ---: |
| FY2016 | 60,024,000,000 |
| FY2017 | 61,344,000,000 |
| FY2018 | 70,898,000,000 |
| FY2019 | 63,930,000,000 |
| FY2020 | 66,288,000,000 |
| FY2021 | 108,949,000,000 |
| FY2022 | 119,437,000,000 |
| FY2023 | 114,301,000,000 |
| FY2024 | 123,216,000,000 |
| FY2025 | 133,050,000,000 |

### Net Income (`NetIncomeLoss`)

| FY | Value (USD) |
| --- | ---: |
| FY2016 | 45,687,000,000 |
| FY2017 | 48,351,000,000 |
| FY2018 | 59,531,000,000 |
| FY2019 | 55,256,000,000 |
| FY2020 | 57,411,000,000 |
| FY2021 | 94,680,000,000 |
| FY2022 | 99,803,000,000 |
| FY2023 | 96,995,000,000 |
| FY2024 | 93,736,000,000 |
| FY2025 | 112,010,000,000 |

### Diluted EPS (`EarningsPerShareDiluted`, USD/shares) — split-comparable series (reopened 2026-08-05)

**Defect corrected:** Prior selection preferred own-period pre-split tags (FY2016–FY2019) alongside post-split FY2020+, producing a false ~−1.2% CAGR (8.31→7.46). Apple’s 2020 Form 10-K states per-share amounts were retroactively adjusted for the 4-for-1 split.

**Rule:** Prefer later split-adjusted comparative SEC facts when own→comparative ratio matches a deterministic forward-split factor (`SPLIT_ADJUSTED_COMPARATIVE_PREFERRED`). Cut the series at the last split-scale YoY discontinuity with nearby restatement evidence rather than mixing bases. Do **not** invent values by dividing.

Company Facts supply post-split restated comparatives for FY2018–FY2019 only; FY2016–FY2017 lack post-split restatements and are **excluded** (`SPLIT_INCOMPARABLE_YEAR_EXCLUDED`). Status: `PartiallySupported` with 8 comparable years.

| FY | Value | Form | Filed | Accession | Concept | Current vs comparative |
| --- | ---: | --- | --- | --- | --- | --- |
| FY2016 | — | — | — | — | — | Excluded (no post-split SEC comparative) |
| FY2017 | — | — | — | — | — | Excluded (no post-split SEC comparative) |
| FY2018 | 2.98 | 10-K | 2020-10-30 | 0000320193-20-000096 | EarningsPerShareDiluted | Comparative (split-adjusted) |
| FY2019 | 2.97 | 10-K | 2021-10-29 | 0000320193-21-000105 | EarningsPerShareDiluted | Comparative (split-adjusted) |
| FY2020 | 3.28 | 10-K | 2020-10-30 | 0000320193-20-000096 | EarningsPerShareDiluted | Current / own-period |
| FY2021 | 5.61 | 10-K | 2021-10-29 | 0000320193-21-000105 | EarningsPerShareDiluted | Current / own-period |
| FY2022 | 6.11 | 10-K | 2022-10-28 | 0000320193-22-000108 | EarningsPerShareDiluted | Current / own-period |
| FY2023 | 6.13 | 10-K | 2023-11-03 | 0000320193-23-000106 | EarningsPerShareDiluted | Current / own-period |
| FY2024 | 6.08 | 10-K | 2024-11-01 | 0000320193-24-000123 | EarningsPerShareDiluted | Current / own-period |
| FY2025 | 7.46 | 10-K | 2025-10-31 | 0000320193-25-000079 | EarningsPerShareDiluted | Current / own-period |

Fixture comparative rows were already authentic SEC captures (not hand-edited). Revenue values unchanged.

Raw captures: `docs/sprint2/_api_*.json` (pre-fix samples may still show mixed-basis EPS; trust fixture golden test + live verification).

---

## 8. Filing metadata and selected concepts

For every point the API returns: fiscal year, period start/end, exact value, unit, concept, form, filing date, accession. Frontend expandable “10-K” disclosure shows the same fields. Diluted EPS unit is `USD/shares`. Fixture Gross/Operating/Net/EPS own-period filings largely share the same accessions as revenue for the matching FY.

---

## 9. Derived-margin calculations (fixture)

Aligned by fiscal year using exact decimal values:

| Margin | FY2016 | FY2025 | Change |
| --- | ---: | ---: | ---: |
| Gross Margin | 39.0760% | 46.9052% | +7.8292 pp |
| Operating Margin | 27.8354% | 31.9708% | +4.1354 pp |
| Net Margin | 21.1868% | 26.9151% | +5.7283 pp |

Rules: no divide when revenue is 0/missing; period-end mismatch → unavailable + warning; year-to-year margin deltas are **percentage points**.

---

## 10. Calculation evidence

| Metric | Start → End | Intervals | CAGR (unrounded) | Display ~ | +/− years |
| --- | --- | ---: | ---: | --- | --- |
| Revenue | 215.639b → 416.161b | 9 | 0.075786… | **+7.6%** | 7 / 2 |
| Gross Profit | 84.263b → 195.201b | 9 | 0.097838… | ~+9.8% | 7 / 2 |
| Operating Income | 60.024b → 133.050b | 9 | 0.092471… | ~+9.2% | 7 / 2 |
| Net Income | 45.687b → 112.010b | 9 | 0.104775… | ~+10.5% | 6 / 3 |
| Diluted EPS (split-comparable) | 2.98 → 7.46 | 7 | 0.140070… | ~+14.0% | 5 / 2 |

Formula (monetary 10y): `CAGR = (end/start)^(1/9) − 1`. Diluted EPS after split normalization uses intervals = points−1 (here 7). First YoY null. CAGR requires positive start and end (EPS-safe). Absolute change and total % change included on summary.

**Diluted EPS YoY (split-comparable):** FY2019 −0.34%; FY2020 +10.4%; FY2021 +71.0%; FY2022 +8.9%; FY2023 +0.3%; FY2024 −0.8%; FY2025 +22.7%.

Profit grew faster than revenue over this window (net-income CAGR ~10.5% vs revenue ~7.6%) — stated as a reproducible fact from returned values, not causation.

---

## 11. API examples

Existing endpoint (backward compatible):

```http
GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10
```

New metrics:

```http
GET /api/companies/AAPL/financial-history?metric=gross-profit&period=annual&years=10
GET /api/companies/AAPL/financial-history?metric=operating-income&period=annual&years=10
GET /api/companies/AAPL/financial-history?metric=net-income&period=annual&years=10
GET /api/companies/AAPL/financial-history?metric=diluted-eps&period=annual&years=10
```

Response additions: `metricLabel`, `metricDescription`, `reportingUnit`, `displayFormat`, `summary.absoluteChange`, `summary.totalPercentageChange`, `margins.{gross,operating,net}Margin`.

Statuses preserved: Success, PartiallySupported, UnsupportedMetric, InsufficientHistory, ProviderUnavailable, InvalidConfiguration.

Sample bodies: `docs/sprint2/_api_*_call1.json`.

---

## 12. Cache evidence

Observed against fixture API on `http://localhost:5080`:

| Request | First cacheStatus | Second identical | Notes |
| --- | --- | --- | --- |
| revenue | Miss | Hit | Sprint 1 behavior preserved |
| gross-profit | Miss | Hit | Separate key from revenue |
| operating-income | Miss | Hit | |
| net-income | Miss | Hit | |
| diluted-eps | Miss | Hit | |

Keys: `AAPL|{metric}|annual|10`. Failed/cancelled results not cached as success. Company Facts also cached by CIK for multi-metric derivation within TTL.

---

## 13. Fixture provenance

- Endpoint origin: `https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json` (+ submissions fixture retained).
- Capture date: **2026-08-04** using project User Secrets (values never stored in fixtures/reports).
- Revenue concepts **preserved unchanged** from Sprint 1 golden values.
- New concepts reduced from authentic live payload: `GrossProfit`, `OperatingIncomeLoss`, `NetIncomeLoss`, `EarningsPerShareDiluted` (+ intentional quarterly samples for rejection tests).
- Full live blob local-only / gitignored: `docs/sprint2/_live_companyfacts_full.json`.
- Details: `backend/fixtures/FIXTURE_README.md`.

---

## 14. Live SEC verification results

User Secrets present (`SEC:ApplicationName`, `SEC:ContactEmail`) — values **not printed**.

Commands:

```powershell
cd backend
dotnet test
# opt-in live:
$env:SEC__UseFixtureData = 'false'
# SEC__ApplicationName / SEC__ContactEmail loaded from User Secrets into env for the test process
dotnet test --filter "FullyQualifiedName~LiveSecIntegrationTests"
```

Results (2026-08-04 re-run):

- Offline suite: **59/59 passed**
- Live suite: **6/6 passed**
  - Company Facts reachable + concepts present
  - Ten-year history for revenue, gross-profit, operating-income, net-income, diluted-eps

Skipped ≠ passed: when secrets absent, live tests return early without asserting success.

---

## 15. Fixture / live differences

- Live integration tests confirmed ten FY2016–FY2025 points for all five metrics with no 10-Q leakage.
- Diluted EPS fixture response is `PartiallySupported` due to split-basis normalization (`SPLIT_ADJUSTED_COMPARATIVE_PREFERRED`, excluded FY2016–FY2017, 8 comparable years) — legitimate, not hidden.
- Revenue Sprint 1 values remain the fixture golden path; live may still differ on filing-date / comparative warning details as documented in Sprint 1 live verification (fixtures not rewritten to chase live metadata).
- EPS series includes the authentic post-split level shift; educational copy must not treat naive 9-interval CAGR as “earnings collapse.”

---

## 16. Frontend desktop / mobile results

Implemented:

- Dataset toggle Harborline / Apple (SEC)
- Apple metric selector (5 metrics, one at a time)
- Chart + table from same API payload
- Currency vs per-share formatting
- Compact profitability margins section
- Deterministic explanations + margin education lines
- Loading / error / insufficient / warning states
- No Harborline fallback on Apple failure
- Thesis evidence with required user relationship

Screenshots captured via Playwright (`docs/sprint2/_capture_screenshots.mjs`) against production FE (`npm run start` on `http://127.0.0.1:3000`) and fixture API on `http://localhost:5080`. Final capture: `appleLoaded=true`, `mobileLoaded=true`.

- `docs/sprint2/metric-selector.png` — five-metric selector (Revenue selected)
- `docs/sprint2/gross-profit-chart.png` — Gross Profit chart + ~9.8% CAGR summary
- `docs/sprint2/diluted-eps-chart.png` — Diluted EPS selected / chart path
- `docs/sprint2/profitability-margins.png` — Gross/Operating margin pp changes
- `docs/sprint2/exact-value-table.png` — exact Gross Profit table (FY2016 $84.26b)
- `docs/sprint2/sec-source-details.png` — filing / source expand
- `docs/sprint2/mobile-390.png` — 390px viewport with Gross Profit chart visible
- `docs/sprint2/warnings-state.png` — Diluted EPS OWN_PERIOD comparative notes

See `docs/sprint2/_screenshot_notes.txt` for file sizes.

---

## 17. Thesis Builder integration

- Observation text seeded from deterministic API-backed copy.
- Structured `performanceEvidence`: company, metric/margin, fiscal years, exact values, source type (fixture/live), **user-selected** relationship (`supports` | `weakens` | `neutral`).
- System does **not** auto-decide relationship; add requires user selection.
- Add / edit / remove preserved; no persistence beyond in-session prototype state.
- ThesisBuilder surfaces structured fields alongside editable text.

---

## 18. Accessibility findings

- Metric selector uses buttons with pressed state; chart/table tabs retain keyboard focus styles.
- Exact-value table remains the accessible alternative to the chart.
- Filing details expand via explicit buttons (`aria-expanded`).
- Warnings exposed in a status region.
- Remaining non-blocking: confirm focus order inside the phone-frame prototype on 390px after screenshot refresh.

---

## 19. Regression results

| Check | Result |
| --- | --- |
| Sprint 1 Apple Revenue FY2016–FY2025 values | Unchanged |
| Revenue CAGR ~7.6% (9 intervals) | Confirmed (0.075786…) |
| Fixture / live badges | Present in UI |
| Filing/source details | Present |
| Harborline fictional demo | Preserved (revenue-only) |
| Guided Research / Thesis add-edit-remove | Preserved + Sprint 2 evidence fields |
| No Buy/Sell/Hold language | Confirmed in copy |

---

## 20. Exact commands and test results

```powershell
cd C:\Users\Nikita.Patel\PersistentDev\Learning\ai-investment-coach\backend
dotnet restore
dotnet build
dotnet test
# => Passed: 63, Failed: 0  (EPS reopen 2026-08-05; evidence: docs/sprint2/_eps_fix_dotnet-test.txt)

# Live (secrets present; values not printed)
$env:SEC__UseFixtureData = 'false'
# ApplicationName/ContactEmail supplied from User Secrets to env for test host
dotnet test --filter "FullyQualifiedName~LiveSecIntegrationTests"
# => Passed: 6, Failed: 0  (evidence: docs/sprint2/_eps_fix_dotnet-live.txt)
```

```powershell
cd C:\Users\Nikita.Patel\PersistentDev\Learning\ai-investment-coach
npx tsc --noEmit
npm run lint
npm run build
# => typecheck/lint/build succeeded in Sprint 2 implementation session
```

No dedicated frontend unit-test framework was added (per scope).

---

## 21. Known limitations

1. Apple only; annual only; exactly 10 years when reliable for monetary metrics.
2. Diluted EPS: Company Facts lack post-split comparative restatements for FY2016–FY2017, so a full 10-year split-comparable series is unavailable; API returns `PartiallySupported` with FY2018–FY2025 (8 years). Values are never invented by dividing.
3. Margins are derived server-side and attached to each metric response (not separately requestable as `metric=`).
4. In-memory caches only (process-local).
5. Fixture revenue metadata may still diverge from live comparative/filing nuances (Sprint 1 known).
6. Diluted EPS educational UI callout for excluded pre-split years could be more prominent (structured warnings already returned).

---

## 22. Blocking defects

**None remaining** (including the Diluted EPS pre-/post-split mixing defect corrected 2026-08-05).

During final screenshot capture, Next.js Turbopack had inferred a parent workspace root (extra lockfile above the project), causing `/api/companies/...` to 404 in the browser. Fixed by setting `turbopack.root` in `next.config.ts`. Proxy verified `200` with Gross Profit JSON after the fix.

---

## 23. Non-blocking follow-ups

1. Optional beginner callout when Diluted EPS returns fewer than 10 years due to split-basis normalization.
2. Consider exposing margin-only observation chips as first-class thesis targets (currently metric-primary with margins in explanation).
3. Sync Learning tree to `ai-investment-coach-gh` when convenient (not done here; no commit/push).
4. Optional: change live SEC tests to explicit xUnit Skip when identity unset (early `return` still reports Passed).

---

## 24. Recommendation for independent Sprint 2 review

**Diluted EPS split reopen complete — ready for re-verification.**

Reviewers should independently:

1. Run offline `dotnet test` (expect 63).
2. With User Secrets, run live filter (expect 6; skipped ≠ passed if secrets missing).
3. Confirm revenue golden values and ~7.6% CAGR unchanged.
4. Confirm Diluted EPS is split-comparable FY2018–FY2025 (2.98→7.46, CAGR ~+14.0%), not mixed-basis 8.31→7.46.
5. Confirm margins FY alignment and percentage-point language.
6. Confirm thesis relationship is user-selected.
7. Confirm no secrets/User-Agent leakage in responses or docs.

---

## Manual regression checklist (Sprint 2)

- [x] Revenue Sprint 1 series unchanged
- [x] Monetary new metrics return 10 annual points in fixture mode; Diluted EPS returns 8 split-comparable points (`PartiallySupported`)
- [x] Margins present and coherent
- [x] Cache Miss→Hit per metric; metrics do not share entries
- [x] Unsupported metric → 400
- [x] Live SEC opt-in passed with secrets
- [x] Frontend typecheck/lint/build passed in implementation session
- [x] Harborline still fictional / revenue-only
- [x] No buy/sell/hold conclusions
- [x] Screenshot PNGs captured under `docs/sprint2/`
