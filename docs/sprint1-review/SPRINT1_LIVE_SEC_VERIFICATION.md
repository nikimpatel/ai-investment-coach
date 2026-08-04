# Sprint 1 Live SEC Verification — Ten-Year Financial Performance Explorer

**Date:** 2026-08-04  
**Scope:** Apple (`AAPL`) annual revenue, 10 years — live EDGAR (not Sprint 2)  
**Secrets:** User Secrets / env identity values are **not** recorded here. No User-Agent or contact email is printed.

---

## 1. Config validation

| Check | Result |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` (User Secrets load via `WebApplication.CreateBuilder`) |
| `SEC:ApplicationName` present / non-empty | **True** (User Secrets) |
| `SEC:ContactEmail` present / non-empty | **True** (User Secrets) |
| ContactEmail not placeholder | **True** |
| Default `UseFixtureData` | `true` in `appsettings.json` and `appsettings.Development.json` |
| Live override for this run | `SEC__UseFixtureData=false` (environment only; not committed) |

Opt-in live test also received identity via `SEC__ApplicationName` / `SEC__ContactEmail` env (loaded from User Secrets into process env for `dotnet test` only; values not logged).

**Config validation: PASSED** — proceeded with live verification.

---

## 2. Live SEC reachability

```text
dotnet test --filter Live_CompanyFacts_Reachable_For_Apple
```

With `SEC__UseFixtureData=false` and identity env set from User Secrets:

- **Passed:** 1  
- **Failed:** 0  
- **Skipped:** 0  

Apple company facts reachable from `https://data.sec.gov` (entity name Apple Inc., `us-gaap` present).

---

## 3. Apple CIK

**`0000320193`** (confirmed on live API response)

---

## 4. Selected fiscal periods + year range

| Item | Live result |
|---|---|
| Point count | **10** |
| Range | **FY2016 → FY2025** |
| Order | Chronological ascending |
| Quarterly / 10-Q | **None** (all `10-K`) |
| Filing metadata per point | Present (`filingDate`, `form`, `accession`, `concept`, `unit`) |

---

## 5. Selected concepts (live)

Priority mapping still applies; selected concept varies by year:

| Fiscal years | Concept |
|---|---|
| FY2016–FY2017 | `SalesRevenueNet` |
| FY2018 | `Revenues` |
| FY2019–FY2025 | `RevenueFromContractWithCustomerExcludingAssessedTax` |

---

## 6. Live values vs fixture

Fixture baseline: `FixtureGoldenPathTests.Expected` / reduced Apple fixtures.

| FY | Live value | Fixture value | Match |
|---|---:|---:|---|
| 2016 | 215,639,000,000 | 215,639,000,000 | Yes |
| 2017 | 229,234,000,000 | 229,234,000,000 | Yes |
| 2018 | 265,595,000,000 | 265,595,000,000 | Yes |
| 2019 | 260,174,000,000 | 260,174,000,000 | Yes |
| 2020 | 274,515,000,000 | 274,515,000,000 | Yes |
| 2021 | 365,817,000,000 | 365,817,000,000 | Yes |
| 2022 | 394,328,000,000 | 394,328,000,000 | Yes |
| 2023 | 383,285,000,000 | 383,285,000,000 | Yes |
| 2024 | 391,035,000,000 | 391,035,000,000 | Yes |
| 2025 | 416,161,000,000 | 416,161,000,000 | Yes |

**Numeric series: exact match (10/10).**

---

## 7. Metadata differences

| Field | Live vs fixture |
|---|---|
| `periodEnd` | Exact match all 10 years |
| `accession` | Exact match all 10 years |
| `form` | `10-K` both sides |
| `concept` | **Differs for FY2016–FY2018** — live uses `SalesRevenueNet` / `Revenues`; fixture golden path asserts `RevenueFromContractWithCustomerExcludingAssessedTax` for every year |
| Response `status` | Live: **`PartiallySupported`**; fixture golden path: **`Success`** |
| `sourceProvider` | Live: `SEC EDGAR`; fixture mode: `SEC EDGAR fixture` |

---

## 8. Warnings (live)

Five warnings (drive `PartiallySupported`). All refer to **FY2007–FY2009** (outside the selected FY2016–FY2025 window):

| Code | Fiscal year | Concept |
|---|---|---|
| `COMPARATIVE_ONLY` | FY2007 | — |
| `AMENDMENT_PREFERRED` | FY2007 | `SalesRevenueNet` |
| `COMPARATIVE_ONLY` | FY2008 | — |
| `AMENDMENT_PREFERRED` | FY2008 | `SalesRevenueNet` |
| `AMENDMENT_PREFERRED` | FY2009 | `SalesRevenueNet` |

Reduced fixtures do not surface these older-year warnings, so fixture mode returns `Success`.

---

## 9. Cache Miss then Hit

| Call | `cacheStatus` | `sourceProvider` |
|---|---|---|
| 1st `GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10` | **Miss** | `SEC EDGAR` |
| 2nd identical GET | **Hit** | `SEC EDGAR` |

API started with `ASPNETCORE_ENVIRONMENT=Development`, `ASPNETCORE_URLS=http://localhost:5080`, `SEC__UseFixtureData=false`, identity from User Secrets / env (not written to files).

---

## 10. Browser / API consistency

Frontend at `http://localhost:3000` was **not reachable** during this run — browser consistency **not tested**.

---

## 11. Overall

**Passed with differences**

Live EDGAR identity, reachability, CIK, 10 chronological annual points, filing metadata, cache Miss→Hit, and **exact value/accession/periodEnd match** to the fixture series all succeeded.

Differences vs fixture/demo expectations:

1. Status `PartiallySupported` (warnings for FY2007–FY2009) instead of `Success`
2. Concept labels for FY2016–FY2018 differ from the fixture golden-path assertion (values still identical)

---

## 12. Recommendation

- **Fixture recapture is not required** for treating the **numeric 10-year Apple revenue series** as live-EDGAR-verified — values, period ends, and accessions already match live.
- **Optional follow-up (not Sprint 2):** update reduced fixtures / golden-path concept expectations to mirror live concept selection for FY2016–FY2018, and/or decide whether out-of-window FY2007–FY2009 warnings should keep the selected 10-year response at `PartiallySupported`.
- Keep default local mode on fixtures (`UseFixtureData=true`); use User Secrets + `SEC__UseFixtureData=false` only for live checks. Do not commit secrets.
