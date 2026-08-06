# Apple SEC fixtures (Sprint 1–3)

## Origin

| File | Emulates official endpoint |
| --- | --- |
| `apple-company-facts-reduced.json` | `GET https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json` |
| `apple-submissions-reduced.json` | `GET https://data.sec.gov/submissions/CIK0000320193.json` |

## Capture status

**Sprint 2 live capture (2026-08-04):** Company Facts were downloaded with project-isolated .NET User Secrets (`SEC:ApplicationName` / `SEC:ContactEmail`). Secrets and the full User-Agent are never stored in this fixture.

**Revenue concepts** in the reduced fixture remain the Sprint 1 series (unchanged values for FY2016–FY2025 regression).

**New metric concepts** (`GrossProfit`, `OperatingIncomeLoss`, `NetIncomeLoss`, `EarningsPerShareDiluted`) were reduced from the authentic live Company Facts payload captured the same day. Values were not invented or hand-edited.

Full live capture used for reduction is local-only under `docs/sprint2/_live_companyfacts_full.json` (gitignored; not committed).

**Sprint 3 revalidation (2026-08-06):** Apple facts were checked against the official SEC
Company Concept / Company Facts data for CIK `0000320193`. The reduced fixture adds:

- `NetCashProvidedByUsedInOperatingActivities` (annual duration)
- `PaymentsToAcquirePropertyPlantAndEquipment` (annual duration)
- `CashAndCashEquivalentsAtCarryingValue` (fiscal-year-end instant)
- `CommercialPaper`, `LongTermDebtCurrent`, and `LongTermDebtNoncurrent`
  (fiscal-year-end instant debt components)

The FY2016–FY2025 values, filing dates, forms, accessions, period ends, and concepts are
authentic SEC evidence (per-concept SEC downloads on 2026-08-06). No values were invented.
Operating Cash Flow prefers `NetCashProvidedByUsedInOperatingActivities`; FY2016 uses the
own-period fallback `NetCashProvidedByUsedInOperatingActivitiesContinuingOperations`
because the primary tag has no own-period FY2016 fact in Company Facts. Quarterly examples
remain only to prove the normalizer rejects 10-Q / partial periods.

Local concept captures used for reduction live under `docs/sprint3/_live_concepts/` (gitignored).

## Reduction / sanitisation

- Kept revenue-related US-GAAP concepts needed for Sprint 1 mapping tests (preserved exactly).
- Added annual 10-K/10-K/A facts for Gross Profit, Operating Income, Net Income, Diluted EPS for FY2014–FY2025 (plus a few comparative rows present in the live payload).
- Added annual duration facts for Operating Cash Flow and CapEx and annual-filing
  fiscal-year-end instant facts for cash and each non-overlapping debt component.
- Included intentional **10-Q / quarterly-duration** sample rows so normalizer rejection remains testable.
- Diluted EPS kept under unit `USD/shares` only (not monetary `USD`).
- Diluted EPS rows include authentic post-split **comparative** restatements (e.g. FY2018 `2.98` and FY2019 `2.97` from the 2020/2021 10-Ks). Values were not invented or hand-scaled; the normalizer prefers these over pre-split own-period tags.
- Removed unrelated taxonomy concepts.
- No personal contact data or secrets.

## Sprint 3 calculation conventions

- **CapEx:** SEC `PaymentsToAcquirePropertyPlantAndEquipment` is normalized to a
  positive amount spent, even if a source presents the cash outflow as negative.
- **Free Cash Flow:** derived, non-GAAP; `Operating Cash Flow − positive CapEx`.
  Every derived API point retains both SEC inputs.
- **Total Debt:** `CommercialPaper + LongTermDebtCurrent + LongTermDebtNoncurrent`.
  These components are compatible and non-overlapping for Apple. Total liabilities are
  never used, and the sparse direct `LongTermDebt` concept is not mixed into the sum.
- **Net Debt:** `Total Debt − Cash & Equivalents`; a negative result is labelled net cash.

## Re-capture (when SEC identity is configured)

```powershell
# Uses project User Secrets — do not print values
dotnet user-secrets list --project src/TenYearExplorer.Api
# Download with identifying User-Agent built from SEC:ApplicationName + SEC:ContactEmail
```

Do not commit real personal email addresses or the full live Company Facts blob.
