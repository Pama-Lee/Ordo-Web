// Ordo Studio's decision table (packages/vue/src/components/table/OrdoDecisionTable.vue)
// in trace mode, showing the `route` step of refund-routing against one input at a time.
import { useMemo } from 'react';
import { ROUTE_DEFAULT, TABLE_CASES, cellMatches, matchRoute, routeRules, routeValues } from './refundRouting';
import { demoLabels } from './labels';
import { useLoopClock } from './useLoopClock';
import './demo.css';

const INPUT_AT = 250;
const EVAL_AT = 800;
const ROW_MS = 520;
const HOLD = 3000;

// The table's last row is the step's default ([HUMAN_REVIEW, low_confidence]) written as an all-wildcard row.
const RULES = [...routeRules(), { when: ['-', '-', '-', '-', '-'], then: ROUTE_DEFAULT }] as {
  when: string[];
  then: string[];
}[];

const INPUT_COLS = [
  { label: 'choice', type: 'string', path: '$.jev.intent.choice' },
  { label: 'confidence', type: 'number', path: '$.jev.intent.confidence' },
  { label: 'amount', type: 'number', path: '$.order.amount' },
  { label: 'days_since_delivery', type: 'number', path: '$.order.days_since_delivery' },
  { label: 'refunds_90d', type: 'number', path: '$.customer.refunds_90d' },
];
const OUTPUT_COLS = ['decision', 'reason'];

type Cell = { type: 'any' } | { type: 'exact'; value: string } | { type: 'range'; text: string };

/** The rule pack's cells as Studio's cell model shows them (cellValueToString). */
function toCell(s: string): Cell {
  if (s === '-') return { type: 'any' };
  const m = /^(>=|<=|>|<)\s*(.+)$/.exec(s);
  if (!m) return { type: 'exact', value: s };
  const [, op, v] = m;
  if (op === '>=') return { type: 'range', text: `[${v}, ∞)` };
  if (op === '>') return { type: 'range', text: `(${v}, ∞)` };
  if (op === '<=') return { type: 'range', text: `(-∞, ${v}]` };
  return { type: 'range', text: `(-∞, ${v})` };
}
const cellText = (c: Cell) => (c.type === 'any' ? '*' : c.type === 'exact' ? c.value : c.text);

/** Studio's formatTraceValue: strings as-is, everything else JSON. */
const fmt = (v: unknown) => (v === undefined ? '—' : typeof v === 'string' ? v : JSON.stringify(v));

function DragHandle() {
  return (
    <span className="ordo-decision-table__drag-handle">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </span>
  );
}

const Plus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function TableStudio({ lang }: { lang: string }) {
  const labels = demoLabels(lang);
  const cases = useMemo(() => {
    let start = 0;
    return TABLE_CASES.map((tc) => {
      const m = matchRoute(tc.input);
      const hit = m < 0 ? RULES.length - 1 : m;
      const doneAt = EVAL_AT + hit * ROW_MS + 200;
      const end = doneAt + HOLD;
      // Raw values as they sit in the input: amount stays the decimal string.
      const raw = [
        tc.input.jev.intent.choice,
        tc.input.jev.intent.confidence,
        tc.input.order.amount,
        tc.input.order.days_since_delivery,
        tc.input.customer.refunds_90d,
      ];
      const c = { ...tc, values: routeValues(tc.input), raw, hit, doneAt, start, end };
      start += end;
      return c;
    });
  }, []);
  const total = cases[cases.length - 1].start + cases[cases.length - 1].end;
  const { t, ref } = useLoopClock(total, { startT: cases[0].doneAt + 1, restartOnView: true });

  const ci = Math.max(0, cases.findIndex((c) => t >= c.start && t < c.start + c.end));
  const c = cases[ci];
  const lt = t - c.start;
  const showInput = lt >= INPUT_AT;
  const done = lt >= c.doneAt;
  // Rows checked so far; once the first match is found Studio marks every row.
  const checked = done ? RULES.length : lt < EVAL_AT ? 0 : Math.min(c.hit + 1, Math.floor((lt - EVAL_AT) / ROW_MS) + 1);
  const out = RULES[c.hit].then;

  return (
    <div ref={ref} className="ordo-studio ordo-decision-table has-trace" lang={lang}>
      <div className="ordo-table-toolbar">
        <div className="ordo-table-toolbar__left">
          <span className="ordo-table-toolbar__btn ordo-table-toolbar__btn--primary">
            <Plus />
            {labels.addRow}
          </span>
          <span className="ordo-table-toolbar__sep" />
          <span className="ordo-table-toolbar__btn ordo-table-toolbar__btn--input">
            <Plus />
            {labels.addInputColumn}
          </span>
          <span className="ordo-table-toolbar__btn ordo-table-toolbar__btn--output">
            <Plus />
            {labels.addOutputColumn}
          </span>
        </div>
        <div className="ordo-table-toolbar__right">
          <span className="summary-chip">{labels.tableCases[c.key]}</span>
          <div className="ordo-table-toolbar__hit-policy">
            <span className="ordo-table-toolbar__label">{labels.hitPolicy}</span>
            <span className="ordo-table-toolbar__select">{labels.firstMatch}</span>
          </div>
        </div>
      </div>

      <div className="ordo-decision-table__scroll">
        <table className="ordo-decision-table__table">
          <thead>
            <tr className="ordo-decision-table__group-row">
              <th className="ordo-decision-table__group-spacer" />
              <th className="ordo-decision-table__group-th ordo-decision-table__group-th--trace">{labels.traceStatus}</th>
              <th colSpan={INPUT_COLS.length} className="ordo-decision-table__group-th ordo-decision-table__group-th--input">
                {labels.groupInput}
              </th>
              <th colSpan={OUTPUT_COLS.length} className="ordo-decision-table__group-th ordo-decision-table__group-th--output">
                {labels.groupOutput}
              </th>
            </tr>
            <tr>
              <th className="ordo-decision-table__th ordo-decision-table__th--handle">#</th>
              <th className="ordo-decision-table__th ordo-decision-table__th--trace">{labels.traceStatus}</th>
              {INPUT_COLS.map((col) => (
                <th key={col.path} className="ordo-decision-table__th ordo-decision-table__th--input">
                  <div className="ordo-decision-table__col-header">
                    <span className="ordo-decision-table__col-badge ordo-decision-table__col-badge--input">IN</span>
                    <span className="ordo-decision-table__col-label">{col.label}</span>
                    <span className="ordo-decision-table__col-type">{col.type}</span>
                  </div>
                  <div className="ordo-decision-table__col-path">{col.path}</div>
                </th>
              ))}
              {OUTPUT_COLS.map((name, i) => (
                <th
                  key={name}
                  className={`ordo-decision-table__th ordo-decision-table__th--output${i === 0 ? ' col-group-start--output' : ''}`}
                >
                  <div className="ordo-decision-table__col-header">
                    <span className="ordo-decision-table__col-badge ordo-decision-table__col-badge--output">OUT</span>
                    <span className="ordo-decision-table__col-label">{name}</span>
                    <span className="ordo-decision-table__col-type">string</span>
                  </div>
                  <div className="ordo-decision-table__col-path">{name}</div>
                </th>
              ))}
            </tr>
            <tr className="ordo-decision-table__trace-input-row">
              <th className="ordo-decision-table__th ordo-decision-table__th--handle">{labels.traceInputRow}</th>
              <th className="ordo-decision-table__th ordo-decision-table__th--trace">{labels.traceActual}</th>
              {c.raw.map((v, i) => (
                <th key={i} className="ordo-decision-table__th ordo-decision-table__th--input">
                  <div className={`ordo-decision-table__trace-actual ordo-decision-table__trace-actual--neutral${showInput ? '' : ' otable-pending'}`}>
                    {fmt(v)}
                  </div>
                </th>
              ))}
              {out.map((v, i) => (
                <th
                  key={i}
                  className={`ordo-decision-table__th ordo-decision-table__th--output${i === 0 ? ' col-group-start--output' : ''}`}
                >
                  <div className={`ordo-decision-table__trace-actual ordo-decision-table__trace-actual--neutral${done ? '' : ' otable-pending'}`}>
                    {fmt(v)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RULES.map((r, ri) => {
              const isChecked = ri < checked;
              const isHit = isChecked && ri === c.hit;
              const cells = r.when.map(toCell);
              const verdicts = r.when.map((s, i) => cellMatches(s, c.values[i]));
              const miss = verdicts.findIndex((v) => !v);
              const reason =
                miss < 0
                  ? labels.traceAllMatched
                  : cells[miss].type === 'exact'
                    ? `${fmt(c.raw[miss])} != ${cellText(cells[miss])}`
                    : `${fmt(c.raw[miss])} in ${cellText(cells[miss])}`;
              return (
                <tr
                  key={ri}
                  className={`ordo-decision-table__row${isHit ? ' ordo-decision-table__row--trace-match' : ''}`}
                >
                  <td className="ordo-decision-table__td ordo-decision-table__td--handle">
                    <DragHandle />
                    <span className="ordo-decision-table__priority">{ri + 1}</span>
                  </td>
                  <td className="ordo-decision-table__td ordo-decision-table__td--trace">
                    <div className={isChecked ? '' : 'otable-pending'}>
                      <div
                        className={`ordo-decision-table__trace-status ordo-decision-table__trace-status--${isHit ? 'matched' : 'unmatched'}`}
                      >
                        {isHit ? labels.traceMatched : labels.traceNotMatched}
                      </div>
                      <div className="ordo-decision-table__trace-reason">{reason}</div>
                    </div>
                  </td>
                  {cells.map((cell, i) => {
                    const v = isChecked
                      ? verdicts[i]
                        ? ' ordo-decision-table__trace-actual--match'
                        : ' ordo-decision-table__trace-actual--mismatch'
                      : '';
                    return (
                      <td key={i} className={`ordo-decision-table__td ordo-decision-table__td--input${v}`}>
                        <div className={`ordo-decision-table__cell-display cell-type--${cell.type}`}>
                          <div className="ordo-decision-table__cell-stack">
                            <span>{cellText(cell)}</span>
                            <span className={`ordo-decision-table__cell-actual${showInput ? '' : ' otable-pending'}`}>
                              {labels.traceActual}: {fmt(c.raw[i])}
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  {r.then.map((v, i) => (
                    <td
                      key={i}
                      className={`ordo-decision-table__td ordo-decision-table__td--output${i === 0 ? ' col-group-start--output' : ''}`}
                    >
                      <div className="ordo-decision-table__cell-display cell-type--exact">{v}</div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
