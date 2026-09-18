# Azure Deployment Plan — AI Investment Coach API

**Status:** Validated
**Prepared:** 2026-09-18
**Application mode:** Existing application, separate public-demo deployment
**Target:** Linux Azure Web App, .NET 8, fixture mode

## 1. Safety boundaries

- Authenticate through an isolated Azure CLI config to a personal Azure account.
- Do not use or modify the currently configured Flow Power/kWatch subscription.
- Do not modify, redeploy, reuse, or read credentials from `agency-cfo-api`.
- Create a separate Web App and deployment identity for AI Investment Coach.
- Do not provision a billable plan until the user approves the validated incremental cost.

## 2. Application

- Project: `backend/src/TenYearExplorer.Api/TenYearExplorer.Api.csproj`
- Runtime: .NET 8, Linux
- Health endpoint: `/api/health`
- Data mode: `SEC__UseFixtureData=true`
- Persistent services: none
- Secrets required by runtime: none
- SEC identity settings: intentionally omitted

## 3. Planned Azure resources

- Subscription: `Azure subscription 1` in the isolated personal CLI profile
- Region: Australia East (`australiaeast`)
- Resource group: `ai-investment-coach-rg` (new and separate)
- App Service plan: `ai-investment-coach-plan`, Linux F1 Free
- Incremental plan cost: USD $0; user approved F1 with its cold-start and 60 CPU-minutes/day limitations
- Existing AgencyCFO plan: Windows F1; incompatible with Linux and explicitly not reused or modified
- Web App: `ai-investment-coach-api` (use a short non-personal suffix only if unavailable)
- Deployment identity: GitHub OIDC scoped only to the new resource

## 4. Repository deployment

- Workflow: `.github/workflows/deploy-backend.yml`
- Trigger: push to `main` and manual dispatch
- Build: Release restore/build/test/publish
- Guard: assert both reduced fixture files exist in publish output
- Deployment: `azure/webapps-deploy`

## 5. Validation gates

- Complete local frontend and backend checks
- Validate Azure context is personal before any resource query
- Validate F1 Linux availability in Australia East and `.NET 8` Linux runtime support
- Validate `Microsoft.Web` provider registration and target names
- Validate dedicated workflow permissions and secret/variable names
- Validate App Service configuration and deployment workflow
- Verify `/api/health` and all ten supported metrics after deployment
- Verify responses expose no credentials or internal configuration

## 6. Rollback

- Redeploy the previous successful GitHub Actions artifact/commit to the new Web App
- Do not alter any other Web App or App Service plan

## 7. Validation proof

Validated on 2026-09-18 before provisioning:

- Isolated Azure CLI context: `Azure subscription 1`; personal tenant matched.
- `Microsoft.Web` provider: `Registered`.
- Australia East accepts Linux F1: `true`.
- Linux runtime list contains `DOTNETCORE:8.0`: `true`.
- `ai-investment-coach-rg` did not already exist.
- `ai-investment-coach-api` did not exist in the personal subscription and its
  public hostname did not resolve before provisioning.
- Existing AgencyCFO plan is Windows F1 and was not selected.
- Official retail API showed Linux B1 at USD $0.019/hour; user instead approved
  Linux F1 at USD $0 incremental plan cost.
- Local frontend: `npm test` 10/10, typecheck, lint, and build passed.
- Local backend: Release build 0 warnings/errors; tests 96/96.
- Published API contained both reduced fixture JSON files.
- Deployment workflow statically reviewed: read-only contents permission,
  `id-token: write`, dedicated investment-coach OIDC names, Release tests, and
  fixture-presence checks.
- `git diff --check` returned no whitespace errors (line-ending advisory only).
