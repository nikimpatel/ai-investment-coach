import type { GuidedStageId } from "./guided-analysis";

export interface GuidedAnalogy {
  stageId: GuidedStageId;
  comparison: string;
  limitation: string;
}

export const GUIDED_ANALOGIES: Record<GuidedStageId, GuidedAnalogy> = {
  "revenue-growth": {
    stageId: "revenue-growth",
    comparison: "A decade of takings at a shop, not next year’s takings.",
    limitation:
      "A shop’s till is local and simple; Apple’s sales mix, geographies, and accounting recognition are not.",
  },
  "profitability-margins": {
    stageId: "profitability-margins",
    comparison:
      "How much of each dollar of sales is left after costs — not why customers came.",
    limitation:
      "Margin change can come from mix, one-offs, or cost timing; the comparison does not identify the cause.",
  },
  "profit-vs-cash": {
    stageId: "profit-vs-cash",
    comparison: "Profit is the report card; operating cash is money that actually arrived.",
    limitation:
      "Accrual profit and cash can differ for many valid reasons; one year of gap is not proof of quality or fraud.",
  },
  "capex-fcf": {
    stageId: "capex-fcf",
    comparison: "Cash left after spending on the shop’s tools — still not a valuation.",
    limitation:
      "CapEx is normalized here as positive spend; this is not maintenance versus growth CapEx and not a price target.",
  },
  "cash-debt-position": {
    stageId: "cash-debt-position",
    comparison: "What is owed minus cash in the till — not the worth of the brand.",
    limitation:
      "Net debt ignores other assets, leases, and off-balance-sheet items; cash here is cash and equivalents only.",
  },
};
