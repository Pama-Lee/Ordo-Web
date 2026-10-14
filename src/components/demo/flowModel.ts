// The refund-routing step graph laid out the way Ordo Studio's flow view draws it.
// Geometry mirrors packages/vue/src/components/flow (DecisionNode.vue, TerminalNode.vue,
// OrdoEdge.vue): header 8px/20px padding at 12px x 1.5 line-height, 24px rows, 6px
// section padding, 3px top accent, output pins at right:-5px, input pin at left:-10px.
import type { StepId } from './refundRouting';

export type NodeKind = 'decision' | 'terminal';

export interface FlowNode {
  id: StepId;
  name: string;
  kind: NodeKind;
  /** Decision: full branch conditions (labels are truncated like Studio's getBranchLabel). */
  branches?: string[];
  code?: string;
  outputs?: { name: string; value: string }[];
  start?: boolean;
}

/** Studio's getBranchLabel: first 20 characters, then "...". */
export const branchLabel = (s: string) => (s.length > 20 ? s.slice(0, 20) + '...' : s);
/** Studio's formatOutputValue: first 15 characters, then "...". */
export const outputValue = (s: string) => (s.length > 15 ? s.slice(0, 15) + '...' : s);

// The two decision_table steps (priority, route) are drawn as decision nodes, one branch per
// rule, the way Studio's table compiler turns a first-match table into branches.
export const NODES: FlowNode[] = [
  {
    id: 'escalation',
    name: 'Chargeback or legal threat',
    kind: 'decision',
    start: true,
    branches: ['jev.chargeback.noul >= 0.5'],
  },
  {
    id: 'intent',
    name: 'Is it a refund request',
    kind: 'decision',
    branches: ['jev.intent.choice != "refund" && jev.intent.confidence >= 0.6'],
  },
  {
    id: 'priority',
    name: 'Priority',
    kind: 'decision',
    branches: ['jev.urgency.score >= 1.5'],
  },
  {
    id: 'route',
    name: 'Route by confidence and order',
    kind: 'decision',
    branches: [
      'customer.refunds_90d >= 3',
      'order.days_since_delivery > 30',
      'jev.intent.choice == "refund" && jev.intent.confidence >= 0.85 && order.amount <= 200',
      'jev.intent.choice == "refund" && jev.intent.confidence >= 0.85',
      'jev.intent.choice == "refund" && jev.intent.confidence >= 0.6',
    ],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    kind: 'decision',
    branches: ['$decision == "AUTO_REFUND"', '$decision == "LLM_DRAFT"'],
  },
  {
    id: 'escalate',
    name: 'Escalate',
    kind: 'terminal',
    code: 'ESCALATE',
    outputs: [
      { name: 'priority', value: '"high"' },
      { name: 'jev_chargeback', value: 'jev.chargeback.noul' },
    ],
  },
  {
    id: 'other_team',
    name: 'Other team',
    kind: 'terminal',
    code: 'ROUTE_TEAM',
    outputs: [
      { name: 'team', value: 'jev.intent.choice' },
      { name: 'jev_confidence', value: 'jev.intent.confidence' },
    ],
  },
  {
    id: 'auto_refund',
    name: 'Auto refund',
    kind: 'terminal',
    code: 'AUTO_REFUND',
    outputs: [
      { name: 'amount', value: 'order.amount' },
      { name: 'priority', value: '$priority' },
      { name: 'jev_confidence', value: 'jev.intent.confidence' },
    ],
  },
  {
    id: 'llm_draft',
    name: 'LLM draft',
    kind: 'terminal',
    code: 'LLM_DRAFT',
    outputs: [
      { name: 'reason', value: '$reason' },
      { name: 'priority', value: '$priority' },
      { name: 'jev_confidence', value: 'jev.intent.confidence' },
    ],
  },
  {
    id: 'human_review',
    name: 'Human review',
    kind: 'terminal',
    code: 'HUMAN_REVIEW',
    outputs: [
      { name: 'reason', value: '$reason' },
      { name: 'priority', value: '$priority' },
      { name: 'jev_confidence', value: 'jev.intent.confidence' },
    ],
  },
];

export const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<StepId, FlowNode>;

/** row: branch index, -1 = default branch. */
export interface FlowEdge {
  from: StepId;
  row: number;
  to: StepId;
}

export const EDGES: FlowEdge[] = [
  { from: 'escalation', row: 0, to: 'escalate' },
  { from: 'escalation', row: -1, to: 'intent' },
  { from: 'intent', row: 0, to: 'other_team' },
  { from: 'intent', row: -1, to: 'priority' },
  { from: 'priority', row: 0, to: 'route' },
  { from: 'priority', row: -1, to: 'route' },
  { from: 'route', row: 0, to: 'dispatch' },
  { from: 'route', row: 1, to: 'dispatch' },
  { from: 'route', row: 2, to: 'dispatch' },
  { from: 'route', row: 3, to: 'dispatch' },
  { from: 'route', row: 4, to: 'dispatch' },
  { from: 'route', row: -1, to: 'dispatch' },
  { from: 'dispatch', row: 0, to: 'auto_refund' },
  { from: 'dispatch', row: 1, to: 'llm_draft' },
  { from: 'dispatch', row: -1, to: 'human_review' },
];

// ── geometry (CSS px at zoom 1) ─────────────────────────────────────────────
const TOP = 3; // border-top accent
const HEADER = 35; // 8 + 18 + 8 + 1px border
const SECTION_PAD = 6;
const ROW = 24;
const RESULT = 47; // result-section: 8 + 30 + 8 + 1px border

export function nodeHeight(n: FlowNode): number {
  if (n.kind === 'terminal') return TOP + HEADER + RESULT + SECTION_PAD * 2 + (n.outputs?.length ?? 0) * ROW + 1;
  return TOP + HEADER + SECTION_PAD * 2 + ((n.branches?.length ?? 0) + 1) * ROW + 1;
}

export const NODE_W: Record<StepId, number> = {
  escalation: 260,
  intent: 240,
  priority: 180,
  route: 260,
  dispatch: 186,
  escalate: 240,
  other_team: 240,
  auto_refund: 240,
  llm_draft: 240,
  human_review: 240,
};

export interface Layout {
  width: number;
  height: number;
  pos: Record<StepId, { x: number; y: number }>;
}

// Left → Right, as Studio's auto layout ranks the steps.
export const LR: Layout = {
  width: 1930,
  height: 700,
  pos: {
    escalation: { x: 40, y: 300 },
    escalate: { x: 400, y: 70 },
    intent: { x: 400, y: 300 },
    other_team: { x: 740, y: 70 },
    priority: { x: 740, y: 300 },
    route: { x: 1030, y: 252 },
    dispatch: { x: 1380, y: 288 },
    auto_refund: { x: 1650, y: 70 },
    llm_draft: { x: 1650, y: 290 },
    human_review: { x: 1650, y: 510 },
  },
};

const pinY = (n: FlowNode, row: number) => {
  const idx = row === -1 ? (n.branches?.length ?? 0) : row;
  return TOP + HEADER + SECTION_PAD + idx * ROW + ROW / 2;
};
const INPUT_Y = TOP + HEADER / 2;

/** Source and target points as vue-flow computes them from the pin handles. */
export function edgePoints(l: Layout, e: FlowEdge) {
  const a = l.pos[e.from];
  const b = l.pos[e.to];
  const sx = a.x + NODE_W[e.from] + 4;
  const sy = a.y + pinY(NODE_BY_ID[e.from], e.row);
  const tx = b.x - 10;
  const ty = b.y + INPUT_Y;
  return { sx, sy, tx, ty };
}

/** vue-flow getBezierPath (Right → Left) with OrdoEdge's curvature rule. */
export function edgePath(l: Layout, e: FlowEdge) {
  const { sx, sy, tx, ty } = edgePoints(l, e);
  const h = Math.abs(tx - sx);
  const v = Math.abs(ty - sy);
  const c = h > 0 ? 0.25 + Math.min(0.15, (v / h) * 0.1) : 0.25;
  const off = (d: number) => (d >= 0 ? 0.5 * d : c * 25 * Math.sqrt(-d));
  const c1x = sx + off(tx - sx);
  const c2x = tx - off(tx - sx);
  return {
    d: `M${sx},${sy} C${c1x},${sy} ${c2x},${ty} ${tx},${ty}`,
    sx,
    sy,
    tx,
    ty,
    mx: (sx + tx) / 2,
    my: (sy + ty) / 2,
  };
}

export function nodeCenter(l: Layout, id: StepId) {
  const p = l.pos[id];
  return { x: p.x + NODE_W[id] / 2, y: p.y + nodeHeight(NODE_BY_ID[id]) / 2 };
}
