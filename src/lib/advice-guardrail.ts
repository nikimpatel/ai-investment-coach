/**
 * Deterministic coach guardrail. There is no model call.
 * Advice-style questions are refused and redirected to education and reflection.
 */

export const ADVICE_REFUSAL =
  "I can’t answer that. This coach does not give buy, sell or hold calls, price targets, or personalised recommendations. It does not consider your objectives, financial situation or needs. Use Research, Finance, Thesis, Decision and Reflect to examine the evidence and your own reasoning. For a decision about your circumstances, consider a licensed financial adviser.";

export const EDUCATIONAL_REDIRECT =
  "This coach will not tell you what to do with a security. Use the walkthrough to write what you observe, what would prove you wrong, and what would make you reconsider.";

const ADVICE_RULES: RegExp[] = [
  /\b(buy|sell|hold)\b/i,
  /\bprice targets?\b/i,
  /\btarget prices?\b/i,
  /\b(undervalued|overvalued|fair value)\b/i,
  /\b(recommend|recommendation|personalised|personalized)\b/i,
  /\bshould i (invest|own|allocate|put)\b/i,
  /\bhow much should i\b/i,
  /\b(my|your) (super|retirement|portfolio|circumstances|situation|goals|objectives)\b/i,
  /\bpersonal (financial )?advice\b/i,
  /\bwhat(?:'s| is) it worth\b/i,
  /\bgood (investment|stock|buy)\b/i,
  /\bposition size\b/i,
];

export interface CoachReply {
  refused: boolean;
  message: string;
}

export function isAdviceStyleQuestion(question: string): boolean {
  const text = question.trim();
  if (!text) return false;
  return ADVICE_RULES.some((rule) => rule.test(text));
}

export function respondToCoachQuestion(question: string): CoachReply {
  if (isAdviceStyleQuestion(question)) {
    return { refused: true, message: ADVICE_REFUSAL };
  }
  return { refused: false, message: EDUCATIONAL_REDIRECT };
}
