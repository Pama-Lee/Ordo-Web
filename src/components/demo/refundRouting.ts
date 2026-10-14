// The refund-routing ruleset from Ordo's jev-routing rule pack
// (examples/rule-packs/jev-routing/rulesets/refund-routing.json), evaluated in
// TypeScript so the homepage can show it without shipping the WASM engine.
// Conditions, thresholds, step ids and messages are copied from the ruleset;
// keep them identical. Results were checked against `ordo trace` / `ordo test`.

export interface RefundInput {
  jev: {
    intent: { choice: string; confidence: number };
    urgency: { score: number };
    chargeback: { noul: number };
  };
  order: { amount: string; days_since_delivery: number };
  customer: { refunds_90d: number };
}

export type StepId =
  | 'escalation'
  | 'intent'
  | 'priority'
  | 'route'
  | 'dispatch'
  | 'auto_refund'
  | 'llm_draft'
  | 'human_review'
  | 'escalate'
  | 'other_team';

export type Code = 'AUTO_REFUND' | 'LLM_DRAFT' | 'HUMAN_REVIEW' | 'ESCALATE' | 'ROUTE_TEAM';

/** One visited step: which branch / table row it took (index into the node's rows). */
export interface TraceStep {
  id: StepId;
  /** Decision: branch index, or -1 for default. Table: rule index, or -1 for default. */
  taken?: number;
}

export interface RefundResult {
  code: Code;
  message: string;
  output: Record<string, string | number>;
  path: TraceStep[];
}

// ── route table (decision_table, hitPolicy "first") ─────────────────────────
// inputs: jev.intent.choice, jev.intent.confidence, order.amount,
//         order.days_since_delivery, customer.refunds_90d
export const ROUTE_COLUMNS = [
  { path: 'jev.intent.choice', type: 'string' },
  { path: 'jev.intent.confidence', type: 'number' },
  { path: 'order.amount', type: 'decimal' },
  { path: 'order.days_since_delivery', type: 'number' },
  { path: 'customer.refunds_90d', type: 'number' },
] as const;

export interface RouteRule {
  when: [string, string, string, string, string];
  then: [string, string];
}

/** `confidence` lets the Impact demo replay the table with a different threshold. */
export function routeRules(confidence = '>= 0.85'): RouteRule[] {
  return [
    { when: ['-', '-', '-', '-', '>= 3'], then: ['HUMAN_REVIEW', 'repeat_refunds'] },
    { when: ['-', '-', '-', '> 30', '-'], then: ['HUMAN_REVIEW', 'outside_window'] },
    { when: ['refund', confidence, '<= 200', '-', '-'], then: ['AUTO_REFUND', ''] },
    { when: ['refund', confidence, '-', '-', '-'], then: ['HUMAN_REVIEW', 'amount'] },
    { when: ['refund', '>= 0.6', '-', '-', '-'], then: ['LLM_DRAFT', 'medium_confidence'] },
  ];
}
export const ROUTE_DEFAULT: [string, string] = ['HUMAN_REVIEW', 'low_confidence'];

export function routeValues(input: RefundInput): [string, number, number, number, number] {
  return [
    input.jev.intent.choice,
    input.jev.intent.confidence,
    Number(input.order.amount),
    input.order.days_since_delivery,
    input.customer.refunds_90d ?? 0,
  ];
}

/** Does one table cell match? "-" is a wildcard, an operator prefix compares, anything else is equality. */
export function cellMatches(cell: string, value: string | number): boolean {
  if (cell === '-') return true;
  const m = /^(>=|<=|>|<|==|!=)\s*(.+)$/.exec(cell);
  if (!m) return String(value) === cell;
  const [, op, rhs] = m;
  const a = Number(value);
  const b = Number(rhs);
  switch (op) {
    case '>=': return a >= b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '<': return a < b;
    case '==': return a === b;
    default: return a !== b;
  }
}

/** Index of the first matching rule, or -1 when the default applies. */
export function matchRoute(input: RefundInput, rules = routeRules()): number {
  const values = routeValues(input);
  return rules.findIndex((r) => r.when.every((cell, i) => cellMatches(cell, values[i])));
}

const MESSAGES: Record<Code, string> = {
  AUTO_REFUND: 'Refund issued without review',
  LLM_DRAFT: 'An LLM drafts the reply, an agent approves it',
  HUMAN_REVIEW: 'A support agent decides',
  ESCALATE: 'Chargeback or legal threat, send to a senior agent',
  ROUTE_TEAM: 'Not a refund request',
};

export function runRefundRouting(input: RefundInput, rules = routeRules()): RefundResult {
  const path: TraceStep[] = [];
  const conf = input.jev.intent.confidence;

  // escalation: jev.chargeback.noul >= 0.5
  if (input.jev.chargeback.noul >= 0.5) {
    path.push({ id: 'escalation', taken: 0 }, { id: 'escalate' });
    return {
      code: 'ESCALATE',
      message: MESSAGES.ESCALATE,
      output: { priority: 'high', jev_chargeback: input.jev.chargeback.noul },
      path,
    };
  }
  path.push({ id: 'escalation', taken: -1 });

  // intent: jev.intent.choice != "refund" && jev.intent.confidence >= 0.6
  if (input.jev.intent.choice !== 'refund' && conf >= 0.6) {
    path.push({ id: 'intent', taken: 0 }, { id: 'other_team' });
    return {
      code: 'ROUTE_TEAM',
      message: MESSAGES.ROUTE_TEAM,
      output: { team: input.jev.intent.choice, jev_confidence: conf },
      path,
    };
  }
  path.push({ id: 'intent', taken: -1 });

  // priority: jev.urgency.score >= 1.5 → high, default normal
  const high = input.jev.urgency.score >= 1.5;
  const priority = high ? 'high' : 'normal';
  path.push({ id: 'priority', taken: high ? 0 : -1 });

  // route
  const row = matchRoute(input, rules);
  const [decision, reason] = row >= 0 ? rules[row].then : ROUTE_DEFAULT;
  path.push({ id: 'route', taken: row });

  // dispatch: $decision == "AUTO_REFUND" / "LLM_DRAFT", default human_review
  if (decision === 'AUTO_REFUND') {
    path.push({ id: 'dispatch', taken: 0 }, { id: 'auto_refund' });
    return {
      code: 'AUTO_REFUND',
      message: MESSAGES.AUTO_REFUND,
      output: { amount: Number(input.order.amount), priority, jev_confidence: conf },
      path,
    };
  }
  if (decision === 'LLM_DRAFT') {
    path.push({ id: 'dispatch', taken: 1 }, { id: 'llm_draft' });
    return {
      code: 'LLM_DRAFT',
      message: MESSAGES.LLM_DRAFT,
      output: { reason, priority, jev_confidence: conf },
      path,
    };
  }
  path.push({ id: 'dispatch', taken: -1 }, { id: 'human_review' });
  return {
    code: 'HUMAN_REVIEW',
    message: MESSAGES.HUMAN_REVIEW,
    output: { reason, priority, jev_confidence: conf },
    path,
  };
}

// ── inputs ──────────────────────────────────────────────────────────────────

function input(
  choice: string,
  confidence: number,
  urgency: number,
  chargeback: number,
  amount: string,
  days: number,
  refunds: number,
): RefundInput {
  return {
    jev: {
      intent: { choice, confidence },
      urgency: { score: urgency },
      chargeback: { noul: chargeback },
    },
    order: { amount, days_since_delivery: days },
    customer: { refunds_90d: refunds },
  };
}

export interface Sample {
  key: 'double' | 'blender' | 'parcel' | 'dispute';
  message: string;
  input: RefundInput;
  /** Per-step durations from `ordo trace` (release build) on this input, in µs. */
  durationsUs: number[];
}

/** The four samples in the pack, with the Jev answers recorded on 2026-10-13 (typesafe/jev-1.13). */
export const SAMPLES: Sample[] = [
  {
    key: 'blender',
    message:
      'The blender arrived yesterday but it is much louder than the video showed. Not sure it is for me. What are my options?',
    input: input('refund', 0.97, 0.43, 0.04, '129.00', 1, 0),
    durationsUs: [1, 1, 1, 2, 0, 0],
  },
  {
    key: 'double',
    message:
      'Hi, I was charged twice for order #4471 (EUR 39.90 each). Could you refund one of them? Thanks.',
    input: input('refund', 1, 0.2, 0.02, '39.90', 2, 0),
    durationsUs: [4, 0, 1, 3, 0, 0],
  },
  {
    key: 'parcel',
    message: "Tracking has said 'in transit' for six days. Where is my parcel?",
    input: input('delivery', 1, 1.63, 0.06, '54.50', 0, 0),
    durationsUs: [3, 1, 0],
  },
  {
    key: 'dispute',
    message:
      'Third email about my refund for the jacket. If it is not in my account by Friday I am filing a dispute with my bank.',
    input: input('refund', 1, 2, 0.98, '89.00', 12, 1),
    durationsUs: [2, 0],
  },
];

export interface TableCase {
  key: 'blender' | 'medium' | 'amount' | 'repeat' | 'window' | 'low';
  input: RefundInput;
}

/** Inputs for the decision-table view: the blender sample plus test cases from the pack. */
export const TABLE_CASES: TableCase[] = [
  { key: 'blender', input: SAMPLES[0].input },
  { key: 'medium', input: input('refund', 0.72, 0.3, 0.02, '129.00', 1, 0) },
  { key: 'amount', input: input('refund', 0.95, 0, 0, '200.01', 3, 0) },
  { key: 'repeat', input: input('refund', 0.97, 0, 0, '15', 2, 3) },
  { key: 'window', input: input('refund', 0.97, 0, 0, '15', 31, 0) },
  { key: 'low', input: input('refund', 0.55, 0, 0, '20', 1, 0) },
];
