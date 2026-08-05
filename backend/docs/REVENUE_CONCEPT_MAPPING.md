# Metric concept mapping (Sprint 1–2)

Internal allowlist codes: `revenue`, `gross-profit`, `operating-income`, `net-income`, `diluted-eps`.

Source of truth for Apple concept presence: live SEC Company Facts for CIK `0000320193` (captured 2026-08-04).

## Revenue (`revenue`)

| Priority | Concept | Why accepted |
| ---: | --- | --- |
| 1 | `RevenueFromContractWithCustomerExcludingAssessedTax` | Primary ASC 606 tag Apple uses in recent 10-Ks for total net sales / contract revenue excluding assessed tax. |
| 2 | `Revenues` | Broad total-revenue US-GAAP tag; fallback when the ASC 606 tag is absent for a period. |
| 3 | `SalesRevenueNet` | Older net-sales style tag retained as last-resort historical continuity. |

## Gross Profit (`gross-profit`)

| Priority | Concept | Why accepted |
| ---: | --- | --- |
| 1 | `GrossProfit` | Reported US-GAAP Gross Profit present for Apple FY2014–FY2025 annual 10-K facts (live Company Facts). Prefer reported fact; do **not** invent Gross Profit from costs. |

`GrossProfitLoss` was **not** present in Apple’s live Company Facts payload.

## Operating Income (`operating-income`)

| Priority | Concept | Why accepted |
| ---: | --- | --- |
| 1 | `OperatingIncomeLoss` | Standard US-GAAP operating income/(loss) tag Apple reports in annual 10-Ks (live Company Facts). |

`OperatingIncome` (without Loss) was **not** present.

## Net Income (`net-income`)

| Priority | Concept | Why accepted |
| ---: | --- | --- |
| 1 | `NetIncomeLoss` | Standard US-GAAP net income/(loss) tag Apple reports in annual 10-Ks (live Company Facts). |

`ProfitLoss` was **not** present as a separate usable alternative for this sprint.

## Diluted EPS (`diluted-eps`)

| Priority | Concept | Why accepted |
| ---: | --- | --- |
| 1 | `EarningsPerShareDiluted` | Diluted EPS only. Unit must be `USD/shares`. Basic EPS (`EarningsPerShareBasic`) is never mixed in. |

### Stock-split comparability (EPS-only)

Per-share series can mix pre-split and post-split reporting bases when Company Facts retain original own-period tags alongside later comparative restatements. Apple’s August 2020 4-for-1 split is the Sprint 2 example (2020 Form 10-K states per-share amounts were retroactively adjusted).

| Rule | Behavior |
| --- | --- |
| Detect restatement | When own-period and a **later-filed** comparative differ by a common forward-split factor (2/3/4/5/7/10 within tight tolerance), treat the later comparative as split-adjusted. |
| Prefer restatement | Select the later split-adjusted comparative (`SPLIT_ADJUSTED_COMPARATIVE_PREFERRED`). Do **not** invent values by dividing. |
| Series integrity | After selection, keep only years on one comparable (post-split) basis. Years lacking a reliable post-split SEC fact are excluded (`SPLIT_INCOMPARABLE_YEAR_EXCLUDED`) rather than mixed. |
| Discontinuity | An obvious ~N× YoY step is flagged (`SPLIT_DISCONTINUITY_DETECTED`) and is not treated as ordinary negative growth. |
| Status | Result is `PartiallySupported` when split normalization applies; if Company Facts cannot supply a full requested window on one basis, return the longest reliable comparable subset (not a mixed-basis 10-year CAGR). |

Monetary metrics (revenue, gross profit, operating income, net income) are **unchanged**: own-period remains preferred over comparative.

## Shared acceptance rules

- **Units:** monetary metrics `USD` only; diluted EPS `USD/shares` only.
- **Forms:** `10-K` and `10-K/A` only (`10-Q` rejected).
- **Fiscal period flag:** `fp` must be `FY` when present; `Q1`/`Q2`/`Q3`/`Q4` rejected.
- **Duration:** `period start` required; length must be 350–380 days (annual). Quarters (~90 days) rejected.
- **Fiscal vs calendar:** Fiscal year label is derived from **period-end year** (Apple FY ends in late September). SEC `fy` alone is **not** sufficient to accept a fact.
- **Duplicates / comparatives (monetary):** Group by period-end. Prefer own-period filing (`fy` matches period-end year) over later comparative restatements. Do not auto-pick newest filed value. Conflicting unresolved values → exclude + warning.
- **Duplicates / comparatives (Diluted EPS):** Prefer later split-adjusted comparative SEC facts when the own→comparative ratio matches a deterministic split factor; otherwise same own-period rules. Never mix pre-/post-split bases in one series.
- **Output:** Preserve concept, FY label, period start/end, filing date, form, accession, comparative classification.

## Derived margins (not requestable as `metric=`)

Computed after FY alignment of normalized series:

- Gross Margin = Gross Profit ÷ Revenue × 100
- Operating Margin = Operating Income ÷ Revenue × 100
- Net Margin = Net Income ÷ Revenue × 100

Unsafe when revenue is zero/missing or period-ends mismatch → null + structured warning. Changes between years are **percentage points**, not percent-of-percent.

## Rejection rules (summary)

- Wrong unit, quarterly duration, missing start, incomplete future period, non-10-K forms, unsupported concepts, ambiguous conflicting values, basic EPS for diluted metric.
