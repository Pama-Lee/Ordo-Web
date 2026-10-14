import { useMemo } from 'react';
import { routeRules, runRefundRouting, type RefundInput } from './refundRouting';
import { useLoopClock } from './useLoopClock';

// Numbers from `ordo impact refund-routing` in the jev-routing pack:
// 309 inputs, 21 changed (18 LLM_DRAFT → AUTO_REFUND, 3 LLM_DRAFT → HUMAN_REVIEW).
const TOTAL = 309;
const CHANGED = 21;

const SWITCH_AT = 700;
const SWEEP_AT = 1300;
const SWEEP_MS = 2400;
const ROW_AT = [3900, 4400];
const REST_AT = 4900;
const LOOP = 13000;

interface Panel {
  label: string;
  from: string;
  to: string;
  summary: string;
  rows: { who: string; from: string; to: string }[];
  rest: string;
}

// The two example rows in the copy, as rule inputs.
function rowInput(confidence: number, amount: string, days: number): RefundInput {
  return {
    jev: { intent: { choice: 'refund', confidence }, urgency: { score: 0 }, chargeback: { noul: 0 } },
    order: { amount, days_since_delivery: days },
    customer: { refunds_90d: 0 },
  };
}
const ROW_INPUTS = [rowInput(0.84, '129.00', 1), rowInput(0.8, '39.90', 2)];

/** 21 fixed positions among the 309 dots, spread out but irregular. */
function changedSet(): Set<number> {
  const s = new Set<number>();
  let x = 7;
  while (s.size < CHANGED) {
    x = (x * 1103515245 + 12345) % 2147483648;
    s.add(x % TOTAL);
  }
  return s;
}

export default function ImpactDemo({ panel: p }: { panel: Panel }) {
  const changed = useMemo(changedSet, []);
  const codes = useMemo(
    () =>
      ROW_INPUTS.map((input) => [
        runRefundRouting(input, routeRules('>= 0.85')).code,
        runRefundRouting(input, routeRules('>= 0.8')).code,
      ]),
    [],
  );
  // Server render and reduced motion show the end state; the loop restarts when scrolled into view.
  const { t, ref } = useLoopClock(LOOP, { startT: REST_AT + 1, restartOnView: true });

  const switched = t >= SWITCH_AT;
  const swept = t < SWEEP_AT ? -1 : Math.min(TOTAL - 1, Math.floor(((t - SWEEP_AT) / SWEEP_MS) * TOTAL));
  let count = 0;
  changed.forEach((i) => {
    if (i <= swept) count++;
  });

  const [before, after] = p.summary.split(String(CHANGED));
  const summary =
    after !== undefined ? (
      <>
        {before}
        <span className="tabular-nums">{count}</span>
        {after}
      </>
    ) : (
      p.summary
    );

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_12px_40px_rgba(45,42,38,0.06)] p-7 sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <span className="text-[14px] text-[#6B6560]">{p.label}</span>
        <span className="text-[28px] font-black tracking-[-0.02em] tabular-nums whitespace-nowrap">
          <span
            className={`transition-colors duration-500 decoration-2 ${
              switched ? 'text-[#B8B0A8] line-through' : 'text-[#2D2A26]'
            }`}
          >
            {p.from}
          </span>
          <span className={`transition-opacity duration-500 ${switched ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[#B8B0A8] mx-2 font-normal">→</span>
            <span className="text-[#2D2A26]">{p.to}</span>
          </span>
        </span>
      </div>

      <p className="text-[15px] font-semibold text-[#2D2A26] pt-6 pb-3">{summary}</p>

      <div className="flex flex-wrap gap-[3px] pb-5" aria-hidden="true">
        {Array.from({ length: TOTAL }, (_, i) => {
          const seen = i <= swept;
          const hit = seen && changed.has(i);
          return (
            <span
              key={i}
              className={`block w-[6px] h-[6px] rounded-[1.5px] transition-colors duration-300 ${
                hit ? 'bg-[#C75450]' : seen ? 'bg-[#DDD6CD]' : 'bg-[#EFEAE3]'
              }`}
            />
          );
        })}
      </div>

      <ul className="space-y-3">
        {p.rows.map((r, i) => {
          const flipped = t >= ROW_AT[i];
          const [c0, c1] = codes[i] ?? ['', ''];
          return (
            <li key={r.who} className="rounded-xl bg-[#FAF8F5] px-4 py-3.5">
              <p className="text-[14px] text-[#2D2A26] leading-snug mb-2">{r.who}</p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-[#D4874D]/10 text-[#B86E35]">{r.from}</span>
                <span className={`transition-opacity duration-500 ${flipped ? 'opacity-100' : 'opacity-0'}`}>
                  <span className="text-[#B8B0A8] mr-2">→</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#C75450]/10 text-[#B0433F]">{r.to}</span>
                </span>
                <span className="basis-full sm:basis-auto sm:ml-auto font-mono text-[11px] font-normal text-[#9C9590] tabular-nums">
                  {c0}
                  <span className={`transition-opacity duration-500 ${flipped ? 'opacity-100' : 'opacity-0'}`}>
                    {' '}→ {c1}
                  </span>
                </span>
              </p>
            </li>
          );
        })}
      </ul>

      <p className={`text-[13px] text-[#9C9590] pt-5 transition-opacity duration-500 ${t >= REST_AT ? 'opacity-100' : 'opacity-0'}`}>
        {p.rest}
      </p>
    </div>
  );
}
