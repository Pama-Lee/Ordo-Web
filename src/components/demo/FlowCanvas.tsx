import { EDGES, NODES, edgePath, nodeHeight, nodeW, type Layout, type FlowNode } from './flowModel';
import type { StepId, TraceStep } from './refundRouting';
import type { DemoLabels } from './labels';

interface Props {
  layout: Layout;
  /** Steps lit so far, in execution order. Empty: nothing is running. */
  lit: TraceStep[];
  /** Whether a trace is shown at all (dims the steps that were not taken). */
  tracing: boolean;
  labels: DemoLabels;
}

function Icon({ kind }: { kind: FlowNode['kind'] }) {
  if (kind === 'terminal')
    return (
      <svg className="od-node-icon" viewBox="0 0 12 12" aria-hidden="true">
        <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  if (kind === 'table')
    return (
      <svg className="od-node-icon" viewBox="0 0 12 12" aria-hidden="true">
        <rect x="1.5" y="2" width="9" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1.5 5h9M5 5v5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  return (
    <svg className="od-node-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 1.4 10.6 6 6 10.6 1.4 6Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export default function FlowCanvas({ layout, lit, tracing, labels }: Props) {
  const order = new Map<StepId, number>();
  lit.forEach((s, i) => order.set(s.id, i));
  const taken = new Map<StepId, number | undefined>(lit.map((s) => [s.id, s.taken]));
  const current = lit.length ? lit[lit.length - 1].id : null;

  const edgeLit = (from: StepId, row: number | undefined, to: StepId) => {
    const i = order.get(from);
    const j = order.get(to);
    if (i === undefined || j === undefined || j !== i + 1) return false;
    const node = NODES.find((n) => n.id === from)!;
    return node.kind === 'table' || taken.get(from) === row;
  };

  return (
    <div
      className={`od-canvas${layout.compact ? ' od-compact' : ''}${tracing ? ' od-tracing' : ''}`}
      style={{ width: layout.width, height: layout.height }}
    >
      <svg className="od-edges" width={layout.width} height={layout.height} aria-hidden="true">
        {EDGES.map((e) => {
          const { d } = edgePath(layout, e);
          const on = edgeLit(e.from, e.row, e.to);
          return (
            <g key={`${e.from}-${e.row}-${e.to}`} className={`od-edge${on ? ' is-lit' : ''}`}>
              <path className="od-edge-base" d={d} />
              <path className="od-edge-trace" d={d} pathLength={1} />
            </g>
          );
        })}
      </svg>

      {NODES.map((n) => {
        const p = layout.pos[n.id];
        const i = order.get(n.id);
        const on = i !== undefined;
        const tk = taken.get(n.id);
        const rows = n.rows ?? [];
        return (
          <div
            key={n.id}
            className={`od-node od-${n.kind}${on ? ' is-lit' : ''}${current === n.id ? ' is-current' : ''}`}
            style={{ left: p.x, top: p.y, width: nodeW(layout, n.id), height: nodeHeight(n, layout.compact) }}
          >
            <span className="od-order" aria-hidden="true">
              {on ? i + 1 : ''}
            </span>
            <div className="od-node-head">
              {n.start && <span className="od-start">START</span>}
              <Icon kind={n.kind} />
              <span className="od-node-title">{n.name}</span>
            </div>
            {n.kind === 'terminal' ? (
              <>
                <div className="od-code-row">
                  <span className="od-code">{n.code}</span>
                </div>
                {!layout.compact &&
                  n.outputs?.map((o) => (
                    <div key={o} className="od-out-row">
                      {o}
                    </div>
                  ))}
              </>
            ) : (
              !layout.compact && (
                <div className="od-rows">
                  {rows.map((r, ri) => (
                    <div key={r} className={`od-row${on && tk === ri ? ' is-taken' : ''}`}>
                      <span className="od-row-text">
                        {n.kind === 'table' && <span className="od-row-no">{ri + 1}</span>}
                        {r}
                      </span>
                      {n.kind === 'decision' && <span className="od-pin" />}
                    </div>
                  ))}
                  <div className={`od-row od-row-default${on && tk === -1 ? ' is-taken' : ''}`}>
                    <span className="od-row-text">
                      {n.kind === 'table' ? `${labels.default} ${n.defaultRow ?? ''}` : labels.default}
                    </span>
                    {n.kind === 'decision' && <span className="od-pin" />}
                  </div>
                </div>
              )
            )}
            {n.kind === 'table' && !layout.compact && <span className="od-pin od-pin-head" />}
          </div>
        );
      })}
    </div>
  );
}
