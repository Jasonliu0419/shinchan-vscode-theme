export type RandomResult = Readonly<{ seed: number; value: number }>;
/** A pure mulberry32 step: persist the returned seed with the model. */
export function nextRandom(seed: number): RandomResult {
  const nextSeed = (seed + 0x6D2B79F5) >>> 0;
  let bits = Math.imul(nextSeed ^ (nextSeed >>> 15), nextSeed | 1);
  bits ^= bits + Math.imul(bits ^ (bits >>> 7), bits | 61);
  return { seed: nextSeed, value: ((bits ^ (bits >>> 14)) >>> 0) / 4294967296 };
}
export function randomInt(seed: number, min: number, max: number): RandomResult {
  const next = nextRandom(seed);
  return { seed: next.seed, value: min + Math.floor(next.value * (max - min + 1)) };
}
