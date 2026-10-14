import { useLoopClock } from '../demo/useLoopClock';

interface Stage {
  name: string;
  desc: string;
}

interface Props {
  stages: Stage[];
  exprLabel: string;
  optNote: string;
  jitNote: string;
}

const EXPR = 'jev.intent.choice != "refund" && jev.intent.confidence >= 0.6';

// Printed by ordo-core's ExprParser / ExprOptimizer / ExprCompiler for EXPR (main, 2026-10-14).
const TREE = `And
├ Ne
│ ├ jev.intent.choice
│ └ "refund"
└ Ge
  ├ jev.intent.confidence
  └ 0.6`;

const BYTECODE = `FieldNeConst  r0  f0  c0
Move          r1  r0
JumpIfFalse   r1  +3
FieldGeConst  r2  f1  c1
Move          r1  r2
Return        r1

c0 = "refund"   c1 = 0.6
f0 = jev.intent.choice
f1 = jev.intent.confidence`;

const STEP_MS = 2600;

export default function Pipeline({ stages, exprLabel, optNote, jitNote }: Props) {
  const total = STEP_MS * stages.length;
  const { t, setT, ref, reduced } = useLoopClock(total, { startT: 0, restartOnView: true });
  const active = reduced ? -1 : Math.floor(t / STEP_MS) % stages.length;

  const panes = [
    <pre key="tree">{TREE}</pre>,
    <p key="opt" className="epipe-note">{optNote}</p>,
    <pre key="bc">{BYTECODE}</pre>,
    <p key="jit" className="epipe-note">{jitNote}</p>,
  ];

  return (
    <div ref={ref} className="epipe">
      <div className="epipe-expr">
        <span className="epipe-expr-label">{exprLabel}</span>
        <code>{EXPR}</code>
      </div>
      <ol className="epipe-stages">
        {stages.map((s, i) => (
          <li
            key={s.name}
            className={`epipe-stage${active === i ? ' is-on' : ''}${reduced ? ' is-static' : ''}`}
            onMouseEnter={() => setT(i * STEP_MS)}
          >
            <div className="epipe-num">{i + 1}</div>
            <h3 className="epipe-name">{s.name}</h3>
            <p className="epipe-desc">{s.desc}</p>
            <div className="epipe-pane">{panes[i]}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
