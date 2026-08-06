# Sprint 3 Implementation Report — Cash Flow & Balance Sheet Metrics

**Date:** 2026-08-06  
**Branch:** `feat/sprint3-cash-debt-metrics`  
**Canonical repo:** `C:\PersistentDev\ai-investment-coach`  
**Status:** Implemented end-to-end on top of Sprint 2 `main` (prior independent review correctly found Sprint 3 absent).

---

## 1. Scope completed

| Item | Done |
| --- | --- |
| Operating Cash Flow (duration) | Yes |
| Capital Expenditure (duration, positive spend) | Yes |
| Free Cash Flow (derived non-GAAP, requestable) | Yes |
| Cash & Equivalents (instant FY-end) | Yes |
| Total Debt (derived components, not liabilities) | Yes |
| Cash Conversion / FCF Margin / Net Debt (relationships) | Yes |
| Fixture extended from authentic SEC evidence | Yes |
| Backend offline + live opt-in tests | Yes |
| Frontend metric groups + cash/health section | Yes |
| Thesis evidence via existing observation flow | Yes |
| Sprint 1/2 regression (incl. Diluted EPS splits) | Yes |

Out of scope excluded: other companies, quarterly/TTM, prices, EV, valuation, forecasts, peers, ratings, auth, DB, brokerage, paid providers, LLM analysis, Buy/Sell/Hold.

---

## 2. CapEx sign convention

- SEC concept: `PaymentsToAcquirePropertyPlantAndEquipment`.
- Apple Company Facts store CapEx as **positive** amounts for FY2016–FY2025.
- Product convention: CapEx is always **positive cash spent**.
- If a negative outflow appears, normalizer applies `Math.Abs` and emits `CASH_OUTFLOW_SIGN_NORMALIZED`.
- Free Cash Flow = Operating Cash Flow − CapEx (positive).

---

## 3. Total Debt approach

**Derived (not a single reliable direct total-debt concept across the window).**

```
Total Debt = CommercialPaper + LongTermDebtCurrent + LongTermDebtNoncurrent
```

- Components are compatible and non-overlapping for Apple.
- Sparse `LongTermDebt` equals current + noncurrent term debt only (excludes commercial paper) and is **not** mixed into the sum.
- **Never** uses `Liabilities` / total liabilities.

---

## 4. Years of coverage (fixture mode)

| Metric | Years | Status note |
| --- | --- | --- |
| Operating Cash Flow | FY2016–FY2025 (10) | FY2016 via ContinuingOperations own-period fallback |
| Capital Expenditure | FY2016–FY2025 (10) | Positive spend |
| Free Cash Flow | FY2016–FY2025 (10) | Derived with input traces |
| Cash & Equivalents | FY2016–FY2025 (10) | Instant FY-end |
| Total Debt | FY2016–FY2025 (10) | Three-component sum |
| Diluted EPS (regression) | FY2018–FY2025 (8) | Split rules unchanged |

---

## 5. Architecture touchpoints

- `SupportedMetrics` allowlist + period type (duration/instant) + derivation metadata
- `XbrlKpiNormalizer` instant path + CapEx sign normalization
- `CashFlowDebtCalculator` for FCF, total debt, cash conversion, FCF margin, net debt
- `FinancialHistoryService` Sprint 3 pipeline + relationships on responses
- API DTOs/mapper: `relationships`, `isDerived`, `isNonGaap`, `formula`, per-point `inputs`
- Frontend: Performance / Cash generation / Financial position groups; cash & financial health section
- Fixture + `FIXTURE_README.md` + concept mapping docs

---

## 6. Verification

### Backend (`backend/`)

| Command | Result |
| --- | --- |
| `dotnet restore` | Exit 0 |
| `dotnet build` | Exit 0; 0 warnings / 0 errors |
| `dotnet test` | **Passed 96 / Failed 0 / Skipped 0** |
| Live SEC (`LiveSecIntegrationTests` with User Secrets; values not printed) | **Passed 11 / Failed 0 / Skipped 0** |

### Frontend (repo root)

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; production bundle and static generation passed |

---

## 7. Screenshots

Manual browser verification used the running fixture API plus the Next.js development server:

- Apple (SEC) loaded all three selector groups and all five Sprint 3 metric controls.
- The cash generation & financial health section displayed FCF, Cash Conversion, FCF Margin, and Net Debt.
- Selecting Free Cash Flow showed the non-GAAP / derived description, formula, 10-year chart/table data, and thesis observation text.
- Expanding a table row displayed both traced SEC inputs with concept, value, and accession.
- Desktop and narrow viewport checks completed. Session screenshots were captured; repository image artifacts were intentionally not added.

---

## 8. Security / scope check

- No secrets in tracked files or API responses.
- No frontend-trusted `userId` / `agencyId`.
- No future-sprint features added early.
- Pre-implementation `SPRINT3_INDEPENDENT_REVIEW.md` left untracked; generated `_independent_*` artifacts remain gitignored.

---

## 9. Follow-ups (non-blocking)

- Optional UI screenshot pack for desktop + ~390px.
- Next independent review after merge.
- Do not start Sprint 4 until independent review approves Sprint 3.
