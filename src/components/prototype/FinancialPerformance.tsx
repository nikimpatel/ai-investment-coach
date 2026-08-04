"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AlertCircle } from "@/components/ui/icons";
import {
  fetchAppleRevenueHistory,
  type AppleFinancialHistoryResponse,
  type AppleFinancialPoint,
} from "@/lib/apple-financial-api";
import {
  buildAppleBeginnerExplanation,
  buildAppleSummarySentences,
  DEFAULT_APPLE_OBSERVATION,
} from "@/lib/apple-trend-copy";
import {
  buildBeginnerExplanation,
  buildSummarySentences,
  buildTrendSummary,
  formatCompactCurrency,
  formatExactCurrency,
  formatPercent,
} from "@/lib/financial-calcs";
import {
  DEFAULT_PERFORMANCE_OBSERVATION,
  PERFORMANCE_FOLLOW_UP_QUESTIONS,
  financialKpiOptions,
  harborlineRevenueSeries,
} from "@/lib/harborline-financials";

type ViewMode = "chart" | "table";
type DatasetMode = "harborline" | "apple";

interface FinancialPerformanceProps {
  performanceObservation: string;
  onObservationChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function FinancialPerformance({
  performanceObservation,
  onObservationChange,
  onBack,
  onContinue,
}: FinancialPerformanceProps) {
  const [dataset, setDataset] = useState<DatasetMode>("harborline");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [draftObservation, setDraftObservation] = useState(
    performanceObservation.trim()
      ? performanceObservation
      : DEFAULT_PERFORMANCE_OBSERVATION,
  );
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [appleData, setAppleData] = useState<AppleFinancialHistoryResponse | null>(
    null,
  );
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleFetchError, setAppleFetchError] = useState<string | null>(null);
  const [expandedFilingYear, setExpandedFilingYear] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (dataset !== "apple") return;

    let cancelled = false;

    async function loadAppleHistory() {
      setAppleLoading(true);
      setAppleFetchError(null);
      try {
        const payload = await fetchAppleRevenueHistory();
        if (!cancelled) {
          setAppleData(payload);
          if (
            !performanceObservation.trim() &&
            (payload.status === "Success" ||
              payload.status === "PartiallySupported")
          ) {
            setDraftObservation(DEFAULT_APPLE_OBSERVATION);
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setAppleData(null);
          setAppleFetchError(
            error instanceof Error
              ? error.message
              : "Could not load Apple financial history.",
          );
        }
      } finally {
        if (!cancelled) setAppleLoading(false);
      }
    }

    void loadAppleHistory();

    return () => {
      cancelled = true;
    };
    // Intentionally depend only on dataset; observation draft is seeded once per successful load.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid refetch on every thesis observation edit
  }, [dataset]);

  const harborlineStats = useMemo(
    () => buildTrendSummary(harborlineRevenueSeries.points),
    [],
  );

  const observationInThesis = performanceObservation.trim().length > 0;

  const addObservation = () => {
    const next = draftObservation.trim();
    if (!next) return;
    onObservationChange(next);
    setConfirmMessage("Observation added to your thesis draft.");
  };

  const removeObservation = () => {
    onObservationChange("");
    setConfirmMessage("Observation removed from your thesis draft.");
  };

  const switchDataset = (next: DatasetMode) => {
    setDataset(next);
    setConfirmMessage(null);
    setViewMode("chart");
    setExpandedFilingYear(null);
    if (next === "harborline") {
      setDraftObservation(
        performanceObservation.trim()
          ? performanceObservation
          : DEFAULT_PERFORMANCE_OBSERVATION,
      );
    } else {
      // Avoid a one-frame empty state before the effect's async load starts.
      setAppleLoading(true);
      setAppleFetchError(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-deep">
          Financial performance
        </p>
        <h3 className="mt-1 font-display text-xl text-ink">
          {dataset === "harborline"
            ? harborlineRevenueSeries.companyName
            : "Apple Inc."}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Ten years of revenue history to interpret — not a buy, sell, or hold
          signal.
        </p>

        <div
          className="mt-3 inline-flex w-full rounded-xl border border-line p-0.5"
          role="tablist"
          aria-label="Dataset source"
        >
          {(
            [
              { id: "harborline", label: "Harborline demo" },
              { id: "apple", label: "Apple (SEC)" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={dataset === tab.id}
              onClick={() => switchDataset(tab.id)}
              className={`flex-1 rounded-[10px] px-2 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                dataset === tab.id
                  ? "bg-ink text-paper"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {dataset === "harborline" ? (
          <HarborlinePanel
            viewMode={viewMode}
            setViewMode={setViewMode}
            stats={harborlineStats}
            draftObservation={draftObservation}
            setDraftObservation={setDraftObservation}
            setConfirmMessage={setConfirmMessage}
            observationInThesis={observationInThesis}
            performanceObservation={performanceObservation}
            confirmMessage={confirmMessage}
            addObservation={addObservation}
            removeObservation={removeObservation}
          />
        ) : (
          <ApplePanel
            loading={appleLoading}
            fetchError={appleFetchError}
            data={appleData}
            viewMode={viewMode}
            setViewMode={setViewMode}
            expandedFilingYear={expandedFilingYear}
            setExpandedFilingYear={setExpandedFilingYear}
            draftObservation={draftObservation}
            setDraftObservation={setDraftObservation}
            setConfirmMessage={setConfirmMessage}
            observationInThesis={observationInThesis}
            performanceObservation={performanceObservation}
            confirmMessage={confirmMessage}
            addObservation={addObservation}
            removeObservation={removeObservation}
          />
        )}
      </div>

      <div className="flex gap-2 border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Build thesis
        </button>
      </div>
    </div>
  );
}

function HarborlinePanel({
  viewMode,
  setViewMode,
  stats,
  draftObservation,
  setDraftObservation,
  setConfirmMessage,
  observationInThesis,
  performanceObservation,
  confirmMessage,
  addObservation,
  removeObservation,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  stats: ReturnType<typeof buildTrendSummary>;
  draftObservation: string;
  setDraftObservation: (value: string) => void;
  setConfirmMessage: (value: string | null) => void;
  observationInThesis: boolean;
  performanceObservation: string;
  confirmMessage: string | null;
  addObservation: () => void;
  removeObservation: () => void;
}) {
  const series = harborlineRevenueSeries;
  if (!stats) return null;

  const summarySentences = buildSummarySentences(stats);
  const beginnerExplanation = buildBeginnerExplanation(stats);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-sand/80 bg-sand/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink/80">
          Fictional demonstration data
        </span>
        <span className="text-[10px] text-muted">{series.sourceLabel}</span>
      </div>

      <KpiSelector />

      <aside
        className="rounded-xl border border-line bg-mist px-3 py-2.5"
        role="status"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-deep" />
          <p className="text-[11px] leading-relaxed text-ink/80">
            Example data only. Figures are invented for Harborline Logistics to
            practice reading a decade of performance — they are not filings,
            market data, or investment advice.
          </p>
        </div>
      </aside>

      <ChartTableToggle viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === "chart" ? (
        <RevenueLineChart
          points={series.points.map((p) => ({
            fiscalYear: p.fiscalYear,
            fiscalYearEnd: p.fiscalYearEnd,
            value: p.value,
          }))}
          currency={series.currency}
          caption={`Annual revenue (${series.currency}) — demonstration levels only`}
        />
      ) : (
        <RevenueTable
          rows={series.points.map((p, index) => ({
            fiscalYear: p.fiscalYear,
            value: p.value,
            yoy: stats.yoy.find((y) => y.fiscalYear === p.fiscalYear)
              ?.relativeChange,
            key: `${p.fiscalYear}-${index}`,
          }))}
          currency={series.currency}
          caption="Exact annual revenue and year-over-year growth (demonstration data)"
        />
      )}

      <TrendSummaryCard
        cagr={stats.cagr}
        positive={stats.positiveGrowthYears}
        negative={stats.negativeGrowthYears}
        intervals={stats.intervals}
        startFy={stats.start.fiscalYear}
        endFy={stats.end.fiscalYear}
        sentences={summarySentences}
        beginnerExplanation={beginnerExplanation}
      />

      <FollowUpQuestions />
      <ObservationEditor
        companyHint="Harborline"
        draftObservation={draftObservation}
        setDraftObservation={setDraftObservation}
        setConfirmMessage={setConfirmMessage}
        observationInThesis={observationInThesis}
        performanceObservation={performanceObservation}
        confirmMessage={confirmMessage}
        addObservation={addObservation}
        removeObservation={removeObservation}
        canAdd
      />
    </>
  );
}

function ApplePanel({
  loading,
  fetchError,
  data,
  viewMode,
  setViewMode,
  expandedFilingYear,
  setExpandedFilingYear,
  draftObservation,
  setDraftObservation,
  setConfirmMessage,
  observationInThesis,
  performanceObservation,
  confirmMessage,
  addObservation,
  removeObservation,
}: {
  loading: boolean;
  fetchError: string | null;
  data: AppleFinancialHistoryResponse | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  expandedFilingYear: string | null;
  setExpandedFilingYear: (value: string | null) => void;
  draftObservation: string;
  setDraftObservation: (value: string) => void;
  setConfirmMessage: (value: string | null) => void;
  observationInThesis: boolean;
  performanceObservation: string;
  confirmMessage: string | null;
  addObservation: () => void;
  removeObservation: () => void;
}) {
  if (loading) {
    return (
      <p className="rounded-xl border border-line bg-mist px-3 py-4 text-sm text-muted" role="status">
        Loading Apple annual revenue from the API…
      </p>
    );
  }

  if (fetchError) {
    return (
      <StateBanner
        title="Could not load Apple data"
        body={fetchError}
      />
    );
  }

  if (!data) {
    return (
      <p
        className="rounded-xl border border-line bg-mist px-3 py-4 text-sm text-muted"
        role="status"
      >
        Loading Apple annual revenue from the API…
      </p>
    );
  }

  if (data.status === "InvalidConfiguration") {
    return (
      <StateBanner
        title="SEC configuration required for live data"
        body={
          data.detail ??
          "Configure SEC ApplicationName and ContactEmail on the .NET API, or enable fixture mode (SEC__UseFixtureData=true)."
        }
      />
    );
  }

  if (data.status === "ProviderUnavailable") {
    return (
      <StateBanner
        title="Financial API unavailable"
        body={
          data.detail ??
          "Start the TenYearExplorer API (http://localhost:5080) and try again."
        }
      />
    );
  }

  if (data.status === "UnsupportedMetric") {
    return (
      <StateBanner
        title="Unsupported request"
        body={data.detail ?? "Sprint 1 supports Apple annual revenue only."}
      />
    );
  }

  if (
    data.status === "InsufficientHistory" ||
    !data.summary ||
    data.points.length === 0
  ) {
    return (
      <StateBanner
        title="Insufficient reliable history"
        body={
          data.detail ??
          "Fewer than 10 reliable annual revenue points were available."
        }
        warnings={data.warnings}
      />
    );
  }

  const summarySentences = buildAppleSummarySentences(data);
  const beginnerExplanation = buildAppleBeginnerExplanation(data);
  const canAddObservation =
    data.status === "Success" || data.status === "PartiallySupported";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-accent/30 bg-accent/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-accent-deep">
          {data.sourceProvider.toLowerCase().includes("fixture")
            ? "Apple SEC (fixture)"
            : "Live Apple SEC data"}
        </span>
        <span className="text-[10px] text-muted">
          {data.company.name} · {data.symbol} · CIK {data.cik}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        Source: {data.sourceProvider} · Retrieved{" "}
        {new Date(data.retrievedAtUtc).toLocaleString()} · Cache{" "}
        {data.cacheStatus}
      </p>

      <KpiSelector />

      {data.warnings.length > 0 && (
        <aside
          className="rounded-xl border border-sand/80 bg-sand/20 px-3 py-2.5"
          role="status"
        >
          <p className="text-[11px] font-medium text-ink">Data notes</p>
          <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-ink/80">
            {data.warnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>
                {warning.message}
              </li>
            ))}
          </ul>
        </aside>
      )}

      <ChartTableToggle viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === "chart" ? (
        <RevenueLineChart
          points={data.points.map((p) => ({
            fiscalYear: p.fiscalYear,
            fiscalYearEnd: p.fiscalYearEnd,
            value: p.value,
          }))}
          currency={data.currency}
          caption={`Annual revenue (${data.currency}) from API — chart levels match the table`}
        />
      ) : (
        <AppleRevenueTable
          points={data.points}
          currency={data.currency}
          expandedFilingYear={expandedFilingYear}
          setExpandedFilingYear={setExpandedFilingYear}
        />
      )}

      <TrendSummaryCard
        cagr={data.summary.cagr}
        positive={data.summary.positiveGrowthYears}
        negative={data.summary.negativeGrowthYears}
        intervals={data.summary.intervals}
        startFy={data.summary.startFiscalYear}
        endFy={data.summary.endFiscalYear}
        sentences={summarySentences}
        beginnerExplanation={beginnerExplanation}
        highest={data.summary.highest}
        lowest={data.summary.lowest}
        currency={data.currency}
      />

      <FollowUpQuestions />
      <ObservationEditor
        companyHint="Apple"
        draftObservation={draftObservation}
        setDraftObservation={setDraftObservation}
        setConfirmMessage={setConfirmMessage}
        observationInThesis={observationInThesis}
        performanceObservation={performanceObservation}
        confirmMessage={confirmMessage}
        addObservation={addObservation}
        removeObservation={removeObservation}
        canAdd={canAddObservation}
        identityNote="Observation preserves Apple / revenue identity from the verified API response. It is not an investment conclusion."
      />
    </>
  );
}

function KpiSelector() {
  return (
    <section aria-labelledby="kpi-selector-label">
      <p id="kpi-selector-label" className="text-xs font-medium text-ink">
        KPI
      </p>
      <div
        className="mt-1.5 flex flex-wrap gap-2"
        role="group"
        aria-label="KPI selector"
      >
        {financialKpiOptions.map((kpi) => {
          const enabled = kpi.status === "enabled";
          return (
            <button
              key={kpi.id}
              type="button"
              disabled={!enabled}
              aria-pressed={enabled}
              className={`rounded-xl border px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                enabled
                  ? "border-accent bg-accent/5 text-ink"
                  : "border-line text-muted disabled:cursor-not-allowed disabled:opacity-45"
              }`}
            >
              {kpi.label}
              {!enabled ? " (soon)" : ""}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        Revenue is the only enabled KPI in Sprint 1.
      </p>
    </section>
  );
}

function ChartTableToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-line p-0.5"
      role="tablist"
      aria-label="Chart or table view"
    >
      {(
        [
          { id: "chart", label: "Chart" },
          { id: "table", label: "Table" },
        ] as const
      ).map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={viewMode === tab.id}
          onClick={() => setViewMode(tab.id)}
          className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            viewMode === tab.id
              ? "bg-ink text-paper"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TrendSummaryCard({
  cagr,
  positive,
  negative,
  intervals,
  startFy,
  endFy,
  sentences,
  beginnerExplanation,
  highest,
  lowest,
  currency = "USD",
}: {
  cagr: number | null;
  positive: number;
  negative: number;
  intervals: number;
  startFy: string;
  endFy: string;
  sentences: string[];
  beginnerExplanation: string;
  highest?: { fiscalYear: string; value: number } | null;
  lowest?: { fiscalYear: string; value: number } | null;
  currency?: string;
}) {
  return (
    <section
      aria-labelledby="trend-summary-heading"
      className="rounded-xl border border-line bg-paper px-3 py-3"
    >
      <h4 id="trend-summary-heading" className="text-sm font-medium text-ink">
        Ten-year trend summary
      </h4>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-mist px-2.5 py-2">
          <dt className="text-muted">CAGR</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {cagr === null ? "—" : formatPercent(cagr)}
          </dd>
        </div>
        <div className="rounded-lg bg-mist px-2.5 py-2">
          <dt className="text-muted">Positive growth years</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {positive} of {intervals}
          </dd>
        </div>
        <div className="rounded-lg bg-mist px-2.5 py-2">
          <dt className="text-muted">Negative growth years</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {negative} of {intervals}
          </dd>
        </div>
        <div className="rounded-lg bg-mist px-2.5 py-2">
          <dt className="text-muted">Span</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {startFy} → {endFy}
          </dd>
        </div>
        {highest && (
          <div className="rounded-lg bg-mist px-2.5 py-2">
            <dt className="text-muted">Highest</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {highest.fiscalYear} (
              {formatCompactCurrency(highest.value, currency)})
            </dd>
          </div>
        )}
        {lowest && (
          <div className="rounded-lg bg-mist px-2.5 py-2">
            <dt className="text-muted">Lowest</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {lowest.fiscalYear} (
              {formatCompactCurrency(lowest.value, currency)})
            </dd>
          </div>
        )}
      </dl>
      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink/85">
        {sentences.map((sentence) => (
          <li key={sentence}>• {sentence}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        {beginnerExplanation}
      </p>
    </section>
  );
}

function FollowUpQuestions() {
  return (
    <section aria-labelledby="follow-up-heading">
      <h4 id="follow-up-heading" className="text-sm font-medium text-ink">
        Questions to sit with
      </h4>
      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
        {PERFORMANCE_FOLLOW_UP_QUESTIONS.map((question) => (
          <li key={question} className="flex gap-2">
            <span className="text-accent" aria-hidden>
              ?
            </span>
            <span>{question}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ObservationEditor({
  companyHint,
  draftObservation,
  setDraftObservation,
  setConfirmMessage,
  observationInThesis,
  performanceObservation,
  confirmMessage,
  addObservation,
  removeObservation,
  canAdd,
  identityNote,
}: {
  companyHint: string;
  draftObservation: string;
  setDraftObservation: (value: string) => void;
  setConfirmMessage: (value: string | null) => void;
  observationInThesis: boolean;
  performanceObservation: string;
  confirmMessage: string | null;
  addObservation: () => void;
  removeObservation: () => void;
  canAdd: boolean;
  identityNote?: string;
}) {
  return (
    <section
      aria-labelledby="observation-heading"
      className="rounded-xl border border-line px-3 py-3"
    >
      <h4 id="observation-heading" className="text-sm font-medium text-ink">
        Add observation to thesis
      </h4>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Capture what this history suggests for your reasoning. An observation is
        not proof that {companyHint} is a good investment.
      </p>
      {identityNote && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          {identityNote}
        </p>
      )}
      <label className="mt-2 block">
        <span className="sr-only">Performance observation</span>
        <textarea
          value={draftObservation}
          onChange={(event) => {
            setDraftObservation(event.target.value);
            setConfirmMessage(null);
          }}
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addObservation}
          disabled={!canAdd || !draftObservation.trim()}
          className="rounded-xl bg-accent px-3 py-2 text-xs font-medium text-paper transition enabled:hover:bg-accent-deep disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {observationInThesis ? "Update in thesis" : "Add to thesis"}
        </button>
        {observationInThesis && (
          <button
            type="button"
            onClick={removeObservation}
            className="rounded-xl border border-line px-3 py-2 text-xs text-ink transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Remove from thesis
          </button>
        )}
      </div>
      {confirmMessage && (
        <p className="mt-2 text-[11px] text-accent-deep" role="status">
          {confirmMessage}
        </p>
      )}
      {observationInThesis && (
        <p className="mt-2 text-[11px] text-muted">
          Currently in thesis: “{performanceObservation}”
        </p>
      )}
    </section>
  );
}

function StateBanner({
  title,
  body,
  warnings,
}: {
  title: string;
  body: string;
  warnings?: AppleFinancialHistoryResponse["warnings"];
}) {
  return (
    <aside
      className="rounded-xl border border-line bg-mist px-3 py-3"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-deep" />
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{body}</p>
          {warnings && warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] text-ink/80">
              {warnings.map((warning) => (
                <li key={`${warning.code}-${warning.message}`}>
                  {warning.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

function RevenueLineChart({
  points,
  currency,
  caption,
}: {
  points: Array<{ fiscalYear: string; fiscalYearEnd: number; value: number }>;
  currency: string;
  caption: string;
}) {
  const gradientId = useId();
  const width = 320;
  const height = 168;
  const pad = { top: 16, right: 12, bottom: 28, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = points.map((p) => p.value);
  const min = Math.min(...values) * 0.92;
  const max = Math.max(...values) * 1.04;
  const range = max - min || 1;

  const coords = points.map((point, index) => {
    const x =
      pad.left +
      (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = pad.top + innerH - ((point.value - min) / range) * innerH;
    return { ...point, x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`;

  const yTicks = [min, (min + max) / 2, max];

  return (
    <figure className="rounded-xl border border-line bg-paper px-2 py-2">
      <figcaption className="px-1 pb-1 text-[11px] text-muted">{caption}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={points
          .map(
            (p) =>
              `${p.fiscalYear}: ${formatExactCurrency(p.value, currency)}`,
          )
          .join("; ")}
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = pad.top + innerH - ((tick - min) / range) * innerH;
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeWidth="1"
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--muted)]"
                fontSize="9"
              >
                {formatCompactCurrency(tick, currency)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent-deep)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coords.map((c) => (
          <g key={c.fiscalYear}>
            <circle
              cx={c.x}
              cy={c.y}
              r="3.2"
              fill="var(--paper)"
              stroke="var(--accent)"
              strokeWidth="1.6"
            >
              <title>
                {c.fiscalYear}: {formatExactCurrency(c.value, currency)}
              </title>
            </circle>
            <text
              x={c.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              fontSize="8"
            >
              {String(c.fiscalYearEnd).slice(2)}
            </text>
          </g>
        ))}
      </svg>
      <p className="sr-only">
        Accessible data table alternative is available via the Table tab.
        Values:{" "}
        {points
          .map((p) => `${p.fiscalYear} ${formatExactCurrency(p.value, currency)}`)
          .join(", ")}
        .
      </p>
    </figure>
  );
}

function RevenueTable({
  rows,
  currency,
  caption,
}: {
  rows: Array<{
    fiscalYear: string;
    value: number;
    yoy: number | null | undefined;
    key: string;
  }>;
  currency: string;
  caption: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[280px] border-collapse text-left text-xs">
        <caption className="border-b border-line px-3 py-2 text-left text-[11px] text-muted">
          {caption}
        </caption>
        <thead className="bg-mist text-[11px] text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Fiscal year
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Revenue
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              YoY
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-line">
              <th scope="row" className="px-3 py-2 font-medium text-ink">
                {row.fiscalYear}
              </th>
              <td className="px-3 py-2 tabular-nums text-ink">
                {formatExactCurrency(row.value, currency)}
                <span className="mt-0.5 block text-[10px] text-muted">
                  {formatCompactCurrency(row.value, currency)}
                </span>
              </td>
              <td className="px-3 py-2 tabular-nums text-ink">
                {row.yoy == null ? "—" : formatPercent(row.yoy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppleRevenueTable({
  points,
  currency,
  expandedFilingYear,
  setExpandedFilingYear,
}: {
  points: AppleFinancialPoint[];
  currency: string;
  expandedFilingYear: string | null;
  setExpandedFilingYear: (value: string | null) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[280px] border-collapse text-left text-xs">
        <caption className="border-b border-line px-3 py-2 text-left text-[11px] text-muted">
          Exact annual revenue and year-over-year growth from API (SEC-sourced)
        </caption>
        <thead className="bg-mist text-[11px] text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Fiscal year
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Revenue
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              YoY
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Filing
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => {
            const open = expandedFilingYear === point.fiscalYear;
            return (
              <tr key={point.fiscalYear} className="border-t border-line">
                <th scope="row" className="px-3 py-2 align-top font-medium text-ink">
                  {point.fiscalYear}
                </th>
                <td className="px-3 py-2 align-top tabular-nums text-ink">
                  {formatExactCurrency(point.value, currency)}
                  <span className="mt-0.5 block text-[10px] text-muted">
                    {formatCompactCurrency(point.value, currency)}
                  </span>
                </td>
                <td className="px-3 py-2 align-top tabular-nums text-ink">
                  {point.yearOverYearChange == null
                    ? "—"
                    : formatPercent(point.yearOverYearChange)}
                </td>
                <td className="px-3 py-2 align-top">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setExpandedFilingYear(open ? null : point.fiscalYear)
                    }
                    className="rounded-lg border border-line px-2 py-1 text-[11px] text-ink transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {point.form}
                  </button>
                  {open && (
                    <dl className="mt-2 space-y-1 text-[10px] leading-relaxed text-muted">
                      <div>
                        <dt className="inline text-ink/70">Filed: </dt>
                        <dd className="inline">{point.filingDate}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink/70">Period: </dt>
                        <dd className="inline">
                          {point.periodStart ?? "—"} → {point.periodEnd}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-ink/70">Accession: </dt>
                        <dd className="inline break-all">{point.accession}</dd>
                      </div>
                      <div>
                        <dt className="inline text-ink/70">Concept: </dt>
                        <dd className="inline break-all">{point.concept}</dd>
                      </div>
                    </dl>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
