const TICK_INTERVAL_MS = 50;
/** Rendering stays fluid; pure simulation receives at most 20 ticks per second. */
export function startLoop(tick: (now: number) => void, draw: (now: number) => void): () => void {
  let handle: number | undefined, lastTick = -Infinity, stopped = false;
  const schedule = () => { if (!stopped && !document.hidden && handle === undefined) handle = requestAnimationFrame(frame); };
  const frame = (now: number) => {
    handle = undefined;
    if (stopped || document.hidden) return;
    if (now - lastTick >= TICK_INTERVAL_MS) { tick(now); lastTick = now; }
    draw(now); schedule();
  };
  const visibility = () => {
    if (document.hidden && handle !== undefined) { cancelAnimationFrame(handle); handle = undefined; }
    schedule();
  };
  document.addEventListener('visibilitychange', visibility);
  schedule();
  return () => {
    stopped = true;
    if (handle !== undefined) cancelAnimationFrame(handle);
    document.removeEventListener('visibilitychange', visibility);
  };
}
