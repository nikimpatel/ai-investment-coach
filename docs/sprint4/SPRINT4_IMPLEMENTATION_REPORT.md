# Sprint 4 Implementation Report — Guided Apple Analysis

**Date:** 2026-09-18
**Branch:** `feat/sprint4-public-demo`
**Plan baseline:** `a2a482e` (`docs: finalize Sprint 4 guided analysis plan`)
**Status:** Implemented and locally verified; public deployment is a separate release phase.

## Scope completed

- Finance → Apple (SEC) exposes **Start / Continue guided Apple analysis** inside the existing phone frame.
- Guided mode hides the regular step rail and metric explorer; **Exit guide** restores Finance.
- Returning to Finance resumes the exact saved guided screen.
- Circle of Competence uses chips plus an optional note, deterministic interpretation, and Confirm / Correct / Skip.
- `Retail business` maps deterministically to **Retail**; **I don’t have one yet** is supported.
- Bias introduction appears before Stage 1. Every recorded judgment requires a completed or skipped pre-judgment check.
- Five configured stages reuse only Sprint 1–3 metrics and API calculations.
- Five familiar comparisons are collapsed by default, clearly labelled as non-evidence, and include limitations.
- Record, Defer, and Uncertain paths work. **Complete later** preserves partial review and remains labelled incomplete.
- One shared confidence value is retained with judgment/confidence revision history.
- Guided progress persists under `aic.appleGuidedAnalysis.v1`; refresh and Restart preserve it.
- **Reset guided Apple analysis** is separate and requires confirmation.
- Apple Analysis Summary separates facts, calculations, explanations, learner judgments, bias checks, counter-evidence, and open questions.
- Thesis retains the existing single Finance observation and adds separate supporting, weakening, and neutral `analysisPackets[]`.
- Saved packets retain the API `sourceProvider`; familiar comparisons never enter packets.

## Deterministic and privacy boundaries

- No LLM, external AI call, authentication, database, analytics, or server-side learner storage.
- No new company, financial metric, price, valuation, score, ranking, or Buy/Sell/Hold output.
- Learner notes stay in browser `localStorage` and are never sent to the .NET or SEC endpoints.
- Fixture/live source labelling is copied from the API response at evidence-review time.

## Automated verification

### Frontend

- `npm ci` — passed (Node 20.19.5 / npm 10.8.2).
- `npm test` — **10 passed / 0 failed** using TypeScript compile plus Node 20 `node --test`; no test framework added.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed with Next.js 16.2.12.

### Backend regression

- `dotnet restore backend/TenYearExplorer.sln` — passed.
- Release build — passed with **0 warnings / 0 errors**.
- Release tests — **96 passed / 0 failed**.
- Release publish — passed; both reduced fixture JSON files were present in publish output.

## Browser acceptance exercised

- Desktop landing and responsive phone-framed prototype loaded.
- Apple SEC Finance loaded and all existing metric controls remained available.
- Guided header, hidden rail/explorer, Exit, exact resume, and full-document refresh persistence worked.
- CoC Retail mapping, correction path, empty-state control, and confirmation worked.
- Bias intro and pre-judgment control worked.
- Completed one Record, two Defer, and two Uncertain stage paths.
- Revenue post-review used **Complete later** and was labelled **Review incomplete** in Review and Summary.
- All five evidence stages loaded authentic captured fixture history and retained source badges.
- Familiar comparison disclosure was collapsed by default and expanded with its limitation.
- Summary was reachable with mixed judgment statuses.
- Two packets were saved to separate Supports / Weakens groups; one was removed.
- Restart reset the Harborline/thesis walkthrough while preserving the exact Apple Summary screen.
- Confirmed Reset cleared guided progress and returned to ordinary Finance.
- No Next.js issue overlay or hydration error appeared during the final pass.

## Evidence

- `docs/deployment/evidence/local-guided-summary.png`
- `docs/deployment/evidence/local-mobile-390-prototype.png`

## Known limitations

- The Windows junction plus a separate parent `package-lock.json` causes a non-blocking Turbopack workspace-root warning. Explicitly setting `turbopack.root` is not used because Next.js 16 rejects the junction’s `.next` path; production build succeeds.
- Thesis packets intentionally remain part of the existing in-memory prototype thesis. Guided Apple analysis itself is the only browser-persisted Sprint 4 document.
- Public Azure/Vercel URLs and production evidence will be recorded in `docs/deployment/PUBLIC_DEMO_DEPLOYMENT_REPORT.md` after the separate deployment phase.
