import type { ThesisDraft } from "./types";

/** Fictional company for the validation prototype — not a real listed security. */
export const sampleCompany = {
  name: "Harborline Logistics",
  ticker: "HLG",
  tagline: "Fictional ASX-style mid-cap · warehouse software & regional freight",
  summary:
    "A made-up company used only for this walkthrough. Imagine an Australian logistics software firm expanding into warehouse automation for regional retailers.",
  seedAttraction:
    "A podcast mentioned rising e-commerce fulfilment in regional Australia, and Harborline sounded like a clean way to get exposure.",
} as const;

export const seededThesis: ThesisDraft = {
  opportunity:
    "Regional retailers need modern warehouse software; Harborline already has sticky contracts and room to expand modules.",
  evidence:
    "Customer retention above 90% in recent commentary; management guided for continued module attach rates; peer multiples suggest software-like economics if execution holds.",
  assumptions:
    "Retailers keep digitising warehouses; Harborline retains pricing power; competition from larger platforms stays fragmented for 3+ years.",
  risks:
    "Enterprise sales cycles lengthen; a global competitor bundles warehouse tools cheaply; integration costs squeeze margins.",
  valuation:
    "Trading at a premium to traditional logistics names but below pure-play software peers — premium only makes sense if recurring revenue mix keeps rising.",
  falsifiers:
    "Two consecutive quarters of declining net retention, or a major customer loss that management cannot explain clearly.",
  openQuestions:
    "How concentrated is revenue in the top five customers? What is the true organic growth rate excluding acquisitions?",
  performanceObservation: "",
  performanceEvidence: null,
  analysisPackets: [],
};

export const historicalDecisions = [
  {
    id: "d1",
    company: "Northbridge Retail REIT",
    when: "8 months ago",
    attraction: "Growth narrative from expanding portfolio",
    valuationNoted: false,
    outcomeNote: "Thesis held, but entry felt rushed after a price bounce",
  },
  {
    id: "d2",
    company: "Cedar Peak Health",
    when: "5 months ago",
    attraction: "Strong growth in clinics and telehealth",
    valuationNoted: false,
    outcomeNote: "Risks were listed, then barely referenced when deciding",
  },
  {
    id: "d3",
    company: "Riverbend Payments",
    when: "3 months ago",
    attraction: "Market share story after a product launch",
    valuationNoted: true,
    outcomeNote: "Comparing two alternatives slowed the decision and improved clarity",
  },
] as const;

export const samplePattern = {
  id: "pattern-growth-without-valuation",
  title: "Growth often outweighs valuation in your early notes",
  summary:
    "In 2 of your last 3 researched ideas, the write-up emphasised growth and narrative before any valuation check.",
  evidence: [
    {
      decision: "Northbridge Retail REIT",
      detail:
        "Attraction and evidence focused on portfolio expansion; valuation fields were left blank until after the decision.",
    },
    {
      decision: "Cedar Peak Health",
      detail:
        "Clinic growth dominated the thesis; no peer multiple or cash-flow check was recorded before confidence was set at 7/10.",
    },
  ],
  proposedCoaching:
    "On your next idea, ask for a simple valuation sanity check before locking confidence — for example, ‘What would need to be true for today’s price to be reasonable?’",
  basedOnCount: 3,
} as const;

export const laterObservation = {
  title: "Three months later · Harborline (sample)",
  originalConfidence: 6,
  whatChanged:
    "Module attach rates were steady, but a large competitor announced a bundled warehouse suite. Your falsifier (net retention) has not tripped, yet competitive risk rose.",
  userLessonSeed:
    "I tend to underweight competitive bundling when the growth story feels local and familiar.",
} as const;
