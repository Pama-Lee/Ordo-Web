import { useMemo } from 'react';
import FlowCanvas from './FlowCanvas';
import { LR, TB } from './flowModel';
import { SAMPLES, runRefundRouting, type RefundInput, type RefundResult, type StepId } from './refundRouting';
import { demoLabels, type DemoLabels } from './labels';
import { useLoopClock } from './useLoopClock';
import './demo.css';

// ── timeline (ms, per case) ─────────────────────────────────────────────────
const FILL_AT = 150;
const LINE_MS = 55;
const RUN_AT = 1250;
const STEP_AT = 1500;
const STEP_MS = 430;
const RESULT_GAP = 380;
const HOLD = 2300;

interface JsonLine {
  text: string;
  /** Input fields on this line, used to mark what the current step reads. */
  fields: string[];
}

function inputLines(i: RefundInput): JsonLine[] {
  const s = (v: string) => JSON.stringify(v);
  return [
    { text: '{', fields: [] },
    { text: '  "jev": {', fields: [] },
    { text: '    "intent": {', fields: [] },
    { text: `      "choice": ${s(i.jev.intent.choice)},`, fields: ['choice'] },
    { text: `      "confidence": ${i.jev.intent.confidence}`, fields: ['confidence'] },
    { text: '    },', fields: [] },
    { text: `    "urgency": { "score": ${i.jev.urgency.score} },`, fields: ['urgency'] },
    { text: `    "chargeback": { "noul": ${i.jev.chargeback.noul} }`, fields: ['chargeback'] },
    { text: '  },', fields: [] },
    { text: '  "order": {', fields: [] },
    { text: `    "amount": ${s(i.order.amount)},`, fields: ['amount'] },
    { text: `    "days_since_delivery": ${i.order.days_since_delivery}`, fields: ['days'] },
    { text: '  },', fields: [] },
    { text: `  "customer": { "refunds_90d": ${i.customer.refunds_90d} }`, fields: ['refunds'] },
    { text: '}', fields: [] },
  ];
}

const READS: Partial<Record<StepId, string[]>> = {
  escalation: ['chargeback'],
  intent: ['choice', 'confidence'],
  priority: ['urgency'],
  route: ['choice', 'confidence', 'amount', 'days', 'refunds'],
};

/** Light JSON highlighting: keys, strings, numbers. */
function JsonText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      parts.push(<span key={k++} className="od-j-key">{m[1]}</span>, m[2]);
    } else if (m[1]) {
      parts.push(<span key={k++} className="od-j-str">{m[1]}</span>);
    } else {
      parts.push(<span key={k++} className="od-j-num">{m[3]}</span>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

interface Case {
  key: (typeof SAMPLES)[number]['key'];
  message: string;
  input: RefundInput;
  result: RefundResult;
  lines: JsonLine[];
  start: number;
  resultAt: number;
  end: number;
}

function buildCases(): Case[] {
  let start = 0;
  return SAMPLES.map((s) => {
    const result = runRefundRouting(s.input);
    const resultAt = STEP_AT + (result.path.length - 1) * STEP_MS + RESULT_GAP;
    const end = resultAt + HOLD;
    const c = { ...s, result, lines: inputLines(s.input), start, resultAt, end };
    start += end;
    return c;
  });
}

/** Condensed input for the phone layout: [label, value, field]. */
function facts(i: RefundInput): [string, string, string][] {
  return [
    ['choice', i.jev.intent.choice, 'choice'],
    ['confidence', String(i.jev.intent.confidence), 'confidence'],
    ['urgency', String(i.jev.urgency.score), 'urgency'],
    ['chargeback', String(i.jev.chargeback.noul), 'chargeback'],
    ['amount', i.order.amount, 'amount'],
    ['days', String(i.order.days_since_delivery), 'days'],
    ['refunds_90d', String(i.customer.refunds_90d), 'refunds'],
  ];
}

function RunButton({ running, labels }: { running: boolean; labels: DemoLabels }) {
  return (
    <span className={`od-run${running ? ' is-running' : ''}`}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M3.5 2.2v7.6L9.8 6Z" fill="currentColor" />
      </svg>
      {running ? labels.running : labels.run}
    </span>
  );
}

export default function HeroStudio({ lang }: { lang: string }) {
  const labels = demoLabels(lang);
  const cases = useMemo(buildCases, []);
  const total = cases[cases.length - 1].start + cases[cases.length - 1].end;
  // Server render and reduced motion: the first case, finished.
  const { t, setT, ref } = useLoopClock(total, { startT: cases[0].resultAt + 1 });

  const ci = cases.findIndex((c) => t >= c.start && t < c.start + c.end);
  const c = cases[ci < 0 ? 0 : ci];
  const lt = t - c.start;

  const linesShown = Math.max(0, Math.min(c.lines.length, Math.floor((lt - FILL_AT) / LINE_MS) + 1));
  const stepsLit = lt < STEP_AT ? 0 : Math.min(c.result.path.length, Math.floor((lt - STEP_AT) / STEP_MS) + 1);
  const lit = c.result.path.slice(0, stepsLit);
  const running = lt >= RUN_AT && lt < c.resultAt;
  const showResult = lt >= c.resultAt;
  const currentReads = stepsLit && !showResult ? READS[lit[lit.length - 1].id] ?? [] : [];

  const pick = (i: number) => setT(cases[i].start);

  const chips = (
    <div className="od-chips" role="group">
      {cases.map((k, i) => (
        <button
          key={k.key}
          type="button"
          className={`od-chip${k === c ? ' is-active' : ''}`}
          onClick={() => pick(i)}
          aria-pressed={k === c}
        >
          {labels.samples[k.key]}
        </button>
      ))}
    </div>
  );

  const result = (
    <div className={`od-result${showResult ? ' is-shown' : ''}`}>
      <div className="od-kv">
        <span className="od-k">{labels.code}</span>
        <span className={`od-result-code od-c-${c.result.code}`}>{c.result.code}</span>
      </div>
      <div className="od-kv">
        <span className="od-k">{labels.resultMessage}</span>
        <span className="od-v">{c.result.message}</span>
      </div>
      <div className="od-kv od-kv-top od-hide-compact">
        <span className="od-k">{labels.output}</span>
        <div className="od-outrows">
          {Object.keys(c.result.output)
            .sort()
            .map((k) => (
              <div key={k}>
                <JsonText text={`${JSON.stringify(k)}: ${JSON.stringify(c.result.output[k])}`} />
              </div>
            ))}
        </div>
      </div>
      <div className="od-kv od-kv-top">
        <span className="od-k">{labels.path}</span>
        <span className="od-path">{c.result.path.map((p) => p.id).join(' → ')}</span>
      </div>
    </div>
  );

  const tabs = labels.tabs;

  return (
    <div ref={ref} className="od-root od-window" lang={lang}>
      {/* title bar */}
      <div className="od-titlebar">
        <span className="od-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="od-titlebar-text">Ordo Studio · {labels.project}</span>
      </div>

      <div className="od-body">
        {/* sidebar */}
        <aside className="od-sidebar">
          <div className="od-brand">
            <img src="/images/favicon_io/apple-touch-icon.png" alt="" width={22} height={22} />
            <span>
              <b>Ordo</b>
              <small>{labels.studio}</small>
            </span>
          </div>
          <div className="od-org">
            <small>{labels.org}</small>
          </div>
          <p className="od-side-h">{labels.workspace}</p>
          <span className="od-side-item">{labels.dashboard}</span>
          <span className="od-side-item is-active">{labels.projects}</span>
          <p className="od-side-h">{labels.rulesets}</p>
          <span className="od-side-file is-active">refund-routing</span>
        </aside>

        <div className="od-main">
          <div className="od-header">
            <span className="od-header-title">{labels.project}</span>
            <span className="od-header-sub">refund-routing</span>
          </div>
          <nav className="od-tabs" aria-hidden="true">
            {tabs.map((tab, i) => (
              <span key={tab} className={`od-tab${i === 0 ? ' is-active' : ''}`}>
                {tab}
              </span>
            ))}
          </nav>
          <div className="od-editorbar">
            <span className="od-filetab">refund-routing</span>
            <span className="od-menu od-hide-compact">
              {labels.menu.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </span>
            <span className="od-spacer" />
            <span className="od-version od-hide-compact">
              {labels.version} <b>1.0.0</b>
            </span>
          </div>

          <div className="od-content">
            <div className="od-canvas-wrap">
              <div className="od-only-wide">
                <FlowCanvas layout={LR} lit={lit} tracing={stepsLit > 0} labels={labels} />
              </div>
              <div className="od-only-compact">
                <FlowCanvas layout={TB} lit={lit} tracing={stepsLit > 0} labels={labels} />
              </div>
            </div>

            {/* execution panel */}
            <section className="od-panel" aria-live="off">
              <div className="od-panel-head">
                <span>{labels.execute}</span>
                <RunButton running={running} labels={labels} />
              </div>
              {chips}
              <div className="od-panel-sec od-hide-compact">
                <p className="od-sec-h">{labels.message}</p>
                <p className="od-message">“{c.message}”</p>
              </div>
              <div className="od-panel-sec">
                <p className="od-sec-h">{labels.input}</p>
                <div className="od-facts od-only-compact-grid">
                  {facts(c.input).map(([k, v, f], i) => (
                    <div
                      key={k}
                      className={`od-fact${i * 2 < linesShown ? ' is-shown' : ''}${currentReads.includes(f) ? ' is-read' : ''}`}
                    >
                      <span>{k}</span>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
                <pre className="od-json od-hide-compact">
                  {c.lines.map((l, i) => (
                    <div
                      key={i}
                      className={`od-jl${i < linesShown ? ' is-shown' : ''}${
                        l.fields.some((f) => currentReads.includes(f)) ? ' is-read' : ''
                      }`}
                    >
                      <JsonText text={l.text} />
                    </div>
                  ))}
                </pre>
              </div>
              <div className="od-panel-sec">
                <p className="od-sec-h">{labels.result}</p>
                {result}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
