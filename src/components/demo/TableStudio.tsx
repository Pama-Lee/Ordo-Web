import { useMemo } from 'react';
import {
  ROUTE_COLUMNS,
  ROUTE_DEFAULT,
  TABLE_CASES,
  cellMatches,
  matchRoute,
  routeRules,
  routeValues,
} from './refundRouting';
import { demoLabels } from './labels';
import { useLoopClock } from './useLoopClock';
import './demo.css';

const INPUT_AT = 200;
const EVAL_AT = 700;
const ROW_MS = 420;
const HOLD = 2600;

const RULES = routeRules();

export default function TableStudio({ lang }: { lang: string }) {
  const labels = demoLabels(lang);
  const cases = useMemo(() => {
    let start = 0;
    return TABLE_CASES.map((tc) => {
      const m = matchRoute(tc.input);
      const hit = m < 0 ? RULES.length : m; // default row sits after the rules
      const doneAt = EVAL_AT + hit * ROW_MS + 150;
      const end = doneAt + HOLD;
      const c = { ...tc, values: routeValues(tc.input), hit, doneAt, start, end };
      start += end;
      return c;
    });
  }, []);
  const total = cases[cases.length - 1].start + cases[cases.length - 1].end;
  const { t, setT, ref } = useLoopClock(total, { startT: cases[0].doneAt + 1, restartOnView: true });

  const ci = Math.max(0, cases.findIndex((c) => t >= c.start && t < c.start + c.end));
  const c = cases[ci];
  const lt = t - c.start;
  const showInput = lt >= INPUT_AT;
  // rows evaluated so far (0..hit+1)
  const evaluated = lt < EVAL_AT ? 0 : Math.min(c.hit + 1, Math.floor((lt - EVAL_AT) / ROW_MS) + 1);
  const done = lt >= c.doneAt;
  const out = c.hit < RULES.length ? RULES[c.hit].then : ROUTE_DEFAULT;

  const fmt = (v: string | number) => String(v);
  const typeOf = (i: number) => ROUTE_COLUMNS[i].type;

  return (
    <div ref={ref} className="od-root od-tablewin" lang={lang}>
      <div className="od-editorbar">
        <span className="od-filetab">
          refund-routing <span className="od-crumb">›</span> route
        </span>
        <span className="od-spacer" />
        <span className="od-viewtoggle" aria-hidden="true">
          <span title="Flow">
            <svg viewBox="0 0 14 14"><rect x="1.5" y="2" width="4" height="3" rx=".6" /><rect x="8.5" y="9" width="4" height="3" rx=".6" /><path d="M5.5 3.5h2a1 1 0 0 1 1 1v5" fill="none" /></svg>
          </span>
          <span className="is-active" title="Table">
            <svg viewBox="0 0 14 14"><rect x="1.5" y="2" width="11" height="10" rx="1" fill="none" /><path d="M1.5 5.5h11M5.5 5.5V12" fill="none" /></svg>
          </span>
        </span>
      </div>

      <div className="od-tabletools">
        <span className="od-btn-primary">+ {labels.addRow}</span>
        <span className="od-spacer" />
        <span className="od-hitpolicy">
          {labels.hitPolicy}
          <b>{labels.firstMatch}</b>
        </span>
        <span className="od-btn-ghost od-hide-narrow">{labels.showAsFlow}</span>
      </div>

      <div className="od-chips od-chips-table" role="group">
        {cases.map((k, i) => (
          <button
            key={k.key}
            type="button"
            className={`od-chip${i === ci ? ' is-active' : ''}`}
            onClick={() => setT(k.start)}
            aria-pressed={i === ci}
          >
            {labels.tableCases[k.key]}
          </button>
        ))}
      </div>

      <div className="od-dt-wrap">
        <table className="od-dt">
          <thead>
            <tr className="od-dt-groups">
              <th />
              <th colSpan={5} className="od-g-in">
                {labels.conditions}
              </th>
              <th colSpan={2} className="od-g-out od-hide-narrow">
                {labels.outputs}
              </th>
              <th className="od-g-out od-show-narrow">{labels.outputs}</th>
              <th className="od-g-trace">{labels.trace}</th>
            </tr>
            <tr className="od-dt-cols">
              <th>#</th>
              {ROUTE_COLUMNS.map((col, i) => (
                <th key={col.path} className={i === 4 ? 'od-sep-in' : ''}>
                  <span className="od-colhead">
                    <span className="od-badge od-badge-in">IN</span>
                    <span className="od-collabel">{labels.colLabels[i]}</span>
                  </span>
                  <span className="od-colpath">{col.path.split('.').slice(-1)[0]}</span>
                </th>
              ))}
              <th>
                <span className="od-colhead">
                  <span className="od-badge od-badge-out">OUT</span>
                  <span className="od-collabel">{labels.colLabels[5]}</span>
                </span>
                <span className="od-colpath">decision</span>
              </th>
              <th className="od-hide-narrow od-sep-out">
                <span className="od-colhead">
                  <span className="od-badge od-badge-out">OUT</span>
                  <span className="od-collabel">{labels.colLabels[6]}</span>
                </span>
                <span className="od-colpath">reason</span>
              </th>
              <th className="od-trace-h" />
            </tr>
            <tr className={`od-dt-input${showInput ? ' is-shown' : ''}`}>
              <th className="od-input-label">{labels.traceInput}</th>
              {c.values.map((v, i) => (
                <td key={i} className={i === 4 ? 'od-sep-in' : ''}>
                  <span className="od-actual">{fmt(v)}</span>
                </td>
              ))}
              <td>
                <span className={`od-actual od-out-val${done ? ' is-shown' : ''}`}>{out[0]}</span>
              </td>
              <td className="od-hide-narrow od-sep-out">
                <span className={`od-actual od-out-val${done ? ' is-shown' : ''}`}>{out[1] || '""'}</span>
              </td>
              <td />
            </tr>
          </thead>
          <tbody>
            {[...RULES.map((r) => r.when as string[]), null].map((when, ri) => {
              const isEval = ri < evaluated;
              const isHit = isEval && ri === c.hit;
              const then = when ? RULES[ri].then : ROUTE_DEFAULT;
              return (
                <tr
                  key={ri}
                  className={`od-dt-row${isEval ? ' is-eval' : ''}${isHit ? ' is-hit' : isEval ? ' is-skip' : ''}${
                    when ? '' : ' is-default'
                  }`}
                >
                  <td className="od-rowno">{when ? ri + 1 : ''}</td>
                  {when ? (
                    when.map((cell, i) => {
                      const any = cell === '-';
                      const ok = cellMatches(cell, c.values[i]);
                      const v = isEval && !any ? (ok ? ' is-match' : ' is-miss') : '';
                      return (
                        <td key={i} className={`od-cell${v}${i === 4 ? ' od-sep-in' : ''}${typeOf(i) === 'string' ? ' od-str' : ''}`}>
                          {any ? '*' : cell}
                        </td>
                      );
                    })
                  ) : (
                    <td colSpan={5} className="od-cell od-otherwise od-sep-in">
                      {labels.otherwise}
                    </td>
                  )}
                  <td className="od-cell od-outcell">{then[0]}</td>
                  <td className="od-cell od-outcell od-hide-narrow od-sep-out">{then[1] || '""'}</td>
                  <td className="od-tracecell">
                    <span className={`od-status${isHit ? ' is-hit' : isEval ? ' is-skip' : ''}`}>
                      <i aria-hidden="true" />
                      <span className="od-status-text">{isHit ? labels.matched : isEval ? labels.skipped : ''}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
