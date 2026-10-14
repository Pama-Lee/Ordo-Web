import { useEffect, useRef, useState } from 'react';

/**
 * A looping clock for the homepage demos.
 *
 * - Starts at `startT`, which is also what the server renders, so hydration
 *   does not change what is on screen.
 * - Runs only while the element is on screen and the tab is visible.
 * - With prefers-reduced-motion it never runs: the static `startT` frame stays.
 * - `restartOnView`: jump to 0 the first time the element scrolls into view,
 *   so the animation starts where the reader is looking.
 */
export function useLoopClock(
  totalMs: number,
  { startT = 0, restartOnView = false, tickMs = 100 }: { startT?: number; restartOnView?: boolean; tickMs?: number } = {},
) {
  const [t, setT] = useState(startT);
  const ref = useRef<HTMLDivElement | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mq?.matches) {
      setReduced(true);
      return;
    }

    let visible = false;
    let seen = false;
    let last = performance.now();
    let timer: number | undefined;

    const tick = () => {
      const now = performance.now();
      const dt = Math.min(now - last, tickMs * 2);
      last = now;
      setT((prev) => (prev + dt) % totalMs);
    };
    const update = () => {
      const run = visible && document.visibilityState === 'visible';
      if (run && timer === undefined) {
        last = performance.now();
        timer = window.setInterval(tick, tickMs);
      } else if (!run && timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !seen) {
          seen = true;
          if (restartOnView) setT(0);
        }
        update();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', update);
    const onMotion = () => {
      if (mq?.matches) {
        visible = false;
        update();
        setReduced(true);
        setT(startT);
      }
    };
    mq?.addEventListener?.('change', onMotion);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
      mq?.removeEventListener?.('change', onMotion);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [totalMs, startT, restartOnView, tickMs]);

  return { t, setT, ref, reduced };
}
