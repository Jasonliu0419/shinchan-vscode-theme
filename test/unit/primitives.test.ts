import { describe, expect, it } from 'vitest';
import { nextRandom, randomInt } from '../../src/core/rng';
import { contrastRatio } from '../../src/core/contrast';
describe('seeded random source', () => {
  it('matches mulberry32 reference and advances without mutation', () => {
    const a = nextRandom(1);
    expect(a.value).toBeCloseTo(0.6270739405881613, 12);
    expect(a).toEqual(nextRandom(1));
    expect(nextRandom(a.seed).value).not.toBe(a.value);
  });
  it('samples inclusive integer ranges', () => {
    for (let seed=0;seed<100;seed++) {
      const r = randomInt(seed, 6, 20);
      expect(r.value).toBeGreaterThanOrEqual(6); expect(r.value).toBeLessThanOrEqual(20);
    }
    expect(randomInt(1, 4, 4).value).toBe(4);
  });
});
it('computes WCAG luminance contrast', () => {
  expect(contrastRatio('#000000','#FFFFFF')).toBe(21);
  expect(contrastRatio('#FFFCF4','#FFFCF4')).toBe(1);
  expect(contrastRatio('#FFFFFF','#D7332F')).toBeGreaterThanOrEqual(4.5);
  expect(() => contrastRatio('red','#FFFFFF')).toThrow();
});
