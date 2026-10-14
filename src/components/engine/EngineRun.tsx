import { useMemo } from 'react';
import { SAMPLES, ROUTE_COLUMNS, routeRules, ROUTE_DEFAULT, routeValues, runRefundRouting } from '../demo/refundRouting';
import type { RefundInput, RefundResult, Sample, TraceStep } from '../demo/refundRouting';
import { useLoopClock } from '../demo/useLoopClock';
import type { EngineCopy } from '../../i18n/engine';

type RunCopy = EngineCopy['run'];

// Step names and conditions as written in refund-routing.json.
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
  /** What was checked, as written in the rule. */
  check?: string;
  /** The values it was checked against. */
  actual?: string;
  verdict?: { ok: boolean; text: string };
  next?: string;
  terminal?: boolean;
}

/** Keys sorted, as `ordo trace` prints them. */
function sortedJson(o: Record<string, string | number>) {
  return JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))));
}

function fmt(v: number | string) {
  return typeof v === 'number' ? String(v) : JSON.stringify(v);
}

function describe(step: TraceStep, nextId: string | undefined, input: RefundInput, c: RunCopy): Line {
  const base = { id: step.id, name: STEP_NAMES[step.id], next: nextId };
  const hit = (step.taken ?? -1) >= 0;
  const verdict = { ok: hit, text: hit ? c.matched : c.notMatched };
  switch (step.id) {
    case 'escalation':
      return { ...base, check: 'jev.chargeback.noul >= 0.5', actual: `noul = ${input.jev.chargeback.noul}`, verdict };
    case 'intent':
      return {
        ...base,
        check: 'jev.intent.choice != "refund" && jev.intent.confidence >= 0.6',
        actual: `choice = "${input.jev.intent.choice}", confidence = ${input.jev.intent.confidence}`,
        verdict,
      };
    case 'priority':
      return {
        ...base,
        check: 'jev.urgency.score >= 1.5 → "high", default "normal"',
        actual: `score = ${input.jev.urgency.score}`,
        verdict: { ok: hit, text: hit ? '$priority = "high"' : '$priority = "normal"' },
      };
    case 'route': {
      const rules = routeRules();
      const row = step.taken ?? -1;
      const values = routeValues(input);
      const then = row >= 0 ? rules[row].then : ROUTE_DEFAULT;
      const check =
        row >= 0
          ? `${c.row.replace('{n}', String(row + 1))}: ${rules[row].when.join(' | ')}`
          : c.defaultRow;
      return {
        ...base,
        check,
        actual: ROUTE_COLUMNS.map((col, i) => `${col.path.split('.').pop()} = ${fmt(values[i])}`).join(', '),
        verdict: { ok: true, text: `$decision = "${then[0]}"` },
      };
    }
    case 'dispatch': {
      const t = step.taken ?? -1;
      const check = t === 0 ? '$decision == "AUTO_REFUND"' : t === 1 ? '$decision == "LLM_DRAFT"' : 'default';
      return { ...base, check, verdict: { ok: t >= 0, text: t >= 0 ? c.matched : c.notMatched } };
    }
    default:
      return { ...base, terminal: true };
  }
}

function linesFor(result: RefundResult, input: RefundInput, c: RunCopy): Line[] {
  return result.path.map((s, i) => describe(s, result.path[i + 1]?.id, input, c));
}

const INTRO = 700;
const PER_STEP = 650;
const HOLD = 3400;

function sampleMs(s: Sample, steps: number) {
  return INTRO + steps * PER_STEP + PER_STEP + HOLD;
}

export default function EngineRun({ copy }: { copy: RunCopy }) {
  const runs = useMemo(
    () =>
      SAMPLES.map((s) => {
        const result = runRefundRouting(s.input);
        return { sample: s, result, lines: linesFor(result, s.input, copy) };
      }),
    [copy],
  );
  const starts = useMemo(() => {
    let acc = 0;
    return runs.map((r) => {
      const at = acc;
      acc += sampleMs(r.sample, r.lines.length);
      return at;
    });
  }, [runs]);
  const total = starts[starts.length - 1] + sampleMs(runs[runs.length - 1].sample, runs[runs.length - 1].lines.length);

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

          <div className="erun-label">{copy.input}</div>
          <pre className="erun-json">
            <span className="erun-c">{'// '}{copy.jev}</span>
            {'\n"jev": {\n'}
            {`  "intent": {\n    "choice": "${input.jev.intent.choice}",\n    "confidence": ${input.jev.intent.confidence}\n  },\n`}
            {`  "urgency": { "score": ${input.jev.urgency.score} },\n`}
            {`  "chargeback": { "noul": ${input.jev.chargeback.noul} }\n},\n`}
            <span className="erun-c">{'// '}{copy.facts}</span>
            {`\n"order": {\n  "amount": "${input.order.amount}",\n  "days_since_delivery": ${input.order.days_since_delivery}\n},\n`}
            {`"customer": { "refunds_90d": ${input.customer.refunds_90d} }`}
          </pre>
        </div>

        <div className="erun-col">
          <div className="erun-label">{copy.steps}</div>
          <ol className="erun-steps">
            {run.lines.map((l, i) => (
              <li key={`${run.sample.key}-${l.id}`} className={`erun-step${i < shown ? ' is-on' : ''}${l.terminal ? ' is-end' : ''}`}>
                <div className="erun-step-head">
                  <span className="erun-id">{l.id}</span>
                  <span className="erun-name">{l.name}</span>
                  {l.next && <span className="erun-next">→ {l.next}</span>}
                  {l.terminal && <span className="erun-next">{copy.end}</span>}
                </div>
                {l.check && <code className="erun-check">{l.check}</code>}
                {(l.actual || l.verdict) && (
                  <div className="erun-actual">
                    {l.actual && <span>{l.actual}</span>}
                    {l.verdict && <span className={`erun-verdict${l.verdict.ok ? ' ok' : ''}`}>{l.verdict.text}</span>}
                  </div>
                )}
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
