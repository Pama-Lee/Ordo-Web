import { useMemo } from 'react';
import { SAMPLES, routeRules, ROUTE_DEFAULT, runRefundRouting } from '../demo/refundRouting';
import type { RefundResult, Sample } from '../demo/refundRouting';
import { useLoopClock } from '../demo/useLoopClock';
import type { EngineCopy } from '../../i18n/engine';

type RunCopy = EngineCopy['run'];

// Step names as written in refund-routing.json.
const STEP_NAMES: Record<string, string> = {
  escalation: 'Chargeback or legal threat',
  intent: 'Is it a refund request',
  priority: 'Priority',
  route: 'Route by confidence and order',
  dispatch: 'Dispatch',
  auto_refund: 'Auto refund',
  llm_draft: 'LLM draft',
  human_review: 'Human review',
  escalate: 'Escalate',
  other_team: 'Other team',
};

interface Line {
  id: string;
  name: string;
  /** A value the step set, e.g. $decision = "AUTO_REFUND". */
  set?: string;
  terminal: boolean;
}

function linesFor(result: RefundResult): Line[] {
  return result.path.map((s, i) => {
    const terminal = i === result.path.length - 1;
    let set: string | undefined;
    if (s.id === 'priority') set = `$priority = "${(s.taken ?? -1) >= 0 ? 'high' : 'normal'}"`;
    if (s.id === 'route') {
      const row = s.taken ?? -1;
      set = `$decision = "${(row >= 0 ? routeRules()[row].then : ROUTE_DEFAULT)[0]}"`;
    }
    return { id: s.id, name: STEP_NAMES[s.id], set, terminal };
  });
}

/** Keys sorted, as `ordo trace` prints them. */
function sortedJson(o: Record<string, string | number>) {
  return JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))));
}

const INTRO = 600;
const PER_STEP = 550;
const HOLD = 3200;

const sampleMs = (steps: number) => INTRO + (steps + 1) * PER_STEP + HOLD;

export default function EngineRun({ copy }: { copy: RunCopy }) {
  const runs = useMemo(
    () =>
      SAMPLES.map((s: Sample) => {
        const result = runRefundRouting(s.input);
        return { sample: s, result, lines: linesFor(result) };
      }),
    [],
  );
  const starts: number[] = [];
  let total = 0;
  for (const r of runs) {
    starts.push(total);
    total += sampleMs(r.lines.length);
  }

  // The server renders the first sample fully revealed; the loop restarts when it scrolls into view.
  const fullFirst = INTRO + (runs[0].lines.length + 1) * PER_STEP;
  const { t, setT, ref, reduced } = useLoopClock(total, { startT: fullFirst, restartOnView: true });

  let idx = starts.findIndex((s, i) => t >= s && (i === starts.length - 1 || t < starts[i + 1]));
  if (idx < 0) idx = 0;
  const local = reduced ? Infinity : t - starts[idx];
  const run = runs[idx];
  const shown = Math.max(0, Math.floor((local - INTRO) / PER_STEP) + 1);
  const showResult = shown > run.lines.length;
  const { input } = run.sample;

  const facts: [string, string][] = [
    ['jev.intent', `${input.jev.intent.choice} (${input.jev.intent.confidence})`],
    ['jev.chargeback', String(input.jev.chargeback.noul)],
    ['order.amount', input.order.amount],
    ['order.days_since_delivery', String(input.order.days_since_delivery)],
    ['customer.refunds_90d', String(input.customer.refunds_90d)],
  ];

  return (
    <div ref={ref} className="erun">
      <div className="erun-tabs" role="tablist">
        {runs.map((r, i) => (
          <button
            key={r.sample.key}
            role="tab"
            aria-selected={i === idx}
            className={`erun-tab${i === idx ? ' is-on' : ''}`}
            onClick={() => setT(starts[i])}
          >
            {copy.samples[r.sample.key]}
          </button>
        ))}
      </div>

      <div className="erun-grid">
        <div className="erun-col">
          <div className="erun-label">{copy.said}</div>
          <p className="erun-quote">“{run.sample.message}”</p>
          <dl className="erun-facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="erun-col">
          <div className="erun-label">{copy.steps}</div>
          <ol className="erun-steps">
            {run.lines.map((l, i) => (
              <li key={`${run.sample.key}-${l.id}`} className={`erun-step${i < shown ? ' is-on' : ''}${l.terminal ? ' is-end' : ''}`}>
                <div className="erun-step-head">
                  <span className="erun-id">{l.id}</span>
                  <span className="erun-name">{l.name}</span>
                  {l.set && <span className="erun-verdict ok">{l.set}</span>}
                </div>
              </li>
            ))}
          </ol>

          <div className={`erun-result${showResult ? ' is-on' : ''}`}>
            <div className="erun-label">{copy.result}</div>
            <div className="erun-code">{run.result.code}</div>
            <div className="erun-msg">{run.result.message}</div>
            <pre className="erun-out">{sortedJson(run.result.output)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
