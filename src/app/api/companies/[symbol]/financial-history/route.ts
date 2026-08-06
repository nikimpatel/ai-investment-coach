import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_BASE = "http://localhost:5080";

/**
 * Proxies financial-history requests to the .NET TenYearExplorer API.
 * SEC User-Agent stays on the backend only.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await context.params;
  const upstreamBase =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_BASE;

  const search = request.nextUrl.searchParams.toString();
  const url = `${upstreamBase.replace(/\/$/, "")}/api/companies/${encodeURIComponent(symbol)}/financial-history${search ? `?${search}` : ""}`;

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
    return NextResponse.json(
      {
        status: "ProviderUnavailable",
        company: { name: "Apple Inc.", symbol: "AAPL", cik: "0000320193" },
        symbol: "AAPL",
        cik: "0000320193",
        currency: "USD",
        metric: "revenue",
        metricLabel: "",
        metricDescription: "",
        reportingUnit: "",
        displayFormat: "currency",
        period: "annual",
        years: 10,
        points: [],
        summary: null,
        margins: null,
        sourceProvider: "SEC EDGAR",
        retrievedAtUtc: new Date().toISOString(),
        cacheStatus: "Bypassed",
        warnings: [
          {
            code: "PROVIDER_UNAVAILABLE",
            message: `Could not reach API at ${upstreamBase}. Start the .NET backend on port 5080.`,
            fiscalYear: null,
            concept: null,
          },
        ],
        detail: `Could not reach API at ${upstreamBase}.`,
      },
      { status: 503 },
    );
  }
}
