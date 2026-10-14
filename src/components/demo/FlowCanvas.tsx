// A read-only render of Ordo Studio's flow canvas in trace (flow replay) mode.
// Markup and class names follow packages/vue/src/components/flow:
// DecisionNode.vue, TerminalNode.vue, OrdoEdge.vue, ExecutionAnnotation.vue and the
// execution-highlighted / execution-dimmed rules in OrdoFlowEditor.vue.
import { EDGES, NODES, NODE_W, branchLabel, edgePath, nodeHeight, outputValue, type Layout, type FlowNode } from './flowModel';
import type { StepId, TraceStep } from './refundRouting';
import type { DemoLabels } from './labels';

const PIN = { execInput: '#cccccc', execDefault: '#666666', execBranch: '#b76e00' };
const EDGE = { exec: '#888888', execBranch: '#b76e00' };

interface Props {
  layout: Layout;
  lit: TraceStep[];
  durationsUs: number[];
  resultCode?: string;
  tracing: boolean;
  labels: DemoLabels;
  /** Viewport transform: translate (px) and zoom. */
  view: { x: number; y: number; zoom: number };
  width: number;
  height: number;
}

/** OrdoIcon.vue: decision and terminal glyphs (24px grid, 2px stroke). */
function OrdoIcon({ name }: { name: 'decision' | 'terminal' }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ordo-icon node-icon"
      aria-hidden="true"
    >
      {name === 'decision' ? <path d="M12 3L20 12L12 21L4 12L12 3Z" /> : <circle cx="12" cy="12" r="10" />}
    </svg>
  );
}

function Pin({ fill, cls }: { fill: string; cls: string }) {
  return (
    <span className={`pin pin-exec ${cls}`}>
      <svg className="pin-shape" width="10" height="10" viewBox="0 0 10 10">
        <polygon points="0,0 10,5 0,10" fill={fill} />
      </svg>
    </span>
  );
}

function DataPin() {
  return (
    <span className="pin pin-data pin-input">
      <svg className="pin-shape" width="8" height="8" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3.5" fill="#4a9eff" />
      </svg>
    </span>
  );
}

function Annotation({ order, durationUs, entry, terminal, code }: { order: number; durationUs: number; entry: boolean; terminal: boolean; code?: string }) {
  const icon = entry ? '🚀' : terminal ? '🏁' : '✓';
  return (
    <div className="execution-annotation annotation-top">
      <div className="annotation-bubble">
        <span className="order-badge">{order}</span>
        <span className="status-icon">{icon}</span>
        <span className="duration">{durationUs}µs</span>
        {terminal && code && <span className="result-code success">{code}</span>}
      </div>
      <div className="annotation-connector" />
    </div>
  );
}

function NodeView({ n, labels }: { n: FlowNode; labels: DemoLabels }) {
  if (n.kind === 'terminal') {
    return (
      <div className="flow-node terminal-node">
        <div className="node-header">
          <Pin fill={PIN.execInput} cls="pin-input" />
          <OrdoIcon name="terminal" />
          <span className="node-title">{n.name}</span>
          <span className="node-type-badge">{labels.typeTerminal}</span>
        </div>
        <div className="node-section result-section">
          <div className="result-code">{n.code}</div>
        </div>
        <div className="node-section outputs-section">
          {n.outputs?.map((o) => (
            <div key={o.name} className="output-row">
              <DataPin />
              <span className="output-name">{o.name}</span>
              <span className="output-op">=</span>
              <span className="output-value">{outputValue(o.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={`flow-node decision-node${n.start ? ' is-start' : ''}`}>
      <div className="node-header">
        <Pin fill={PIN.execInput} cls="pin-input" />
        {n.start && <span className="node-badge start">{labels.start}</span>}
        <OrdoIcon name="decision" />
        <span className="node-title">{n.name}</span>
        <span className="node-type-badge">{labels.typeDecision}</span>
      </div>
      <div className="node-section branches-section">
        {n.branches?.map((b) => (
          <div key={b} className="branch-row">
            <span className="branch-label">{branchLabel(b)}</span>
            <Pin fill={PIN.execBranch} cls="pin-output" />
          </div>
        ))}
        <div className="branch-row branch-default">
          <span className="branch-label default-label">{labels.default}</span>
          <Pin fill={PIN.execDefault} cls="pin-output" />
        </div>
      </div>
    </div>
  );
}

export default function FlowCanvas({ layout, lit, durationsUs, resultCode, tracing, labels, view, width, height }: Props) {
  const order = new Map<StepId, number>();
  lit.forEach((s, i) => order.set(s.id, i));
  const taken = new Map<StepId, number | undefined>(lit.map((s) => [s.id, s.taken]));

  const edgeLit = (from: StepId, row: number, to: StepId) => {
    const i = order.get(from);
    const j = order.get(to);
    return i !== undefined && j === i + 1 && taken.get(from) === row;
  };

  return (
    <div className="ofl-viewport" style={{ width, height }}>
      <div
        className="ofl-pane"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
      >
        <div className="ofl-background" />
        <svg className="ofl-edges" width={layout.width} height={layout.height} aria-hidden="true">
          {EDGES.map((e) => {
            const { d, sx, sy, tx, ty, mx, my } = edgePath(layout, e);
            const color = e.row === -1 ? EDGE.exec : EDGE.execBranch;
            const label = e.row === -1 ? labels.default : labels.branch;
            const state = tracing ? (edgeLit(e.from, e.row, e.to) ? ' execution-highlighted' : ' execution-dimmed') : '';
            const w = label.length * 7 + 12;
            return (
              <g key={`${e.from}-${e.row}`} className={`vue-flow__edge${state}`}>
                <g className="ordo-edge">
                  <path d={d} fill="none" stroke={color} strokeWidth={2} className="edge-path" />
                  <polygon
                    points={`${tx + 8},${ty - 4} ${tx},${ty} ${tx + 8},${ty + 4}`}
                    fill={color}
                    className="edge-arrow"
                  />
                  <g transform={`translate(${mx}, ${my})`}>
                    <rect x={-w / 2} y={-10} width={w} height={20} rx={3} className="edge-label-bg" />
                    <text className="edge-label-text" textAnchor="middle" dominantBaseline="middle">
                      {label}
                    </text>
                  </g>
                </g>
                <circle className="vue-flow__edgeupdater" cx={sx + 10} cy={sy} r={5} />
                <circle className="vue-flow__edgeupdater" cx={tx - 10} cy={ty} r={5} />
              </g>
            );
          })}
        </svg>

        {NODES.map((n) => {
          const p = layout.pos[n.id];
          const i = order.get(n.id);
          const on = i !== undefined;
          const state = tracing ? (on ? ' execution-highlighted' : ' execution-dimmed') : '';
          return (
            <div
              key={n.id}
              className={`vue-flow__node${state}`}
              style={{ transform: `translate(${p.x}px, ${p.y}px)`, width: NODE_W[n.id], height: nodeHeight(n) }}
            >
              {on && (
                <Annotation
                  order={i + 1}
                  durationUs={durationsUs[i] ?? 0}
                  entry={i === 0}
                  terminal={n.kind === 'terminal'}
                  code={resultCode}
                />
              )}
              <NodeView n={n} labels={labels} />
            </div>
          );
        })}
      </div>

      {/* vue-flow Controls, styled as in OrdoFlowEditor.vue */}
      <div className="vue-flow__controls" aria-hidden="true">
        <span className="vue-flow__controls-button">
          <svg viewBox="0 0 32 32"><path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z" /></svg>
        </span>
        <span className="vue-flow__controls-button">
          <svg viewBox="0 0 32 5"><path d="M0 0h32v4.2H0z" /></svg>
        </span>
        <span className="vue-flow__controls-button">
          <svg viewBox="0 0 32 30"><path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z" /></svg>
        </span>
        <span className="vue-flow__controls-button">
          <svg viewBox="0 0 25 32"><path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z" /></svg>
        </span>
      </div>
    </div>
  );
}
