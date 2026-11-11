import { randomInt } from './rng';
export function pickLine(pool: readonly string[], previous: number, seed: number): Readonly<{ line: string; index: number; seed: number }> {
  if (pool.length === 0) throw new Error('Cannot pick from an empty line pool');
  const skip = pool.length > 1 && previous >= 0 && previous < pool.length;
  const pick = randomInt(seed, 0, pool.length - (skip ? 2 : 1));
  const index = skip && pick.value >= previous ? pick.value + 1 : pick.value;
  return { line: pool[index]!, index, seed: pick.seed };
}
