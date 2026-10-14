import { useMemo } from 'react';
import FlowCanvas from './FlowCanvas';
import { LR, nodeCenter } from './flowModel';
import { SAMPLES, runRefundRouting, type RefundInput, type RefundResult, type StepId } from './refundRouting';
import { demoLabels } from './labels';
import { useLoopClock } from './useLoopClock';
import './demo.css';

// ── timeline (ms, per case) ─────────────────────────────────────────────────
const FILL_AT = 150;
const LINE_MS = 45;
const RUN_AT = 1250;
const STEP_AT = 1450;
const STEP_MS = 560;
const RESULT_GAP = 300;
const HOLD = 2400;

// Canvas viewports (CSS px inside the scaled block) and zoom levels.
const WIDE = { w: 808, h: 680, zoom: 0.8 };
const NARROW = { w: 380, h: 330, zoom: 0.6 };

interface Case {
  key: (typeof SAMPLES)[number]['key'];
  input: RefundInput;
  durationsUs: number[];
  result: RefundResult;
  pretty: string[];
  compact: string;
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
    const c: Case = {
      key: s.key,
      input: s.input,
      durationsUs: s.durationsUs,
      result,
      // Studio's TestView formatJson: JSON.stringify(value, null, 2)
      pretty: JSON.stringify(s.input, null, 2).split('\n'),
      compact: JSON.stringify(s.input),
      start,
      resultAt,
      end,
    };
    start += end;
    return c;
  });
}

/** Keep the current step (and the one before it) in view, like panning the canvas by hand. */
function camera(vp: { w: number; h: number; zoom: number }, focus: StepId[]) {
  const pts = focus.map((id) => nodeCenter(LR, id));
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const gw = LR.width * vp.zoom;
  const x = Math.min(0, Math.max(vp.w - gw, vp.w / 2 - cx * vp.zoom));
  const gh = LR.height * vp.zoom;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const y = gh <= vp.h ? (vp.h - gh) / 2 : Math.min(0, Math.max(vp.h - gh, vp.h / 2 - cy * vp.zoom));
  return { x, y, zoom: vp.zoom };
}

export default function HeroStudio({ lang }: { lang: string }) {
  const labels = demoLabels(lang);
  const cases = useMemo(buildCases, []);
  const total = cases[cases.length - 1].start + cases[cases.length - 1].end;
  // Server render and reduced motion: the first case, finished.
  const { t, ref } = useLoopClock(total, { startT: cases[0].resultAt + 1 });

  const ci = cases.findIndex((c) => t >= c.start && t < c.start + c.end);
  const c = cases[ci < 0 ? 0 : ci];
  const lt = t - c.start;

  const linesShown = Math.max(0, Math.min(c.pretty.length, Math.floor((lt - FILL_AT) / LINE_MS) + 1));
  const charsShown = Math.round((linesShown / c.pretty.length) * c.compact.length);
  const stepsLit = lt < STEP_AT ? 0 : Math.min(c.result.path.length, Math.floor((lt - STEP_AT) / STEP_MS) + 1);
  const lit = c.result.path.slice(0, stepsLit);
  const tracing = lt >= RUN_AT;
  const showResult = lt >= c.resultAt;

  const focus: StepId[] = lit.length ? lit.slice(-2).map((s) => s.id) : ['escalation'];
  const outputJson = JSON.stringify(c.result.output, Object.keys(c.result.output).sort());

  const canvas = (vp: typeof WIDE) => (
    <FlowCanvas
      layout={LR}
      lit={lit}
      durationsUs={c.durationsUs}
      resultCode={c.result.code}
      tracing={tracing}
      labels={labels}
      view={camera(vp, focus)}
      width={vp.w}
      height={vp.h}
    />
  );

  return (
    <div ref={ref} className="ordo-studio ohero" lang={lang}>
      <div className="ohero-canvas ohero-wide">{canvas(WIDE)}</div>
      <div className="ohero-canvas ohero-narrow">{canvas(NARROW)}</div>

      <div className="section-card ohero-card">
        <div className="ohero-card-head">
          <span className="section-card__title">{labels.flowReplay}</span>
          <span className="summary-chip">{labels.samples[c.key]}</span>
        </div>
        <div className="snapshot-block">
          <div className="snapshot-block__label">{labels.inputSnapshot}</div>
          <pre className="ohero-wide">
            {c.pretty.map((l, i) => (
              <span key={i} className={`ohero-line${i < linesShown ? ' is-shown' : ''}`}>
                {l}
                {'\n'}
              </span>
            ))}
          </pre>
          <pre className="ohero-narrow ohero-compact">
            <span>{c.compact.slice(0, charsShown)}</span>
            <span className="ohero-ghost">{c.compact.slice(charsShown)}</span>
          </pre>
        </div>
        <div className={`trace-summary ohero-result${showResult ? ' is-shown' : ''}`}>
          <div className="trace-summary__item">
            <span>{labels.code}</span>
            <strong>{c.result.code}</strong>
          </div>
          <div className="trace-summary__item">
            <span>{labels.output}</span>
            <pre>{outputJson}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
