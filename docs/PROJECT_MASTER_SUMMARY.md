# AI Investment Coach — Project Master Summary

**Owner:** Nikita Patel  
**Canonical repository:** [nikimpatel/ai-investment-coach](https://github.com/nikimpatel/ai-investment-coach)  
**Prepared:** 2 October 2026, Australia/Sydney  
**Intended repository location:** `docs/PROJECT_MASTER_SUMMARY.md`  
**Purpose:** A self-contained archive and continuation guide after the move from ChatGPT planning into Cursor.  
**Status reconciled:** 2 October 2026, from the repository, GitHub, and the production site.

> **Read this first:** Sprint 4 is on production. Onboarding PR **#17** passed CI, was merged, and is the current production frontend. Head **`00251128db395a6541e3f3617bd84372b862723c`**. Merge commit on `main`: **`525455f7f58425548fedeae1e75045123928b517`** (30 September 2026, 07:49 UTC). Vercel production deployment of that commit succeeded. A fresh browser smoke test of https://ai-investment-coach-cyan.vercel.app/#prototype passed at 1440×900 and 390×844. The earlier ChatGPT draft correctly refused to treat the merge as done; this Cursor check confirms it.

## Evidence and scope of this archive

This document consolidates the available project conversation, retrieved project-specific conversation context, the original SEC feature proposal, and committed repository documents. The Sprint 4 baseline in those documents is `2f79043149c1570d49a8d6216dc563ffb3c7de6b`. Onboarding status was first drafted from Cursor reports while the merge was still unconfirmed. On 2 October 2026 this file was checked against GitHub and the live production site, and the release status below is that check.

It does not claim access to every conversation or file in the originating workspace. Unknowns are labelled. No employer information, credentials, or unrelated personal projects are included.

Evidence priority for continuation:
1. Current repository, PR, CI and deployment evidence after inspection.
2. Explicit user confirmations and recent Cursor reports shared by the user.
3. Committed sprint plans, implementation reports and release reports.
4. Older ideas and assistant suggestions, which are not proof of implementation.

Older README sections still describe Sprint 1-only scope. Later sprint and deployment reports supersede those sections. An old experimental `ai-investment-coach-sprint4.patch` and a dirty experimental checkout existed in an earlier assistant workspace; **neither is the canonical implementation. Do not apply or resume that patch.**

## 1. Project overview

AI Investment Coach is a personal startup experiment to help beginner and intermediate self-directed investors develop a better long-term investment process.

The intended learning loop is:

**Research → Finance → Thesis → Decision → Reflect**

The product helps learners examine evidence, write down reasoning, challenge assumptions, record a stance and reconsideration triggers, and reflect on their own habits. Financial charts support that process; the chart alone is not the differentiation.

The longer-term vision includes AI-guided explanations, thesis critique, investment journaling, personal investment memory and reflection across decisions. The current implementation is a deterministic educational prototype, not a deployed LLM coach.

Nikita is an experienced software engineer building this as a personal project and is also close to the target user. The working approach is small, reviewable Cursor tasks, verified releases and user validation before expanding scope.

## 2. Problem being solved

The product hypothesis is that self-directed investors have access to financial information and investment opinions but lack a clear, repeatable way to:

- Understand historical business performance without being overwhelmed.
- Separate reported facts from calculations, explanations and personal interpretations.
- Write an investment thesis that includes disconfirming evidence.
- Notice psychological influences before and after making a judgment.
- Record why they reached a decision and what would change their mind.
- Learn from previous reasoning, rather than judging every decision only by returns.

These are hypotheses to validate with users, not established market research findings.

One directly observed product problem came from the founder's review of the public demo: clicking Prototype led into a tiny phone frame on a laptop, and the first experience did not adequately explain the product or task. The onboarding work in PR #17 addresses this specific problem.

## 3. Target users

Primary intended users:

- Beginner and intermediate long-term, self-directed investors.
- People who can access brokerage platforms but want help with research and reasoning.
- Investors who find financial statements intimidating or struggle to turn data into a clear thesis.
- People interested in journaling, reflection, confidence calibration and avoiding impulsive decisions.

Stake, Robinhood and CommSec users were discussed as examples of the audience, not as integrations or partnerships.

The initial financial-data scope is Apple, a US SEC filer. The product does not currently offer broad US-market coverage or Australian company data.

No validated customer segment, paying cohort, acquisition channel or willingness-to-pay result has been established in the available record.

## 4. Product positioning

**What it is:**

- Educational decision-support and a coach for investment thinking.
- A structured, evidence-based learning and reflection workflow.
- A transparent financial-history explorer embedded in a broader thinking loop.
- A prototype for testing whether people find the process useful.

**What it is not:**

- A trading platform, stock screener, tip feed or brokerage.
- A source of Buy/Sell/Hold recommendations.
- A portfolio optimizer, valuation engine or predictor of returns.
- A system that rates companies or diagnoses the learner as biased.
- A substitute for the learner's judgment.

The product name contains “AI,” but current coaching and explanations are deterministic. Do not market LLM critique, live personalized AI, durable cross-device memory or real cross-company pattern detection as shipped.

The fictional Harborline flow demonstrates the concept. Apple uses historical SEC-derived evidence. Keep those data sources visibly distinct.

## 5. Current MVP functionality

### Publicly released baseline: Phase 0 through Sprint 4

**Landing and walkthrough**

- Public landing page and interactive prototype at `/#prototype`.
- Research, Finance, Thesis, Decision and Reflect steps.
- Fictional Harborline Logistics for the guided demonstration.
- Structured thesis-building, a decision journal and a reflection/playbook demonstration.
- The original reflection experience includes demonstration patterns with Confirm / Correct / Dismiss; it is not evidence of a production longitudinal AI-memory service.
- The released baseline used a narrow phone frame.

**Finance**

- Harborline fictional revenue history remains available.
- Apple Inc., ticker AAPL, CIK `0000320193`.
- Annual history, generally FY2016–FY2025 in the captured dataset.
- Charts, exact-value tables, deterministic trend summaries, source details and warnings.
- Ten metric controls, grouped around performance, cash generation and financial position.

| Metric | API metric code | Recorded release coverage |
| --- | --- | --- |
| Revenue | `revenue` | 10 annual points; Success |
| Gross profit | `gross-profit` | 10 annual points; Success |
| Operating income | `operating-income` | 10 annual points; Success |
| Net income | `net-income` | 10 annual points; Success |
| Diluted EPS | `diluted-eps` | 8 comparable split-adjusted points; PartiallySupported |
| Operating cash flow | `operating-cash-flow` | 10 points; PartiallySupported |
| Capital expenditure | `capital-expenditure` | 10 points; PartiallySupported |
| Free cash flow | `free-cash-flow` | 10 points; derived; PartiallySupported |
| Cash and equivalents | `cash-and-equivalents` | 10 fiscal-year-end points; PartiallySupported |
| Total debt | `total-debt` | 10 points; derived; PartiallySupported |

“Ten metrics” does not mean every metric has ten fully comparable years. In particular, diluted EPS uses FY2018–FY2025 in the verified fixture coverage. Preserve the comparability warnings.

Derived information includes YoY changes, CAGR where valid, gross/operating/net margins, free cash flow, cash conversion, FCF margin and net debt.

**Guided Apple analysis**

Entry: Finance → Apple (SEC) → Start / Continue guided Apple analysis.

The guide includes Circle of Competence capture, confirm/correct/skip, a bias introduction, five financial stages, a bias/counter-evidence review, an Apple Analysis Summary and optional evidence packets saved into Thesis.

The five stages are:
1. Revenue and growth.
2. Profitability and margins.
3. Profit versus cash generation.
4. Capital expenditure and free cash flow.
5. Cash, debt and financial position.

Each stage supports evidence review, interpretation, pre-judgment reflection, and Record / Defer / Uncertain paths. Post-judgment review includes counter-evidence, alternative explanations, missing information, what would change the learner's mind, and confidence.

**Persistence**

- Guided Apple analysis persists in browser localStorage under `aic.appleGuidedAnalysis.v1`.
- Harborline walkthrough, thesis and decision state are in memory.
- Thesis `analysisPackets[]` remain part of the in-memory thesis. Do not describe them as independently persistent.
- Restart walkthrough clears the in-memory walkthrough and closes the guide while keeping saved Apple analysis.
- Separate Reset guided Apple analysis requires confirmation.

### Released to production: onboarding PR #17

Merged to `main` as `525455f` and serving on the production site. Local verification before merge, then a production smoke test on 30 September 2026:

- First-visit briefing with Start the walkthrough and Skip.
- Primary hero/header CTA “Try the walkthrough,” linking to `#prototype`.
- “Join early access” retained as secondary.
- Wide desktop panel at widths >=1024px.
- Optional desktop-only Show phone preview checkbox.
- Fluid tablet/mobile layout without a fake bezel.
- Five step-specific coach messages, hidden while guided Apple analysis is open.
- The same mounted PrototypeApp survives layout changes.
- A fix prevents the desktop phone frame from clipping the coach strip.

## 6. Important product decisions already made

### Financial data and evidence

| Decision | Reason / implication |
| --- | --- |
| Official SEC EDGAR APIs for initial financial data | Free, authoritative source; validate before commercial data costs. |
| Start with Apple and annual data | Keep normalization and verification manageable. |
| No FMP, sec-api.io, Yahoo Finance or paid provider in the initial implementation | Avoid unnecessary data-provider scope and licensing costs. Revisit only with evidence. |
| Deterministic financial calculations | AI must never invent or calculate the underlying financial figures. |
| Preserve provenance, units, fiscal periods, warnings and derived inputs | Make the evidence inspectable and avoid false precision. |
| Missing or unreliable data stays missing/unsupported | Never silently manufacture values. |
| Public demo uses authentic captured SEC fixtures with honest labels | Reliable low-cost public demonstration; not a live refresh promise. |

Capital expenditure is represented as positive cash spent. Free cash flow is operating cash flow minus that positive CapEx amount. Total debt is the compatible Apple sum of commercial paper, current long-term debt and noncurrent long-term debt; it is **not total liabilities**. Preserve these existing conventions and input traces.

### Locked Sprint 4 decisions

1. Keep the Sprint 1–3 single Finance observation and add `analysisPackets[]`.
2. Restart keeps Apple analysis; clearing it is a separate confirmed reset.
3. Ship five editable deterministic analogies, each labelled **“Familiar comparison — not Apple evidence”**, with a limitation. Keep them out of SEC facts, calculations and thesis packets.
4. Hide the metric explorer and regular step rail during the guide. Use its dedicated progress header. Exit guide restores Finance.
5. Allow Complete later; incomplete review remains visibly incomplete on Review and Summary.
6. One shared confidence value per material judgment, set/updated in post-review, with revision indicator/history rather than silent overwrite.
7. Use `node --test` for frontend tests; no Vitest.
8. Source badges use the saved `sourceProvider`; no live/fixture toggle inside the guide.
9. Circle of Competence uses chips plus an optional note, with confirm/correct/skip and a not-yet-defined path.
10. Returning to Finance allows exact guided-screen resume.

These were locked in `docs/sprint4/SPRINT4_PLAN.md` and committed as `a2a482e6ecb29b54a036a1e309be61f61aeff321` before implementation.

### Onboarding decisions

- Explain the product before asking people to use it.
- Briefing describes a coach for research, decisions and learning; the five-step loop; about five minutes for the core walkthrough; no login or trades; fictional Harborline; historical educational Apple data.
- Start and Skip both dismiss the briefing.
- Persist dismissal separately under `aic.prototypeBriefingDismissed.v1`.
- Read storage after mount with a deterministic initial render to avoid hydration mismatch.
- Desktop breakpoint is 1024px; below it use natural width without a bezel.
- Phone-preview preference is React state only, not persisted.
- Do not remount PrototypeApp on toggle or resize; doing so would lose in-memory learner work.
- Keep the current `#prototype` entry. A dedicated `/walkthrough` route was discussed but was not selected for this release.
- Do not use video, tooltip tours or a slightly enlarged phone as the primary fix.

## 7. Architecture and technology stack

### Frontend

- Next.js App Router, TypeScript, React and Tailwind CSS.
- Verified Sprint 4 package versions: Next.js 16.2.12, React 19.2.4, Tailwind 4, TypeScript 5.
- Node 20.x in the recorded deployment configuration.
- Next.js version-specific instruction: read the installed `node_modules/next/dist/docs/` before writing Next.js code.
- No additional UI, animation or test framework for onboarding.

Important paths:

| Path | Role |
| --- | --- |
| `src/app/page.tsx` | Server Component composing the landing page |
| `src/components/landing/` | Landing components |
| `src/components/landing/Hero.tsx` | Hero CTA |
| `src/components/landing/Header.tsx` | Header CTA |
| `src/components/landing/MobilePreview.tsx` | Prototype section with id `prototype` |
| `src/components/prototype/PrototypeApp.tsx` | Stateful walkthrough; owns guidedOpen |
| `src/components/prototype/PhoneFrame.tsx` | Optional phone presentation |
| `src/components/prototype/StepRail.tsx` | Five-step navigation |
| `src/components/prototype/FinancialPerformance.tsx` | Finance explorer |
| `src/components/prototype/GuidedAppleAnalysis.tsx` | Guided Apple flow |
| `src/lib/guided-analysis.ts` | Guided state and deterministic behavior |
| `src/lib/guided-analysis-storage.ts` | Guided document persistence |
| `src/lib/guided-analogies.ts` | Editable deterministic analogy copy |
| `src/lib/bias-library.ts` | Educational bias content |
| `src/lib/apple-financial-api.ts` | Frontend financial API access |
| `src/lib/apple-metrics.ts`, `apple-trend-copy.ts` | Metric metadata and explanation copy |
| `src/lib/config.ts` | Landing CTA configuration |

Existing Tailwind design tokens include ink, paper, mist, accent, sand, line and font-display.

### Backend

.NET 8 / C# solution under `backend/`:

| Project | Responsibility |
| --- | --- |
| TenYearExplorer.Api | Controllers, DTOs, mapping, health endpoint |
| TenYearExplorer.Application | Financial history service, normalization, calculations and interfaces |
| TenYearExplorer.Domain | Domain models, result states and warnings |
| TenYearExplorer.Infrastructure | Live SEC client, fixture client and memory caches |
| TenYearExplorer.Tests | xUnit fixture tests and opt-in live checks |

No persistent database is deployed for this MVP. PostgreSQL/EF Core appeared in early architecture proposals but were not adopted in the shipped implementation.

### Data flow

Browser → Next.js same-origin financial-history proxy → .NET API → captured SEC fixtures or configured SEC client → deterministic normalization/calculation → response with provenance → chart/table/guide.

- Next proxy path: `/api/companies/[symbol]/financial-history`.
- Example backend request: `GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10`.
- Health path: `/api/health`.
- Official upstreams: SEC Submissions and XBRL Company Facts.
- Backend caching is in memory; it is not learner storage.
- SEC identification belongs only on the backend.
- Guided notes are browser-local and are not sent to .NET or SEC.
- No shipped LLM calls, authentication, analytics or server-side learner storage.

## 8. Repositories, deployments and environments

| Item | Known value / last reported state |
| --- | --- |
| Repository | https://github.com/nikimpatel/ai-investment-coach |
| Production frontend | https://ai-investment-coach-cyan.vercel.app |
| Direct prototype | https://ai-investment-coach-cyan.vercel.app/#prototype |
| Backend health | https://ai-investment-coach-api.azurewebsites.net/api/health |
| Onboarding PR | https://github.com/nikimpatel/ai-investment-coach/pull/17 |
| Onboarding preview | https://ai-investment-coach-git-feat-onboar-99a503-nikimpatels-projects.vercel.app |
| Feature branch | `feat/onboarding-fullwidth-walkthrough` |
| Feature head that merged | `00251128db395a6541e3f3617bd84372b862723c` |
| Current main / production commit | `525455f7f58425548fedeae1e75045123928b517` |
| Sprint 4 final release SHA | `2f79043149c1570d49a8d6216dc563ffb3c7de6b` |
| Environment-only main update | `6450bb1`, merged into the onboarding branch before PR #17 |
| Production deployment | GitHub deployment `6754319851`, created 30 September 2026, 07:50 UTC, state success, SHA `525455f` |
| Production page check | 2 October 2026: HTTP 200, briefing copy present, HTML SHA-256 `8a6765fe674ca99b8d2cb50ad3d4a3f9b83facf68dbc71086b32ba6ba3993d52`, same document as the 30 September deployment URL |
| Vercel project | `ai-investment-coach`, root `.`, production branch `main` |
| Azure resource group | `ai-investment-coach-rg` |
| Azure App Service plan | `ai-investment-coach-plan`, Linux F1 Free |
| Azure Web App | `ai-investment-coach-api`, .NET 8, Australia East |
| Local frontend | http://localhost:3000 |
| Local backend | http://localhost:5080 |

Deployment design:

- Vercel native Git integration deploys the frontend from main.
- GitHub Actions deploys the backend using repository-specific Azure OIDC.
- Azure deployment role is Website Contributor scoped to the Web App.
- Backend is HTTPS-only.
- Temporary token-based Vercel workflow credentials/settings were removed after native integration was confirmed.
- Recorded F1 incremental plan cost was USD $0; this is a historical configuration, not a fresh pricing quote.
- F1 cold starts, lack of SLA and 60 CPU-minutes/day are documented limitations.
- The public release was verified without application login. Preview access protection may differ; do not assume preview is public without checking.

Configuration names only, no secret values:

- Frontend server-side: `API_BASE_URL`.
- Backend: `ASPNETCORE_ENVIRONMENT`, `SEC__UseFixtureData`.
- Live SEC if explicitly enabled: `SEC__ApplicationName`, `SEC__ContactEmail`, plus base URL/cache/timeout options.
- GitHub Azure deployment settings: `AZURE_INVESTMENT_COACH_CLIENT_ID`, `AZURE_INVESTMENT_COACH_TENANT_ID`, `AZURE_INVESTMENT_COACH_SUBSCRIPTION_ID`, `AZURE_INVESTMENT_COACH_WEBAPP_NAME`.

The public demo was configured for fixtures without a live SEC identity. Never copy credentials or actual SEC contact details into this document, Git or a new chat.

Personal Cursor / Cloud setup was reported ready. The user confirmed the onboarding work was in personal Cursor, not the old VM. Removal of the old project folder was discussed, but actual deletion was not confirmed. The distribution agent is separate from the coding agent.

## 9. Development history / completed sprints

| Phase | Major outcome | Evidence / status |
| --- | --- | --- |
| Phase 0 | Landing page, fictional Harborline research/thesis/decision/reflection walkthrough | Implemented |
| Sprint 0 | Harborline ten-year revenue chart, YoY/CAGR and observation to Thesis | Implemented; fictional sample data |
| Sprint 1 | Apple annual revenue, backend/proxy, normalization, chart/table, source metadata | Reviewed; 27 backend tests reported; live SEC verification later passed |
| Sprint 2 | Gross profit, operating income, net income, diluted EPS, margins, split-comparability handling | Reviewed; 59 backend tests reported |
| Sprint 3 | OCF, CapEx, FCF, cash, debt; cash conversion, FCF margin and net debt | Closed; 96 backend tests; product PR #9; final-verification PR #10 |
| Sprint 4 planning | Guided product loop selected over more metrics or desktop work | Locked plan commit `a2a482e6ecb29b54a036a1e309be61f61aeff321` |
| Sprint 4 release | Guided Apple analysis, bias reflection, summary, thesis packets, persistence and public hosting | PRs #11–#15 merged; final main `2f79043` |
| Environment setup | Personal Cursor / Cloud environment readiness | PR #16 reported merged; later main `6450bb1` environment changes |
| Onboarding, documented under Sprint 5 | Briefing, readable responsive layout, optional phone preview and coach strip | PR #17 merged as `525455f`; production smoke test passed 30 September 2026 |

Sprint 4 release reports record:
- Frontend: 10 tests, typecheck, lint, production build and CI passed.
- Backend: 96 tests; Release build with zero warnings/errors.
- Logged-out production acceptance on desktop/mobile.
- Ten Apple metric controls, guide, source badges, Summary, Thesis integration and persistence exercised.

Onboarding sequence:

| Slice / change | Result / commit |
| --- | --- |
| Slice 1: briefing + CTA | `53a5f4f`; 12 frontend tests reported, checks and browser verification passed |
| Slice 2: responsive layout + phone toggle | `ec11aa2`; state survived toggles/resizes |
| Environment merge | origin/main environment changes merged cleanly |
| Slice 3: coach strip | `1b5e0c3` — `feat: add walkthrough step coaching` |
| Phone-frame clipping fix | `ae20c15` |
| Slice 4: combined verification and evidence | `0025112` — `docs: record onboarding verification` |
| Slice 5: push and PR | PR #17; Frontend, Backend, Vercel and Vercel Preview Comments passed |
| Release | Merge commit `525455f` on 30 September 2026. Production deployment succeeded. Smoke test passed on desktop and mobile. |

Do not confuse the original SEC proposal's tentative sprint numbering with executed work: its “Sprint 3 company search / Sprint 4 AI explanation” roadmap was superseded. Actual Sprint 3 delivered cash/debt; actual Sprint 4 delivered deterministic guided analysis.

## 10. Current product status

**Current production:** Sprint 4 plus the onboarding release. `main` and the Vercel production deployment are `525455f7f58425548fedeae1e75045123928b517`. The production page was checked again on 2 October 2026 and still serves the onboarding briefing.

**Onboarding release:** PR #17 is merged. Its head remained `0025112`. CI on that head passed before merge: Frontend, Backend, Vercel, and Vercel Preview Comments. There were no review comments. The founder approved the experience, then the merge used the repository’s normal merge commit. A fresh production browser session on 30 September 2026 passed briefing Start/Skip, wide layout, phone preview, mobile layout without a bezel, coach updates, hidden coach during guided Apple analysis, Apple loading, reload persistence, and Restart. No application console, hydration, or API errors were recorded in that session.

Reported combined browser verification:
- 1440×900 desktop.
- 768×900 tablet.
- 390×844 mobile.
- Briefing, Start/Skip, focus, reload and Restart.
- Wide layout, phone preview and state retention across breakpoint changes.
- Five coach lines and hidden coach/rail during the guide.
- Apple progress persistence.

Evidence locations:
- `docs/sprint5/ONBOARDING_REPORT.md`.
- Six `docs/deployment/evidence/slice4-*.png` files; exact basenames should be read from the repository.
- `docs/deployment/PUBLIC_DEMO_DEPLOYMENT_REPORT.md`.
- `docs/sprint4/SPRINT4_IMPLEMENTATION_REPORT.md`.

The ChatGPT handoff correctly treated a drafted merge prompt as insufficient evidence. The 30 September production smoke test and the 2 October recheck are the confirmation. Reset’s confirming action was not clicked during that smoke test; Cancel behavior was checked earlier in local verification. Start was checked on desktop and Skip on mobile.

## 11. Known issues / unfinished work

1. **Onboarding release is live.** Further product work should start from `525455f`, not from an open PR #17.
2. **Founder approved the onboarding experience** on 30 September 2026. That approval is not evidence that outside testers find the interface clear.
3. **Market validation incomplete:** no confirmed five-tester results, retention data or paid demand.
4. **Distribution Scout report missing:** user said it was set up and run; output and outcomes were not shared.
5. **Local-only persistence:** no account sync, recovery or cross-device learner history. Harborline and thesis packets are transient.
6. **Financial coverage limits:** Apple-only; annual; some metrics partially supported; EPS has eight comparable years.
7. **Fixture freshness:** historical captured SEC evidence, not continuous live refresh. Do not relabel the dataset as the latest ten years without updating and validating it.
8. **F1 capacity:** cold starts and daily CPU quota may limit public-demo traffic.
9. **Early-access conversion:** earlier inspection found an empty CTA configuration / placeholder behavior. Onboarding changes CTA priority; a functioning signup collection destination was not confirmed.
10. **Documentation drift:** older README/backend README contain Sprint 1-only descriptions. Reconcile against later verified reports when needed.
11. **Historical local tooling warnings:** Windows junction/workspace-root warning and CI action-runtime migration annotations were documented. Later onboarding checks passed; whether those warnings remain relevant is unverified.
12. **No confirmed deletion of the old VM copy:** this is an environment housekeeping item, not a product blocker.

## 12. Distribution strategy and experiments

The immediate goal is to recruit **five relevant testers**, observe use, and learn whether the thinking loop is understandable and valuable before adding features.

Discussed approaches:
- Share the public demo with friends who fit the target audience.
- Find beginner/intermediate investor conversations about research, financial statements, thesis-writing, uncertainty, emotional decisions and journaling.
- Contribute something useful to a community conversation before mentioning the product.
- Disclose the founder relationship and respect community promotion rules.
- Ask for specific feedback rather than general compliments.
- Use agents for research, drafts and tracking; retain human control of outreach.

The user set up and ran **“Investment Coach — Distribution Scout”** in Cursor. This is confirmed as a setup/run report, not as successful recruitment.

Scheduling suggestions varied across conversations (twice weekly versus Mon/Wed/Fri). The actual active schedule and memory settings are not confirmed. Inspect the existing agent; do not create a duplicate automation.

A broader distribution workflow was proposed:
**Opportunity → human-approved experiment → real feedback/results → scoped product task → reviewed PR.**

An earlier 15–20-investor interview plan was a suggestion, not completed research. No paid campaign, confirmed launch post, verified signup count, revenue or conversion rate is available.

## 13. Real user/community feedback and learnings

| Evidence | What is actually known | Interpretation |
| --- | --- | --- |
| Founder used the demo and found the phone tiny | Direct user report in this project | Desktop readability needed improvement |
| Founder found the first screen unclear | Direct user report | Add context before interaction |
| Cursor proposed briefing, full width, step coaching and CTA changes | Implemented in PR #17 and released | Founder approved it; outside tester feedback is still missing |
| User reviewed Reddit discussions about AI investing and shared a similar-product link | Discussion occurred; exact links/quotes were not recovered for this archive | Do not invent community consensus or competitive conclusions |
| Browser and CI reports passed | Engineering verification, reported by Cursor and release docs | Not evidence of market demand |
| Distribution Scout ran | User report | No verified opportunities, responses or testers yet in this record |
| Friends/testers were to be invited | Drafting/planning discussed | No actual friend responses or completion outcomes recorded |

The hypothesis that evidence plus guided reflection differentiates this product remains unvalidated. Do not claim that no competitor offers ten-year charts, thesis tools or coaching. A current competitor study would be separate work.

## 14. Metrics we are measuring or intend to measure

No production analytics or tracking were deployed in the documented Sprint 4 release. Onboarding did not authorize adding them. The following are proposed validation measures, not an existing dashboard.

| Measure | Practical definition / initial method |
| --- | --- |
| Tester recruitment | Count actual agreed testers separately from invitations or drafts; initial target five |
| Product comprehension | After the briefing, ask the learner to describe what the product helps them do |
| Walkthrough completion | Observe which steps they reach and where they stop |
| Time and friction | Record approximate completion time, confusing language and blocked actions |
| Evidence-to-thesis use | Observe whether they can save and explain an evidence packet |
| Reflection value | Ask what, if anything, made them reconsider a judgment; avoid leading questions |
| Return intent | Ask what real future task would make them return |
| Actual return use | Record a later confirmed revisit separately from stated intent |
| Second-company demand | Capture unsolicited requests and which company/task they need |
| Distribution performance | Verified opportunities, approved outreach, messages actually sent, replies, sessions and useful feedback |
| Reliability | Existing CI, API/source correctness, persistence, responsive usability and production smoke checks |

Five testers is a learning target, not a statistical proof of product-market fit. Do not invent pass thresholds or describe technical test counts as adoption metrics.

## 15. Important prompts and workflows to preserve

### A. Cursor coding and review workflow

1. Confirm repository, branch, current SHA, working-tree status and remote state.
2. Read relevant repository instructions, sprint acceptance criteria and installed Next.js docs.
3. Implement one agreed slice at a time.
4. Keep related changes in small focused commits; preserve user work.
5. Verify behavior, not just compilation.
6. Record genuine results and limitations; capture relevant browser evidence.
7. Push the feature branch and open a PR only when instructed.
8. Do not merge or deploy production until authorized.
9. After release, verify the deployed commit and actual public behavior.

Frontend commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Frontend tests use the existing Node runner. Backend validation uses the existing .NET solution and xUnit tests. Live SEC checks are opt-in with configured identification; fixtures require no SEC identity.

Onboarding was deliberately split into:
1. Briefing and CTAs.
2. Responsive wide layout and phone toggle.
3. Step coach strip.
4. Combined browser evidence and report.
5. Push, PR and CI review.
6. Separately authorized merge and production smoke test.

### B. Exact coach-strip copy

- Research: “Why does this idea interest you? Don't pick a stock yet.”
- Finance: “Look at ten years of numbers before you write a story.”
- Thesis: “Write down what would prove you wrong.”
- Decision: “Record your stance and what would make you reconsider.”
- Reflect: “This is the product: a playbook of your habits, not a return score.”

The strip belongs inside PrototypeApp because guidedOpen is private there. It wraps on small screens and hides during guided analysis.

### C. Reusable continuation / status prompt

> Read docs/PROJECT_MASTER_SUMMARY.md and the repository's applicable instructions. Work only in nikimpatel/ai-investment-coach. First perform a read-only status reconciliation: inspect local changes, origin/main, PR #17, its current head and checks, the onboarding report, and the deployed production commit if accessible. Separate implemented, committed, pushed, reviewed, merged and deployed. Do not restart completed sprints, apply old experimental patches, reset work, or assume the old 0025112 head is still current. Return the confirmed state, discrepancies, and the smallest next action. Do not change code or deploy during this status check.

### D. Conditional PR #17 release workflow

This is a preserved workflow, not new authorization:

> After Nikita approves the onboarding experience, verify PR #17's current head, required checks, mergeability and unresolved blocking findings. The previously reviewed head was 0025112; summarize any later changes before release. Merge using the repository's normal permitted method without bypassing protections. Let the existing Vercel main integration deploy. Verify the deployment corresponds to the merged commit. In a fresh test browser, check briefing/Start/Skip, desktop wide and phone modes, mobile layout, coach visibility, Apple loading, persistence and Restart. Return merged SHA, deployment status, URL, real smoke-test results and limitations. Do not change Azure, credentials or hosting configuration for this frontend release.

### E. Investment Coach — Distribution Scout workflow

Purpose: find a small number of relevant opportunities and draft useful contributions, not automatically post.

Reusable agent brief:

> You are the Investment Coach — Distribution Scout for nikimpatel/ai-investment-coach.
>
> Read the current product/release documentation and record the source SHA. Distinguish deployed features from plans and open PRs. Verify the demo link where accessible. Do not run builds or modify the repository.
>
> Find up to three relevant public conversations, preferably within seven days, expanding to thirty days if necessary. Look for beginner/intermediate investors discussing research difficulty, financial statements, theses, uncertainty, bias, emotional investing, journaling or AI explanations.
>
> Read the actual sources. For each opportunity provide its URL, date, the specific relevant need, why our current product fits, a useful contribution, and the community's current promotion rules with a source or explicit uncertainty.
>
> Draft a tailored, helpful reply. If mentioning the product, disclose that the human poster is its builder and include a link only when allowed. Do not claim shipped AI capabilities we lack or promise investment outcomes.
>
> Recommend one ten-minute human action and one learning question. Prefer a few strong opportunities over invented filler. If source access is blocked or no suitable opportunity exists, say so.
>
> Use available memory for deduplication, actual past outreach, objections and confirmed results. Drafted is not sent; an agent run is not recruitment.
>
> Do not post, DM, email, contact moderators, submit forms, join groups, create accounts, buy services, collect private contact data, alter files, open PRs, deploy, or provide Buy/Sell/Hold advice. Return the report for human review only.

The original setup asked for a manual run before scheduling. Current scheduling and the first report still need to be checked.

## 16. Things deliberately not built yet

- Additional companies, broad company search or complete US-market coverage.
- Quarterly/TTM and intraday data, real-time prices or continuous monitoring.
- Valuation models, price targets, rankings, investment scores or forecasts.
- Peer comparisons, analyst estimates, portfolio tools or brokerage integration.
- Full filing-text or earnings-call analysis.
- Paid financial-data providers, non-US coverage or crypto.
- LLM integration and dynamic personalized AI critique.
- Authentication, persistent database, cross-device sync or server-side learner memory.
- Production analytics and tracking.
- Automatic community posting or outreach.
- A new /walkthrough route, autoplay video, tooltip tours or third-party onboarding widgets.
- New financial logic or backend work as part of onboarding.

Some are future possibilities, not permanent bans. Reopening them requires user evidence and an explicit scope decision.

## 17. Open questions / hypotheses needing validation

1. Does the new briefing let a first-time visitor explain the product accurately?
2. Does the wide workspace solve readability without making the loop feel lengthy?
3. Is switching between fictional Harborline and real Apple clear or confusing?
4. Can users complete a useful core loop in roughly five minutes? That duration is copy, not a measured result.
5. Are bias prompts and analogies useful, distracting or too heavy?
6. Does the learner value a structured summary and counter-evidence enough to return?
7. Is “AI Investment Coach” an appropriate name while the product is deterministic?
8. What is the next evidenced need: clearer flow, deeper reflection, a second company, persistence or genuine AI?
9. Will people pay, for what, and under which pricing model? No pricing is locked.
10. Which community/channel produces relevant users rather than low-signal praise?
11. Does the public backend remain responsive under actual tester traffic?
12. Is early-access collection configured and useful at this stage?
13. Answered on 2 October 2026: PR #17 merged as `525455f`, and the 30 September production smoke test passed. Remaining uncertainty is tester learning, not the release itself.

## 18. Recommended next five actions

1. **Release state is reconciled.** `main` is `525455f`. Do not rebuild the briefing, layout, or coach strip.
2. **Use the released demo for learning.** Production is https://ai-investment-coach-cyan.vercel.app/#prototype. Do not open another onboarding release unless a new defect appears.
3. **Review the existing Scout's first report.** Check real sources, relevance, promotion rules and draft quality; choose one human outreach action. Avoid creating another agent.
4. **Recruit and observe five relevant testers.** Use the released demo, ask them to explain it, watch where they stop, and collect specific usefulness/confusion evidence. Record actual actions and responses.
5. **Choose one evidence-backed next slice.** Summarize repeated problems and requests, update the backlog and this handoff, and scope one improvement. Do not start another feature sprint solely because implementation is easy.

## 19. Project principles / guardrails

- This is a personal project. Use only its repository, accounts and resources.
- Keep facts, calculations, explanations, analogies, learner judgments and reflections distinguishable.
- No invented values, sources, citations, test results, user feedback or deployment claims.
- Preserve SEC provenance and partial-support warnings. Never “fix” missing years with guessed data.
- Educational bias checks are invitations to reflect, not diagnoses.
- The learner may defer, remain uncertain or complete review later.
- Keep historical source badges with saved evidence.
- Preserve Restart versus Reset behavior and browser-local privacy.
- Preserve the same mounted app across presentation changes.
- Keep keyboard access, focus behavior and small-screen readability.
- Work in small reviewable slices and explain what changed, why and how it was checked.
- Do not add dependencies, infrastructure or financial scope without a concrete need.
- Do not post or send messages through agents without explicit authorization.
- Green CI is not proof of usability, adoption or product-market fit.
- A plan is not implementation; implementation is not deployment; a draft is not outreach.
- Treat old snapshots and assistant-generated patches as historical material until reconciled.
- Do not repeatedly ask the user to reapprove already locked decisions; ask only when a real new decision is required.

## 20. Continuation instructions for another AI assistant

Begin by reading this file. The user prefers one practical step or Cursor prompt at a time and uses ChatGPT for product reasoning, planning, review and distribution support. Cursor performs implementation in the personal repository.

The release status was reconciled on 2 October 2026. Do not repeat that audit unless `main` or production has moved. Your first product task is tester learning, not another sprint plan:
- Work in nikimpatel/ai-investment-coach. Current confirmed `main` is `525455f`.
- Read the onboarding report and `slice4-*.png` screenshots if reviewing that work.
- Identify any commits after `525455f` before changing code.
- Ask for missing Scout output or tester feedback only when it changes the next action.

Do not:
- Say Sprint 4 has not started.
- Repeat the ten locked Sprint 4 product questions.
- Reimplement the briefing, layout or coach strip without inspecting PR #17.
- Treat the original broad SEC proposal as a current committed roadmap.
- Apply the old experimental Sprint 4 patch.
- Assume Harborline/Thesis packets persist just because guided Apple analysis does.
- Claim current LLM, database, account, multi-company or live-monitoring capabilities.
- Use any separate agency-product code, domain model, CSV-import issue or environment as this project's baseline.
- Merge or deploy merely because a historical prompt in this archive describes how.

Read these supporting repository files when available:
- `AGENTS.md`, `README.md`, `package.json`, lockfile and applicable configuration examples.
- `docs/sprint4/SPRINT4_PLAN.md`.
- `docs/sprint4/SPRINT4_IMPLEMENTATION_REPORT.md`.
- `docs/sprint5/ONBOARDING_REPORT.md`.
- `docs/deployment/PUBLIC_DEMO_DEPLOYMENT_REPORT.md`.
- `docs/deployment/evidence/`, especially `slice4-*.png`.
- Sprint 1 review/live-verification reports, Sprint 2 implementation/review, Sprint 3 implementation/review.
- `backend/README.md` and fixture documentation, interpreted alongside newer sprint reports.

When new evidence arrives, update this summary with the exact scope and verification date. Keep the old release history, but make the newest confirmed status unmistakable.

The onboarding release is verified. The next milestone is real tester learning, not feature expansion by default.

---

## Migration Checklist

- Copy **this file** into the new ChatGPT Project; save a repository copy as `docs/PROJECT_MASTER_SUMMARY.md`.
- Add the repository URL, PR #17 URL, production URL, feature head `0025112`, and production/main SHA `525455f`.
- Copy the Sprint 4 plan/report, onboarding report, deployment report and six `slice4-*.png` screenshots from the current repository.
- Copy the Distribution Scout instructions, actual schedule/settings, first report and any real tester feedback once available.
- Keep source code in the personal GitHub repository. Reconnect access separately; never copy credentials, .env values, employer files or the obsolete experimental Sprint 4 patch.

