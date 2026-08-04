# Apple SEC fixtures (Sprint 1)

## Origin

| File | Emulates official endpoint |
| --- | --- |
| `apple-company-facts-reduced.json` | `GET https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json` |
| `apple-submissions-reduced.json` | `GET https://data.sec.gov/submissions/CIK0000320193.json` |

## Capture status

**Live capture was blocked in this environment** because `SEC__ApplicationName` / `SEC__ContactEmail` were not set. Per Sprint 1 rules, anonymous/fake SEC User-Agent requests were not sent.

The fixture is a **reduced, sanitised Company Facts / Submissions shape** populated with Apple annual revenue figures and accession metadata that match publicly reported 10-K values for FY2015–FY2025. Structure mirrors SEC JSON (`cik`, `entityName`, `facts.us-gaap.<concept>.units.USD[]` with `start`, `end`, `val`, `accn`, `fy`, `fp`, `form`, `filed`, `frame`).

Documented construction date: **2026-08-04**.

## Reduction / sanitisation

- Kept only revenue-related US-GAAP concepts needed for Sprint 1 mapping tests.
- Included intentional **10-Q / quarterly-duration** rows so normalizer rejection is testable.
- Included **comparative prior-year** facts from a later 10-K to verify own-period preference.
- Removed unrelated taxonomy concepts and non-USD units.
- No personal contact data or secrets.

## Re-capture (when SEC identity is configured)

```powershell
$env:SEC__ApplicationName = "YOUR_NAME TenYearExplorer"
$env:SEC__ContactEmail = "you@example.com"
# Then download with identifying User-Agent and replace these fixtures.
```

Do not commit real personal email addresses.
