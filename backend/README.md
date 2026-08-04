# Ten-Year Financial Performance Explorer — Backend (Sprint 1)

Minimal .NET 8 Web API for the AI Investment Coach Apple revenue PoC.

**Why a separate backend?** The Learning repo’s existing `backend/` is Agency CFO–specific (Clerk, PostgreSQL, agency domain). Sprint 1 lives here under `ai-investment-coach/backend` to keep SEC/financial history isolated from Agency CFO product rules.

## Stack

- .NET 8 Web API, C#, DI, nullable reference types
- No PostgreSQL / persistent DB
- In-memory cache with configurable duration
- SEC EDGAR Company Facts + Submissions (or offline fixtures)

## Projects

| Project | Role |
| --- | --- |
| `TenYearExplorer.Api` | Controllers, DTOs, Swagger, CORS |
| `TenYearExplorer.Application` | Interfaces, normalizer, calculator, history service, SEC options |
| `TenYearExplorer.Domain` | Domain models / enums |
| `TenYearExplorer.Infrastructure` | SEC HTTP client, fixture client, facts provider, memory cache |
| `TenYearExplorer.Tests` | xUnit fixture-based tests (+ opt-in live test) |

## Run

```powershell
cd ai-investment-coach/backend
dotnet restore
dotnet run --project src/TenYearExplorer.Api
```

- API: [http://localhost:5080](http://localhost:5080)
- Swagger (Development): [http://localhost:5080/swagger](http://localhost:5080/swagger)
- Health: `GET /api/health`
- History: `GET /api/companies/AAPL/financial-history?metric=revenue&period=annual&years=10`

Default local mode uses **fixtures** (`SEC:UseFixtureData=true`) so the API works without SEC identity.

## SEC configuration

Official SEC fair-access policy requires an identifying `User-Agent` (`ApplicationName` + `ContactEmail`). The API **never** returns these values to the frontend. Live requests are refused if identification is missing or placeholder.

Example (`appsettings.Example.json` / `.env.example`):

```json
{
  "SEC": {
    "ApplicationName": "YOUR_NAME TenYearExplorer",
    "ContactEmail": "your-email@example.com",
    "BaseUrl": "https://data.sec.gov",
    "CacheDurationMinutes": 60,
    "RequestTimeoutSeconds": 30,
    "UseFixtureData": false
  }
}
```

Environment variables:

- `SEC__ApplicationName`
- `SEC__ContactEmail`
- `SEC__BaseUrl`
- `SEC__CacheDurationMinutes`
- `SEC__RequestTimeoutSeconds`
- `SEC__UseFixtureData`

Do **not** commit real personal email or secrets.

### Why User-Agent is required

SEC EDGAR asks automated clients to identify themselves (app name + contact). Anonymous scrapers risk blocking and violate fair-access expectations. This API fails closed when identity is not configured.

## Fixtures

See `fixtures/FIXTURE_README.md`. Offline tests load reduced Apple Company Facts / Submissions JSON. Live capture was blocked in environments without SEC identity.

## Tests

```powershell
cd ai-investment-coach/backend
dotnet test
```

Opt-in live SEC check (same suite stays offline by default):

```powershell
$env:SEC__ApplicationName = "YOUR_NAME TenYearExplorer"
$env:SEC__ContactEmail = "you@example.com"
$env:SEC__UseFixtureData = "false"
dotnet test --filter Live_CompanyFacts_Reachable_For_Apple
```

## Cache

In-memory, keyed by `symbol|metric|period|years`. Successful responses are cached for `CacheDurationMinutes`. Failures / cancellations are not cached. Response includes `cacheStatus`: `Hit` | `Miss` | `Bypassed`.

## Supported scope (Sprint 1)

- Company: Apple Inc. (`AAPL`, CIK `0000320193`)
- Metric: `revenue` (annual)
- Years: `10`
- No company search, other KPIs, auth, or database

## Known limitations

- Fixture mode is not a live SEC download; re-capture when identity is available.
- Only Apple / revenue / annual / 10 years.
- Comparative XBRL facts are handled deterministically; unresolved conflicts are excluded with warnings rather than guessed.
