import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE = "http://localhost:5080";

function getUpstreamBase(): string | null {
  const configured = process.env.API_BASE_URL?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE;
  }
  return null;
}

function providerUnavailable(metric: string, detail: string) {
  return NextResponse.json(
    {
      status: "ProviderUnavailable",
      company: { name: "Apple Inc.", symbol: "AAPL", cik: "0000320193" },
      symbol: "AAPL",
      cik: "0000320193",
      currency: "USD",
      metric,
      metricLabel: "",
      metricDescription: "",
      reportingUnit: "",
      displayFormat: "currency",
      period: "annual",
      years: 10,
      points: [],
      summary: null,
      margins: null,
      relationships: null,
      isDerived: false,
      isNonGaap: false,
      formula: null,
      sourceProvider: "SEC EDGAR",
      retrievedAtUtc: new Date().toISOString(),
      cacheStatus: "Bypassed",
      warnings: [
        {
          code: "PROVIDER_UNAVAILABLE",
          message: detail,
          fiscalYear: null,
          concept: null,
        },
      ],
      detail,
    },
    { status: 503 },
  );
}

/**
 * Proxies financial-history requests to the .NET TenYearExplorer API.
 * SEC User-Agent stays on the backend only.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await context.params;
  const upstreamBase = getUpstreamBase();
  const metric = request.nextUrl.searchParams.get("metric") || "revenue";
  if (!upstreamBase) {
    return providerUnavailable(
      metric,
      "The financial data service is not configured for this deployment.",
    );
  }

  let upstreamOrigin: string;
  try {
    upstreamOrigin = new URL(upstreamBase).origin;
  } catch {
    return providerUnavailable(
      metric,
      "The financial data service configuration is invalid.",
    );
  }

  const search = request.nextUrl.searchParams.toString();
  const url = `${upstreamOrigin}/api/companies/${encodeURIComponent(symbol)}/financial-history${search ? `?${search}` : ""}`;

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return providerUnavailable(
      metric,
      "The financial data service is temporarily unavailable.",
    );
  }
}
