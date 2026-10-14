// The refund-routing step graph as Studio draws it: nodes, their rows, edges,
// and two layouts (left-to-right for the full window, top-to-bottom for phones).
import type { StepId } from './refundRouting';

export type NodeKind = 'decision' | 'table' | 'terminal';

export interface FlowNode {
  id: StepId;
  name: string;
  kind: NodeKind;
  /** Decision: branch conditions. Table: one line per rule. */
  rows?: string[];
  /** Label of the default row (decision: default branch, table: default output). */
  defaultRow?: string;
  code?: string;
  outputs?: string[];
  start?: boolean;
}

export const NODES: FlowNode[] = [
  {
    id: 'escalation',
    name: 'Chargeback or legal threat',
    kind: 'decision',
    start: true,
    rows: ['jev.chargeback.noul >= 0.5'],
  },
  {
    id: 'intent',
    name: 'Is it a refund request',
    kind: 'decision',
    rows: ['jev.intent.choice != "refund" && jev.intent.confidence >= 0.6'],
  },
  {
    id: 'priority',
    name: 'Priority',
    kind: 'table',
    rows: ['urgency.score >= 1.5 → high'],
    defaultRow: '→ normal',
  },
  {
    id: 'route',
    name: 'Route by confidence and order',
    kind: 'table',
    rows: [
      'refunds_90d >= 3',
      'days_since_delivery > 30',
      'refund · >= 0.85 · <= 200',
      'refund · >= 0.85',
      'refund · >= 0.6',
    ],
    defaultRow: '→ HUMAN_REVIEW',
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    kind: 'decision',
    rows: ['$decision == "AUTO_REFUND"', '$decision == "LLM_DRAFT"'],
  },
  {
    id: 'escalate',
    name: 'Escalate',
    kind: 'terminal',
    code: 'ESCALATE',
    outputs: ['priority = "high"', 'jev_chargeback = jev.chargeback.noul'],
  },
  {
    id: 'other_team',
    name: 'Other team',
    kind: 'terminal',
    code: 'ROUTE_TEAM',
    outputs: ['team = jev.intent.choice', 'jev_confidence = jev.intent.confidence'],
  },
  {
    id: 'auto_refund',
    name: 'Auto refund',
    kind: 'terminal',
    code: 'AUTO_REFUND',
    outputs: ['amount = order.amount', 'priority = $priority', 'jev_confidence = jev.intent.confidence'],
  },
  {
    id: 'llm_draft',
    name: 'LLM draft',
    kind: 'terminal',
    code: 'LLM_DRAFT',
    outputs: ['reason = $reason', 'priority = $priority', 'jev_confidence = jev.intent.confidence'],
  },
  {
    id: 'human_review',
    name: 'Human review',
    kind: 'terminal',
    code: 'HUMAN_REVIEW',
    outputs: ['reason = $reason', 'priority = $priority', 'jev_confidence = jev.intent.confidence'],
  },
];

export const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<StepId, FlowNode>;

/** row: branch index, -1 = default branch, undefined = the single "next" of a table step. */
export interface FlowEdge {
  from: StepId;
  row?: number;
  to: StepId;
}

export const EDGES: FlowEdge[] = [
  { from: 'escalation', row: 0, to: 'escalate' },
  { from: 'escalation', row: -1, to: 'intent' },
  { from: 'intent', row: 0, to: 'other_team' },
  { from: 'intent', row: -1, to: 'priority' },
  { from: 'priority', to: 'route' },
  { from: 'route', to: 'dispatch' },
  { from: 'dispatch', row: 0, to: 'auto_refund' },
  { from: 'dispatch', row: 1, to: 'llm_draft' },
  { from: 'dispatch', row: -1, to: 'human_review' },
];

// ── geometry ────────────────────────────────────────────────────────────────

export const HEADER_H = 34;
export const ROW_H = 20;
export const PAD = 4;
export const CODE_H = 28;
export const OUT_H = 17;

export function nodeHeight(n: FlowNode, compact: boolean): number {
  if (compact) return n.kind === 'terminal' ? 50 : 28;
  if (n.kind === 'terminal') return HEADER_H + CODE_H + (n.outputs?.length ?? 0) * OUT_H + PAD * 2;
  return HEADER_H + PAD * 2 + ((n.rows?.length ?? 0) + 1) * ROW_H;
}

export interface Layout {
  width: number;
  height: number;
  compact: boolean;
  nodeW: Partial<Record<StepId, number>> & { default: number };
  pos: Record<StepId, { x: number; y: number }>;
  /** Steps placed beside the chain in the TB layout (edge leaves from the side). */
  side?: StepId[];
}

export const LR: Layout = {
  width: 878,
  height: 520,
  compact: false,
  nodeW: { default: 132 },
  pos: {
    escalation: { x: 10, y: 214 },
    escalate: { x: 152, y: 48 },
    intent: { x: 152, y: 246 },
    other_team: { x: 294, y: 92 },
    priority: { x: 294, y: 288 },
    route: { x: 436, y: 196 },
    dispatch: { x: 578, y: 226 },
    auto_refund: { x: 720, y: 52 },
    llm_draft: { x: 720, y: 196 },
    human_review: { x: 720, y: 340 },
  },
};

export const TB: Layout = {
  width: 380,
  height: 352,
  compact: true,
  nodeW: { default: 206, escalate: 138, other_team: 138, auto_refund: 116, llm_draft: 116, human_review: 116 },
  side: ['escalate', 'other_team'],
  pos: {
    escalation: { x: 8, y: 10 },
    escalate: { x: 234, y: 0 },
    intent: { x: 8, y: 66 },
    other_team: { x: 234, y: 56 },
    priority: { x: 8, y: 122 },
    route: { x: 8, y: 178 },
    dispatch: { x: 8, y: 234 },
    auto_refund: { x: 8, y: 296 },
    llm_draft: { x: 132, y: 296 },
    human_review: { x: 256, y: 296 },
  },
};

export function nodeW(l: Layout, id: StepId) {
  return l.nodeW[id] ?? l.nodeW.default;
}

/** Y of a row's pin, relative to the node top. */
function rowY(n: FlowNode, row: number | undefined): number {
  if (row === undefined) return HEADER_H / 2;
  const idx = row === -1 ? (n.rows?.length ?? 0) : row;
  return HEADER_H + PAD + idx * ROW_H + ROW_H / 2;
}

export function edgePath(l: Layout, e: FlowEdge): { d: string; mx: number; my: number } {
  const a = l.pos[e.from];
  const b = l.pos[e.to];
  const na = NODE_BY_ID[e.from];
  if (!l.compact) {
    const sx = a.x + nodeW(l, e.from);
    const sy = a.y + rowY(na, e.row);
    const tx = b.x;
    const ty = b.y + HEADER_H / 2;
    const dx = Math.max(24, (tx - sx) / 2);
    return {
      d: `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`,
      mx: (sx + tx) / 2,
      my: (sy + ty) / 2,
    };
  }
  if (l.side?.includes(e.to)) {
    const sx = a.x + nodeW(l, e.from);
    const sy = a.y + 14;
    const tx = b.x;
    const ty = b.y + 14;
    const dx = Math.max(8, (tx - sx) / 2);
    return { d: `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`, mx: (sx + tx) / 2, my: (sy + ty) / 2 };
  }
  const sx = a.x + nodeW(l, e.from) / 2;
  const sy = a.y + nodeHeight(na, true);
  const tx = b.x + nodeW(l, e.to) / 2;
  const ty = b.y;
  const dy = Math.max(10, (ty - sy) / 2);
  return { d: `M${sx},${sy} C${sx},${sy + dy} ${tx},${ty - dy} ${tx},${ty}`, mx: (sx + tx) / 2, my: (sy + ty) / 2 };
}
