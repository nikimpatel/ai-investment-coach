# Revenue concept mapping (Sprint 1)

Internal metric: `revenue`.

## Ordered candidates (US-GAAP)

| Priority | Concept | Why accepted |
| ---: | --- | --- |
| 1 | `RevenueFromContractWithCustomerExcludingAssessedTax` | Primary ASC 606 tag Apple uses in recent 10-Ks for total net sales / contract revenue excluding assessed tax. |
| 2 | `Revenues` | Broad total-revenue US-GAAP tag; fallback when the ASC 606 tag is absent for a period. |
| 3 | `SalesRevenueNet` | Older net-sales style tag retained as last-resort historical continuity. |

## Acceptance rules

- **Units:** `USD` only.
- **Forms:** `10-K` and `10-K/A` only (`10-Q` rejected).
- **Fiscal period flag:** `fp` must be `FY` when present; `Q1`/`Q2`/`Q3`/`Q4` rejected.
- **Duration:** `period start` required; length must be 350–380 days (annual). Quarters (~90 days) rejected.
- **Fiscal vs calendar:** Fiscal year label is derived from **period-end year** (Apple FY ends in late September). SEC `fy` alone is **not** sufficient to accept a fact.
- **Duplicates / comparatives:** Group by period-end. Prefer own-period filing (`fy` matches period-end year) over later comparative restatements. Do not auto-pick newest filed value. Conflicting unresolved values → exclude + warning.
- **Output:** Preserve concept, FY label, period start/end, filing date, form, accession.

## Rejection rules (summary)

- Wrong unit, quarterly duration, missing start, incomplete future period, non-10-K forms, unsupported concepts, ambiguous conflicting values.
