import type { CompanyFinancialSeries, FinancialKpiOption } from "./financial-types";

/**
 * Fictional demonstration series for Harborline Logistics.
 * Values are annual Revenue in AUD dollars for ten completed fiscal years.
 * Not real company data — invented for the Phase 0 prototype only.
 */
export const harborlineRevenueSeries: CompanyFinancialSeries = {
  companyName: "Harborline Logistics",
  ticker: "HLG",
  currency: "AUD",
  kpiId: "revenue",
  kpiLabel: "Revenue",
  unitNote: "Annual revenue, AUD",
  sourceLabel: "Source: demonstration data",
  fictional: true,
  points: [
    { fiscalYear: "FY2016", fiscalYearEnd: 2016, value: 142_400_000 },
    { fiscalYear: "FY2017", fiscalYearEnd: 2017, value: 159_100_000 },
    { fiscalYear: "FY2018", fiscalYearEnd: 2018, value: 173_800_000 },
    { fiscalYear: "FY2019", fiscalYearEnd: 2019, value: 192_500_000 },
    { fiscalYear: "FY2020", fiscalYearEnd: 2020, value: 168_200_000 },
    { fiscalYear: "FY2021", fiscalYearEnd: 2021, value: 181_600_000 },
    { fiscalYear: "FY2022", fiscalYearEnd: 2022, value: 204_900_000 },
    { fiscalYear: "FY2023", fiscalYearEnd: 2023, value: 221_700_000 },
    { fiscalYear: "FY2024", fiscalYearEnd: 2024, value: 212_300_000 },
    { fiscalYear: "FY2025", fiscalYearEnd: 2025, value: 236_800_000 },
  ],
};

export const financialKpiOptions: FinancialKpiOption[] = [
  { id: "revenue", label: "Revenue", status: "enabled" },
];

export const DEFAULT_PERFORMANCE_OBSERVATION =
  "Revenue has increased over the long term, but growth has been inconsistent during the most recent fiscal years.";

export const PERFORMANCE_FOLLOW_UP_QUESTIONS = [
  "What might explain the strongest and weakest years?",
  "Does this evidence support one of your assumptions?",
  "What other metric would you investigate before reaching a conclusion?",
  "What could make this historical trend less relevant in the future?",
] as const;
