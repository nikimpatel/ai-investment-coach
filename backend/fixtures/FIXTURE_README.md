# Apple SEC fixtures (Sprint 1–2)

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

## Reduction / sanitisation

- Kept revenue-related US-GAAP concepts needed for Sprint 1 mapping tests (preserved exactly).
- Added annual 10-K/10-K/A facts for Gross Profit, Operating Income, Net Income, Diluted EPS for FY2014–FY2025 (plus a few comparative rows present in the live payload).
- Included intentional **10-Q / quarterly-duration** sample rows so normalizer rejection remains testable.
- Diluted EPS kept under unit `USD/shares` only (not monetary `USD`).
- Diluted EPS rows include authentic post-split **comparative** restatements (e.g. FY2018 `2.98` and FY2019 `2.97` from the 2020/2021 10-Ks). Values were not invented or hand-scaled; the normalizer prefers these over pre-split own-period tags.
- Removed unrelated taxonomy concepts.
- No personal contact data or secrets.

## Re-capture (when SEC identity is configured)

```powershell
# Uses project User Secrets — do not print values
dotnet user-secrets list --project src/TenYearExplorer.Api
# Download with identifying User-Agent built from SEC:ApplicationName + SEC:ContactEmail
```

Do not commit real personal email addresses or the full live Company Facts blob.
