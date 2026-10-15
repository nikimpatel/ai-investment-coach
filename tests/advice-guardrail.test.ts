import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVICE_REFUSAL,
  EDUCATIONAL_REDIRECT,
  isAdviceStyleQuestion,
  respondToCoachQuestion,
} from "../src/lib/advice-guardrail";

const adviceQuestions = [
  "Should I buy Apple?",
  "Is it time to sell?",
  "Should I hold?",
  "What is your price target?",
  "Give me a target price for AAPL",
  "What should I do with my super?",
  "Recommend a stock for my portfolio",
  "Is Apple undervalued?",
  "How much should I invest?",
  "What is a good investment for my retirement?",
];

test("advice-style questions are refused and redirected to education", () => {
  for (const question of adviceQuestions) {
    assert.equal(isAdviceStyleQuestion(question), true, question);
    const reply = respondToCoachQuestion(question);
    assert.equal(reply.refused, true, question);
    assert.equal(reply.message, ADVICE_REFUSAL);
    assert.match(reply.message, /Research, Finance, Thesis, Decision and Reflect/);
    assert.match(reply.message, /licensed financial adviser/);
    assert.doesNotMatch(reply.message, /you should (buy|sell|hold)/i);
    assert.doesNotMatch(reply.message, /\$\s?\d/);
  }
});

test("education and reflection questions are not refused", () => {
  for (const question of [
    "",
    "   ",
    "What would prove this idea wrong?",
    "How do I read ten years of revenue?",
    "What should I write in my reflection?",
  ]) {
    const reply = respondToCoachQuestion(question);
    assert.equal(reply.refused, false, question);
    assert.equal(reply.message, EDUCATIONAL_REDIRECT);
    assert.doesNotMatch(reply.message, /you should (buy|sell|hold)/i);
    assert.doesNotMatch(reply.message, /\$\s?\d/);
  }
});
