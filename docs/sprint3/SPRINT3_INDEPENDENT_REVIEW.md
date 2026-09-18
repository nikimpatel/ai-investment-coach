# Sprint 3 Independent Review — AI Investment Coach (Cash Flow & Balance Sheet)

**Reviewer role:** Independent verification (review only — no production fixes)  
**Reviewed:** 2026-08-06 (post-merge, fresh)  
**Canonical repo:** `C:\PersistentDev\ai-investment-coach` → junction to `C:\PersistentDev\ai-investment-coach-gh`  
**Git HEAD:** `946a8dd62d26b19acc5141dc6b2400c4455f3a9a` (`main`, up to date with `origin/main`)  
**Includes:** `fcae609` (*Merge pull request #9* — Sprint 3 implementation) and `93ec5ed` / PR #10 verification evidence  
**kWatch:** Not in a kWatch repo (`C:\PersistentDev\kWatch.rules.md` missing)

> **Supersedes** the pre-implementation `SPRINT3_INDEPENDENT_REVIEW.md` that recorded **Not approved** because Sprint 3 was absent on `main` at `d40cba4`. That earlier verdict is obsolete. This document is the authoritative post-merge independent review.

**Verdict definitions used**

| Verdict | Meaning |
| --- | --- |
| **Approved** | Sprint claims met; no blocking defects; residual items trivial |
| **Approved with minor follow-up** | Sprint claims met; no blocking defects; documented non-blocking follow-ups remain |
| **Not approved** | One or more blocking defects prevent treating Sprint 3 as complete |

---

## 1. Overall verdict

**Approved with minor follow-up**

Sprint 3 cash-flow and balance-sheet metrics are implemented end-to-end on `main`, independently exercised via fixture API, automated tests, live SEC (with identity loaded into process env), frontend build, and browser UI. Deterministic formulas for FCF, cash conversion, FCF margin, and net debt match API outputs for sampled years. CapEx is positive spend. Total Debt uses three non-overlapping interest-bearing components and is far below total liabilities. Sprint 1/2 baselines (including Diluted EPS split rules) remain intact.

No blocking defects found. Residual process/UI polish items are listed under non-blocking follow-ups.

**Sprint 3 may close. Sprint 4 planning may begin.**

---

## 2. Executive summary

Independent inspection of `main` @ `946a8dd` (after PR #9 merge) confirms:

- Allowlisted Sprint 3 metrics: `operating-cash-flow`, `capital-expenditure`, `free-cash-flow`, `cash-and-equivalents`, `total-debt`.
- Duration vs instant normalization; CapEx positive-spend convention; FCF = OCF − CapEx; Total Debt = CP + LTD current + LTD noncurrent; relationships for cash conversion, FCF margin, and net debt/net cash.
- Fixture provenance documented; live concept captures align with fixture FY2025 values; live SEC integration tests **actually** hit SEC when `SEC__ApplicationName` / `SEC__ContactEmail` are present as **environment variables** (User Secrets alone do not enable the live suite — see §17 / follow-ups).
- Frontend groups Performance / Cash generation / Financial position; cash & financial health section; thesis observation flow remains educational (no Buy/Sell/Hold recommendation).
- Backend: restore/build/test **96 passed**. Frontend: typecheck/lint/build **exit 0** (no unit-test script). Cache Miss→Hit verified for distinct metric keys.

---

## 3. Scope claimed vs verified

| Claimed Sprint 3 item | Independent result |
| --- | --- |
| Operating Cash Flow (duration) | **Confirmed** — 10 FY (FY2016–FY2025), USD, 10-K, accession traced |
| CapEx (duration, positive spend) | **Confirmed** — all ≥ 0; concept `PaymentsToAcquirePropertyPlantAndEquipment` |
| Free Cash Flow (derived non-GAAP) | **Confirmed** — requestable; formula + 2 SEC inputs per point |
| Cash & Equivalents (instant FY-end) | **Confirmed** — instant (no period start); FY-end balances |
| Total Debt (derived components) | **Confirmed** — CP + LTD current + LTD noncurrent; not liabilities |
| Cash Conversion / FCF Margin / Net Debt | **Confirmed** — recalculated from API inputs for FY2016/2020/2025 |
| Apple only, SEC EDGAR, annual, ≤10 FY, USD, deterministic, educational | **Confirmed** |
| Out-of-scope exclusions (prices, EV, auth, DB, LLM analysis, Buy/Sell/Hold, other issuers, etc.) | **Confirmed** — not added |

**Distinction:** Sprint 3 is **implemented and documented**; residual gaps are process/polish only (see §22–23).

---

## 4. Evidence index

| Artifact | Path |
| --- | --- |
| This review | `docs/sprint3/SPRINT3_INDEPENDENT_REVIEW.md` |
| Implementation report (not overwritten) | `docs/sprint3/SPRINT3_IMPLEMENTATION_REPORT.md` |
| API probe summary | `docs/sprint3/_independent_api_probe_summary.json` |
| Per-metric API responses | `docs/sprint3/_independent_api_*.json` |
| Fixture vs live concepts | `docs/sprint3/_independent_fixture_vs_live_concepts.json` |
| Dotnet restore/build/test logs | `docs/sprint3/_independent_dotnet-*.txt` |
| Live SEC test log | `docs/sprint3/_independent_live-sec-test.txt` |
| Frontend typecheck/lint/build | `docs/sprint3/_independent_npm-*.txt` |
| Live concept captures (gitignored) | `docs/sprint3/_live_concepts/` |

Note: `_independent_*` is gitignored; the review markdown itself is trackable.

---

## 5. Confirmed claims vs not confirmed

### Confirmed

- PR #9 Sprint 3 implementation is on `main` (HEAD also includes PR #10 verification chore).
- All five Sprint 3 metrics return 10 annual Apple points (FY2016–FY2025) in fixture mode.
- CapEx positive; FCF = OCF − CapEx; Total Debt three-component sum; Net Debt = Debt − Cash with `isNetCash` when negative.
- Filing traceability (concept, form, accession, period) retained on direct points and derived inputs.
- Live SEC (env-enabled): 11/11 passed in ~12s wall time for the suite.
- Sprint 1 revenue + Sprint 2 multi-metric / Diluted EPS split comparability intact (API + UI).
- No secrets printed; no frontend-trusted `userId`/`agencyId`; educational framing preserved.

### Not confirmed / caveats (non-blocking)

- Live suite does **not** auto-load .NET User Secrets; without env vars it early-`return`s and still reports **Passed** (not Skipped). This review’s live pass used explicit env injection.
- Cursor browser resize to ~390px did not produce a fully isolated narrow layout of the outer marketing page; Sprint 3 UI was verified via a11y snapshots inside the prototype shell (phone-framed) plus source (`flex-wrap`, overflow handling).
- No frontend automated unit/e2e test script exists in `package.json`.

---

## 6. Implemented vs documented vs incomplete vs out-of-scope

| Category | Assessment |
| --- | --- |
| Implemented | Full Sprint 3 metric pipeline, relationships, fixture, tests, frontend groups/health section, thesis observation |
| Documented | `SPRINT3_IMPLEMENTATION_REPORT.md`, `backend/fixtures/FIXTURE_README.md`, allowlist descriptions/formulas |
| Incomplete (non-blocking) | Live-test skip semantics; optional screenshot pack; metric button a11y label spacing |
| Out of scope (correctly absent) | Other companies, quarterly/TTM, prices/EV, valuation, peers, ratings, auth, DB, brokerage, paid providers, LLM analysis, Buy/Sell/Hold |

---

## 7. Architecture findings

- **Allowlist:** `SupportedMetrics` encodes period type (duration/instant), CapEx `NormalizeToPositiveMagnitude`, FCF/TotalDebt derivation metadata.
- **Normalizer:** `XbrlKpiNormalizer` shared Sprint 1–3 path; instant rejects duration-tagged facts and non-10-K forms; CapEx applies `Math.Abs` + `CASH_OUTFLOW_SIGN_NORMALIZED`.
- **Calculators:** `CashFlowDebtCalculator` (FCF, debt, ratios, net debt); Sprint 2 `MarginCalculator` unchanged.
- **Service:** `FinancialHistoryService.BuildSprint3ContextAsync` loads OCF/CapEx/cash/revenue/NI + three debt components, builds relationships, caches by `SYMBOL|metric|period|years`.
- **API:** DTOs expose `relationships`, `isDerived`, `isNonGaap`, `formula`, per-point `inputs`.
- **Frontend:** `APPLE_METRIC_GROUPS` + cash health region; Next.js proxy keeps SEC User-Agent on backend.
- **AI:** No AI involvement in numeric outcomes (deterministic only).

---

## 8. Metric findings

| Metric | Years | FY2025 value (fixture API) | Notes |
| --- | --- | --- | --- |
| Operating Cash Flow | 10 | 111,482,000,000 | Concept `NetCashProvidedByUsedInOperatingActivities`; FY2016 uses ContinuingOperations own-period fallback in design/tests |
| Capital Expenditure | 10 | 12,715,000,000 | All points ≥ 0 |
| Free Cash Flow | 10 | 98,767,000,000 | Derived; matches 111,482 − 12,715 |
| Cash & Equivalents | 10 | 35,934,000,000 | Instant FY-end |
| Total Debt | 10 | 98,657,000,000 | 7,979 + 12,350 + 78,328 = 98,657 (billions USD) |

Status often `PartiallySupported` because informational warnings (`OWN_PERIOD_PREFERRED`, `COMPARATIVE_ONLY`, CapEx/TotalDebt convention notes) map to that status — not because history is incomplete.

---

## 9. SEC concepts

| Product metric | Concept(s) | Verified |
| --- | --- | --- |
| OCF | `NetCashProvidedByUsedInOperatingActivities` (+ ContinuingOperations fallback) | Yes |
| CapEx | `PaymentsToAcquirePropertyPlantAndEquipment` | Yes (positive in Apple facts) |
| Cash | `CashAndCashEquivalentsAtCarryingValue` | Yes |
| Total Debt components | `CommercialPaper`, `LongTermDebtCurrent`, `LongTermDebtNoncurrent` | Yes |
| Explicitly unused | `Liabilities` (FY2025 live = 285,508,000,000 ≫ debt) | Confirmed unused |

---

## 10. Duration vs instant

- Flow metrics (OCF, CapEx, FCF): require period start; annual day-count gate ~350–380 days; 10-Q rejected.
- Instant metrics (cash, debt components): reject facts with period start; FY-end instants only.
- Unit tests cover instant 10-Q rejection and CapEx sign flip.

---

## 11. CapEx sign convention

- Product: **positive cash spent**.
- Fixture/live Apple values already positive for FY2016–FY2025.
- Normalizer: `NormalizeToPositiveMagnitude` + warning `CASH_OUTFLOW_SIGN_NORMALIZED` when source negative.
- Service warning `CAPEX_POSITIVE_SPEND_CONVENTION` present on Sprint 3 responses.
- FCF subtracts positive CapEx (verified).

---

## 12. Free Cash Flow

- Formula: `Free Cash Flow = Operating Cash Flow − Capital Expenditure`.
- `isDerived` / `isNonGaap` true; each point has two SEC input traces (OCF + CapEx) with accessions.
- Independent recalc FY2016/2020/2025: **exact match**.

---

## 13. Total Debt

- Formula: `Commercial Paper + Current Term Debt + Noncurrent Term Debt`.
- Components non-overlapping for Apple; sparse `LongTermDebt` not mixed in; **never** total liabilities.
- FY2025 live concept sum equals API; liabilities ~2.9× larger — confirms no liabilities misuse.
- Each Total Debt point carries three input traces.

---

## 14. Derived relationships

Independent recalculation from exact API values (`_independent_api_probe_summary.json`):

| Year | FCF match | Cash Conv match | FCF Margin match | Net Debt match | isNetCash |
| --- | --- | --- | --- | --- | --- |
| FY2016 | Yes | Yes | Yes | Yes (66,548m) | false |
| FY2020 | Yes | Yes | Yes | Yes (74,420m) | false |
| FY2025 | Yes | Yes | Yes | Yes (62,723m) | false |

Cash conversion unavailable when NI ≤ 0 (unit-tested). Net cash labeling when Debt − Cash < 0 (unit-tested).

---

## 15. Datasets / evidence refs

- Fixture README documents Sprint 3 revalidation (2026-08-06) from authentic SEC company-concept captures.
- Local `_live_concepts/*.json` cross-check: FY2025 OCF/CapEx/Cash/CP/LTD match fixture API; FY2016 primary OCF lacks own-period (comparative only); ContinuingOperations own-period = 65,824,000,000.
- No invented history detected in reviewed paths.

---

## 16. API contracts

Exercised on `http://localhost:5080` (fixture mode):

- `GET /api/health` → ok  
- `GET /api/companies/AAPL/financial-history?metric={m}&period=annual&years=10` for:  
  `operating-cash-flow`, `capital-expenditure`, `free-cash-flow`, `cash-and-equivalents`, `total-debt`, `revenue`, `diluted-eps`, `net-income`  
- Responses include points, warnings, relationships (Sprint 3), derived flags/formula/inputs as applicable.
- Diluted EPS: 8 points FY2018–FY2025; split warning codes present; no FY2016/FY2017.

---

## 17. Cache

- Key format: `AAPL|{metric}|annual|10` (`IFinancialDataCache.BuildKey`).
- Observed **Miss → Hit** on second call for `cash-and-equivalents` and `total-debt` (fresh keys after warm server).
- Separate keys for OCF vs FCF vs cash vs debt confirmed (independent cache statuses; service logs `Cache hit for AAPL|operating-cash-flow|annual|10`).
- Revenue was already warm (Hit/Hit) in this session — not a failure of separation.

---

## 18. Frontend — desktop

Browser MCP on `http://localhost:3000/#prototype`:

- Apple (SEC) tab loads fixture data.
- Metric groups: Performance / Cash generation / Financial position with all five Sprint 3 controls.
- Free Cash Flow: non-GAAP description, formula, FY2016 $53.09b → FY2025 $98.77b, data notes for CapEx convention and Total Debt components.
- Cash generation & financial health: FCF, Cash Conversion 144.1%→99.5%, FCF Margin 24.6%→23.7%, Net debt $66.55b→$62.72b.
- Educational copy: “not a buy, sell, or hold signal”; thesis observation not auto-asserted as investment proof.

---

## 19. Frontend — ~390px mobile

- Prototype shell is phone-framed; Sprint 3 controls use `flex-wrap` / overflow patterns suitable for narrow viewports.
- Browser was resized to 390×844; a11y tree still exposed all Sprint 3 metric buttons and FCF/EPS content.
- Limitation: Cursor IDE browser chrome did not produce a clean isolated 390px screenshot of only the finance panel (outer page still visible). Functional mobile usability of the prototype controls was still confirmed via interactive a11y snapshots.

---

## 20. Accessibility

- Metric selector uses `role="group"` / `aria-pressed` / labelled regions.
- Chart/Table tabs: `role="tab"` / `aria-selected`.
- Accessible text alternatives expose full annual series for screen readers.
- Status regions for loading/errors.
- Minor: button accessible name shows awkward spacing `Free Cash Flow (derived , non-GAAP )` — cosmetic.

---

## 21. Explanations & thesis

- Trend summaries and “Questions to sit with” remain interpretive/educational.
- Cash health section explains non-GAAP FCF and net debt/net cash presentation.
- Thesis: user chooses Supports/Weakens/Neutral; “Add to thesis” disabled until relationship chosen; copy states observation is not proof of a good investment.
- No AI-generated investment conclusions treated as fact.

---

## 22. Fixtures

- Extended reduced Company Facts include Sprint 3 concepts with authentic accessions/dates.
- README documents capture method and CapEx/FCF/Total Debt conventions.
- Quarterly samples retained to prove rejection.

---

## 23. Live SEC verification result

| Mode | Result |
| --- | --- |
| User Secrets present (keys only; values not printed) | Yes |
| First `dotnet test --filter LiveSec` without env injection | **False “Passed” in ~56ms** — early return, not live traffic |
| Re-run with secrets copied to `SEC__ApplicationName` / `SEC__ContactEmail`, `SEC__UseFixtureData=false` | **Passed 11 / Failed 0 / Skipped 0**, suite duration ~12s (honest live pass) |

Live suite asserts Apple company facts contain Sprint 3 concepts and financial-history returns 10 years (8 for Diluted EPS with split rules).

---

## 24. Fixture vs live diffs

FY2025 live concept captures vs fixture API: **no material value diffs** for OCF, CapEx, Cash, debt components, FCF, Total Debt. Liabilities present in live captures but unused by product (expected).

---

## 25. Security / scope

- No real SEC email / User-Agent values in tracked sources (examples only).
- `_independent_*` and `_live_concepts/` gitignored.
- No `userId` / `agencyId` in frontend.
- Scope discipline held; Sprint 4 features not introduced.

---

## 26. Sprint 1 regression

- Revenue API: Success, 10 points FY2016–FY2025, FY2025 = 416,161,000,000.
- Harborline demo still revenue-only fictional path.
- Backend offline suite includes Sprint 1 golden paths (within 96 passed).

---

## 27. Sprint 2 regression (Diluted EPS)

- API: PartiallySupported, 8 points FY2018–FY2025: 2.98 … 7.46; split warning codes present; no FY2016/FY2017; no pre-split 8.31/11.89/11.91 values.
- UI: Diluted EPS observation and data notes show split-adjusted comparative preference and exclusions.
- Margins still shown alongside Apple SEC responses.

---

## 28. Exact commands / results

### Backend (`backend/`)

| Command | Result |
| --- | --- |
| `dotnet restore` | Exit 0 |
| `dotnet build` | Exit 0; 0 warnings / 0 errors |
| `dotnet test` | **Passed 96 / Failed 0 / Skipped 0** |
| Live SEC (env-enabled filter `LiveSec`) | **Passed 11 / Failed 0 / Skipped 0** (~12s) |

### Frontend (repo root)

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0 (Next.js 16.2.12); advisory multiple-lockfiles warning |
| Unit/e2e tests | **None configured** in `package.json` |

### API

Fixture API on port **5080**; all listed metrics exercised; recalculation recorded in `_independent_api_probe_summary.json`.

---

## 29. Blocking defects

**None.**

---

## 30. Non-blocking follow-ups

1. **LiveSec skip semantics:** When SEC identity is missing, tests should `Skip` (or fail closed), not silent `return` as Passed. Document that User Secrets alone do not enable the suite — env vars (or test host config) are required.
2. **Accessible name spacing** on derived metric buttons (`derived , non-GAAP`).
3. **Next.js turbopack** warning about parent `package-lock.json` vs repo lockfile — set `turbopack.root` or remove stray lockfile.
4. Optional committed desktop/~390 screenshot pack for Sprint 3 UI.
5. Optional: clarify UX when status is `PartiallySupported` solely due to informational OWN_PERIOD / convention warnings despite full 10-year series.

---

## 31. Optional improvements

- Align live-test configuration with `dotnet user-secrets` automatically in Development test host.
- Table-row expand demos in automated UI tests for derived input traces.
- Consider anchoring Total Debt year set on the intersection of all three components (Apple-safe today; more robust later).

---

## 32. Files created / updated by this review

| Action | Path |
| --- | --- |
| **Overwritten** | `docs/sprint3/SPRINT3_INDEPENDENT_REVIEW.md` (this file; supersedes pre-implementation Not-approved review) |
| **Refreshed evidence** | `docs/sprint3/_independent_*` (dotnet/npm logs, API JSON, probe summary, fixture-vs-live) |
| **Not modified** | `docs/sprint3/SPRINT3_IMPLEMENTATION_REPORT.md` |
| **Not modified** | Production code, tests, fixtures |

---

## 33. Close-out decisions

| Question | Answer |
| --- | --- |
| May Sprint 3 close? | **Yes** |
| May Sprint 4 planning begin? | **Yes** |
| Production code changed by this review? | **No** |

---

*End of post-merge Sprint 3 independent review.*
