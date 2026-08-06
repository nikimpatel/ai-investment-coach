# Sprint 2 — STEP 1 inspect brief

## Proposed files to change

**Backend**
- `Application/Abstractions/IFinancialFactsProvider.cs`, `IXbrlKpiNormalizer.cs`, `IFinancialMetricsCalculator.cs`
- `Application/Services/FinancialHistoryService.cs`, `XbrlKpiNormalizer.cs`, `FinancialMetricsCalculator.cs`
- `Infrastructure/Sec/SecFinancialFactsProvider.cs`, `Caching/*`, `DependencyInjection.cs`
- `Domain/Models/FinancialHistoryResult.cs` (+ related DTOs/mapper)
- `Api/Contracts/FinancialHistoryResponse.cs`, `Mapping/FinancialHistoryMapper.cs`
- Existing tests + fixture JSON/README

**Frontend**
- `src/lib/apple-financial-api.ts`, `apple-trend-copy.ts`, `types.ts`
- `src/components/prototype/FinancialPerformance.tsx`, `ThesisBuilder.tsx`, `PrototypeApp.tsx`
- Next proxy route (pass `metric` query)

## Proposed files to add

- `Application/Metrics/SupportedMetrics.cs` (allowlist + concept candidates + units)
- `Application/Metrics/MarginCalculator.cs` (or methods on calculator)
- Domain models for margin series / metric metadata
- `docs/METRIC_CONCEPT_MAPPING.md` (or extend revenue doc)
- Focused multi-metric tests + live opt-in coverage
- `docs/sprint2/SPRINT2_IMPLEMENTATION_REPORT.md` + screenshots

## Metric/concept strategy

- One allowlist-driven pipeline: resolve metric → extract candidate concepts from Company Facts → same annual normalizer → YoY/CAGR summary → optional derived margins aligned by FY.
- Prefer caching underlying Company Facts by CIK; keep history cache keyed by `company|metric|period|years`.
- Prefer reported `GrossProfit` (do not invent from costs).
- Diluted EPS: `USD/shares` (or SEC equivalent), never mix with basic EPS.
- Margins computed only after FY-aligned normalized Revenue + numerator.

## Main SEC/XBRL risks

- Fixture currently revenue-only; must extend from authentic SEC capture.
- Concept tags may not cover all 10 years with one concept; fallback order required.
- EPS unit differs from monetary USD; split-adjusted comparatives need consistent own-period rules.
- Live vs fixture drift already noted for revenue filing dates / comparative warnings.

## Test strategy

- Offline fixture golden paths for all five metrics + margins + Sprint 1 revenue regression.
- Unit tests for allowlist, units, quarterly rejection, margins, CAGR/EPS edges, cache key separation.
- Opt-in live SEC for new metrics (skipped ≠ passed).
- Frontend: typecheck/lint/build; no new FE test framework.

Continuing implementation (no blocking ambiguity).
