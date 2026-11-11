export const DIAGNOSTICS_STARTUP_GRACE_MS = 5000;
export type ErrorTracker = Readonly<{ count: number; graceUntil: number }>;
export function createErrorTracker(baseline: number, startedAt: number): ErrorTracker {
  return { count: baseline, graceUntil: startedAt + DIAGNOSTICS_STARTUP_GRACE_MS };
}
export function trackErrors(tracker: ErrorTracker, count: number, now: number): Readonly<{ tracker: ErrorTracker; increased: boolean }> {
  return { tracker: { ...tracker, count }, increased: now >= tracker.graceUntil && count > tracker.count };
}
