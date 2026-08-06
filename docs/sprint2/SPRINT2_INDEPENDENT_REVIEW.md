# Sprint 2 Independent Review — Apple Multi-Metric Financial Performance Explorer

**Reviewer role:** Independent verification + Diluted EPS split-comparability reopen (2026-08-05)  
**Originally reviewed:** 2026-08-04  
**EPS defect reopen verified:** 2026-08-05  
**Project:** `ai-investment-coach`

**Verdict definitions used**

| Verdict | Meaning |
| --- | --- |
| **Approved** | Sprint claims met; no blocking defects; residual items trivial |
| **Approved with minor follow-up** | Sprint claims met; no blocking defects; documented non-blocking follow-ups remain |
| **Not approved** | One or more blocking defects prevent treating Sprint 2 as complete |

---

## 1. Overall verdict

**Approved with minor follow-up**

The Diluted EPS pre-/post-split mixing defect that previously produced a false ~−1.2% CAGR (FY2016 8.31 → FY2025 7.46) is **corrected**. The product now prefers later split-adjusted comparative SEC facts, excludes years lacking a reliable post-split restatement, and recalculates YoY/CAGR on the comparable FY2018–FY2025 series (~+14.0% CAGR). Sprint 1 revenue values remain unchanged. Residual follow-ups are non-blocking (Company Facts cannot supply split-adjusted FY2016–FY2017; live-test Skip reporting honesty).

---

## 2. Executive explanation

Sprint 2’s multi-metric pipeline remains sound for revenue / gross / operating / net income. The reopen focused solely on Diluted EPS comparability across Apple’s August 2020 4-for-1 split. Independent inspection of Company Facts shows:

- Own-period FY2016–FY2019 tags are **pre-split** (8.31 / 9.21 / 11.91 / 11.89).
- Post-split 10-K comparative restatements exist for **FY2018 (2.98)** and **FY2019 (2.97)** only.
- FY2020+ own-period tags are on the post-split basis.
- FY2016–FY2017 have **no** post-split comparative in Company Facts; inventing 8.31÷4 is forbidden.

Correct behavior is therefore `PartiallySupported` with an 8-year split-comparable series (not a mixed-basis 10-year CAGR). Offline tests **63/63**; live SEC opt-in **6/6** (User Secrets present; values not printed).

---

## 3. Diluted EPS defect — before / after

| Item | Before (blocking) | After (corrected) |
| --- | --- | --- |
| FY2016 | 8.31 pre-split own-period | Excluded |
| FY2017 | 9.21 pre-split own-period | Excluded |
| FY2018 | 11.91 pre-split own-period | **2.98** comparative (2020 10-K) |
| FY2019 | 11.89 pre-split own-period | **2.97** comparative (2021 10-K) |
| FY2020–FY2025 | Post-split | Unchanged post-split |
| CAGR | −1.2% (9 intervals, mixed bases) | **+14.0%** (7 intervals, one basis) |
| Status | PartiallySupported (OWN_PERIOD only) | PartiallySupported (`SPLIT_*` warnings) |

---

## 4. Corrected Diluted EPS series (fixture = live values)

| FY | Value | Form | Filed | Accession | Concept | Current vs comparative |
| --- | ---: | --- | --- | --- | --- | --- |
| FY2016 | — | — | — | — | — | Excluded — no post-split SEC comparative |
| FY2017 | — | — | — | — | — | Excluded — no post-split SEC comparative |
| FY2018 | 2.98 | 10-K | 2020-10-30 | 0000320193-20-000096 | EarningsPerShareDiluted | Comparative (split-adjusted) |
| FY2019 | 2.97 | 10-K | 2021-10-29 | 0000320193-21-000105 | EarningsPerShareDiluted | Comparative (split-adjusted) |
| FY2020 | 3.28 | 10-K | 2020-10-30 | 0000320193-20-000096 | EarningsPerShareDiluted | Current / own-period |
| FY2021 | 5.61 | 10-K | 2021-10-29 | 0000320193-21-000105 | EarningsPerShareDiluted | Current / own-period |
| FY2022 | 6.11 | 10-K | 2022-10-28 | 0000320193-22-000108 | EarningsPerShareDiluted | Current / own-period |
| FY2023 | 6.13 | 10-K | 2023-11-03 | 0000320193-23-000106 | EarningsPerShareDiluted | Current / own-period |
| FY2024 | 6.08 | 10-K | 2024-11-01 | 0000320193-24-000123 | EarningsPerShareDiluted | Current / own-period |
| FY2025 | 7.46 | 10-K | 2025-10-31 | 0000320193-25-000079 | EarningsPerShareDiluted | Current / own-period |

**CAGR (7 intervals):** `(7.46 / 2.98)^(1/7) − 1` = **0.140070… (~+14.0%)**  
**YoY:** −0.34%, +10.4%, +71.0%, +8.9%, +0.3%, −0.8%, +22.7% → **5+ / 2−**  
**Warnings:** `SPLIT_ADJUSTED_COMPARATIVE_PREFERRED`, `SPLIT_DISCONTINUITY_DETECTED`, `SPLIT_INCOMPARABLE_YEAR_EXCLUDED` (FY2016/FY2017), `SPLIT_BASIS_NORMALIZED`, `INSUFFICIENT_HISTORY` (8 &lt; 10).

Fixture EPS comparative rows were already authentic SEC captures; no hand-scaled values were introduced. Revenue FY2016–FY2025 golden series unchanged.

---

## 5. AC / claim matrix (updated)

| Claim / concern | Result | Independent evidence |
| --- | --- | --- |
| Scope: Apple / annual / 10y / SEC only | **Pass** | Unchanged; EPS may return &lt;10 when split-limited |
| Reusable metric pipeline + allowlist | **Pass** | EPS-only branch in shared normalizer |
| Diluted EPS unit / diluted-only | **Pass** | `USD/shares`; never basic / monetary USD |
| Diluted EPS split comparability | **Pass** (fixed) | Prefer later split-adjusted comparative; no mixed bases |
| Derived margins FY-aligned | **Pass** | Unchanged |
| YoY/CAGR math | **Pass** | EPS CAGR ~+14.0% on 7 intervals |
| API safe states | **Pass** | EPS `PartiallySupported` with 8 points |
| Offline golden / backend tests | **Pass** | 63/63 |
| Opt-in live SEC | **Pass** | 6/6 with secrets |
| Sprint 1 revenue regression | **Pass** | Exact FY2016–FY2025 revenue values preserved |

---

## 6. Normalization findings (EPS)

| Rule | Behavior |
| --- | --- |
| Unit | `USD/shares` only |
| Prefer restatement | When own-period vs later comparative ≈ factor 2/3/4/5/7/10 → `SPLIT_ADJUSTED_COMPARATIVE_PREFERRED` |
| Series cut | Keep suffix after **last** split-scale YoY discontinuity with nearby restatement evidence (handles Apple’s 2014 7-for-1 and 2020 4-for-1 without re-mixing) |
| Missing years | Exclude rather than invent (`SPLIT_INCOMPARABLE_YEAR_EXCLUDED`) |
| Monetary metrics | Own-period preference unchanged |

---

## 7. Independent fixture datasets (monetary — unchanged)

| Metric | FY2016 → FY2025 | CAGR (9 intervals) | + / − years |
| --- | ---: | ---: | ---: |
| Revenue | 215,639,000,000 → 416,161,000,000 | ~+7.6% | 7 / 2 |
| Gross Profit | 84,263,000,000 → 195,201,000,000 | ~+9.8% | 7 / 2 |
| Operating Income | 60,024,000,000 → 133,050,000,000 | ~+9.2% | 7 / 2 |
| Net Income | 45,687,000,000 → 112,010,000,000 | ~+10.5% | 6 / 3 |
| Diluted EPS | **2.98 → 7.46** (FY2018–FY2025) | **~+14.0%** (7 intervals) | **5 / 2** |

---

## 8. Live SEC verification (reopen)

User Secrets present (`SEC:ApplicationName`, `SEC:ContactEmail` — **values not printed**).

```powershell
$env:SEC__UseFixtureData = 'false'
dotnet test --filter "FullyQualifiedName~LiveSecIntegrationTests"
# => Total tests: 6, Passed: 6, Failed: 0
```

Evidence: `docs/sprint2/_eps_fix_dotnet-live.txt`. Live Diluted EPS asserts ≥8 comparable years, end FY2025, no pre-split 8.31/11.89/11.91 points, and `SPLIT_*` warnings.

---

## 9. Automated command results (EPS reopen)

### Backend offline

```powershell
cd ai-investment-coach/backend
dotnet test
# Total tests: 63, Passed: 63, Failed: 0
```

Evidence: `docs/sprint2/_eps_fix_dotnet-test.txt`.

New / updated coverage includes:

- `Fixture_Produces_SplitAdjusted_Comparable_DilutedEps_Series`
- `DilutedEps_Prefers_SplitAdjusted_Comparative_Over_PreSplit_OwnPeriod`
- `DilutedEps_Excludes_PreSplit_Years_Without_Restated_Comparative`
- `DilutedEps_Cuts_At_Last_Split_Discontinuity_Across_Multiple_Historical_Splits`
- Live EPS split assertions

### Live

6/6 passed with secrets (see §8).

---

## 10. Blocking defects

**None.** The prior Diluted EPS mixed-basis CAGR defect is resolved.

---

## 11. Non-blocking follow-ups

1. Company Facts cannot provide split-adjusted FY2016–FY2017 diluted EPS; full 10-year comparable EPS remains unavailable without inventing values (correctly `PartiallySupported`).
2. Change live SEC tests to explicit xUnit **Skip** when identity unset (early `return` still reports Passed).
3. Optional UI callout when EPS window is shortened by split-basis normalization.

---

## 12. Files changed in EPS reopen (product + tests + docs)

| Path | Role |
| --- | --- |
| `backend/src/TenYearExplorer.Application/Services/XbrlKpiNormalizer.cs` | Split-adjusted comparative preference + series cut |
| `backend/src/TenYearExplorer.Application/Services/FinancialHistoryService.cs` | Allow `PartiallySupported` with split-limited point counts |
| `backend/docs/REVENUE_CONCEPT_MAPPING.md` | Document EPS split rules |
| `backend/fixtures/FIXTURE_README.md` | Note authentic comparative EPS rows |
| `backend/tests/TenYearExplorer.Tests/*` | Regression + golden + live EPS assertions |
| `docs/sprint2/SPRINT2_IMPLEMENTATION_REPORT.md` | Corrected EPS evidence |
| `docs/sprint2/SPRINT2_INDEPENDENT_REVIEW.md` | This revised verdict |
| `docs/sprint2/_eps_fix_dotnet-test.txt` | Offline test log |
| `docs/sprint2/_eps_fix_dotnet-live.txt` | Live test log |

**Not performed:** Sprint 3, commit, push, deploy. Fixture JSON values not hand-edited.

---

## 13. Recommendation

**Sprint 2 may be closed** under **Approved with minor follow-up** after this EPS reopen.

> **Approved with minor follow-up — Diluted EPS split-comparability defect fixed (FY2018–FY2025 SEC-comparable series, CAGR ~+14.0%); revenue unchanged; residual is inherent Company Facts coverage gap for FY2016–FY2017, not mixed-basis math.**

**STOP.** Correction + reports + tests complete. No commit / push / deploy. Sprint 3 not started.
