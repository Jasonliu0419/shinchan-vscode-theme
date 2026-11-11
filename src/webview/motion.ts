import type { ReduceMotion } from '../core/protocol';
export function isReduced(host: ReduceMotion, system: boolean): boolean {
  return host === 'on' || (host === 'auto' && system);
}
export function watchMotion(changed: (reduced: boolean) => void): Readonly<{
  initial: boolean; setHost(value: ReduceMotion): void; dispose(): void;
}> {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let host: ReduceMotion = 'auto';
  const update = () => changed(isReduced(host, media.matches));
  media.addEventListener('change', update);
  return {
    initial: isReduced(host, media.matches),
    setHost(value) { host = value; update(); },
    dispose() { media.removeEventListener('change', update); },
  };
}
