import { expect, it } from 'vitest';
import { loadSpriteSets, spriteSets } from '../../src/core/sprites';

const sample = () => ({ pose: {
  legend: { A: '#141010', B: '#FFcc00' }, faces: 'left',
  frames: [['A.', '.B'], ['.B', 'A.']], durations: [100, 200], anchor: 0.5,
} });

it('loads independent legends, variable dimensions and immutable copies of all reference art', () => {
  const input = sample(), sets = loadSpriteSets(input);
  expect(sets.pose).toMatchObject({ width: 2, height: 2, anchor: 0.5, faces: 'left' });
  input.pose.frames[0]![0] = 'BB';
  expect(sets.pose!.frames[0]).toEqual(['A.', '.B']);
  expect(Object.isFrozen(sets.pose!.frames[0])).toBe(true);
  expect(Object.isFrozen(sets.pose!.legend)).toBe(true);
  expect(Object.isFrozen(sets.pose!.durations)).toBe(true);
  expect(Object.isFrozen(sets.pose)).toBe(true);
  expect(Object.isFrozen(sets)).toBe(true);
  expect(Object.keys(spriteSets)).toEqual(['side', 'front34', 'wave', 'front', 'butt', 'back', 'greet', 'beam', 'sleep', 'walk']);
  expect(spriteSets.side).toMatchObject({ width: 22, height: 30, faces: 'left' });
  expect(spriteSets.beam.width).toBe(76);
  expect(spriteSets.greet.frames).toHaveLength(9);
  expect(spriteSets.sleep.frames).toHaveLength(9);
});

it('validates eight walk frames with the same dimensions, anchor, legend and facing as side', () => {
  const { walk, side } = spriteSets;
  expect(walk.frames).toHaveLength(8);
  expect(walk.durations).toEqual([100, 100, 100, 100, 100, 100, 100, 100]);
  expect(walk).toMatchObject({
    width: side.width, height: side.height, anchor: side.anchor,
    legend: side.legend, faces: side.faces,
  });
});

it('rejects malformed records, metadata, palettes, rows, frame sizes and timings', () => {
  for (const bad of [null, [], {}, { pose: null }]) expect(() => loadSpriteSets(bad)).toThrow();
  const invalid = [
    { legend: null }, { legend: [] }, { legend: {} },
    { legend: { AB: '#141010' } }, { legend: { A: 'red' } }, { legend: { A: 123 } },
    { faces: 'up' }, { anchor: NaN }, { anchor: -1 }, { anchor: 2 },
    { frames: null }, { frames: [] }, { frames: [[]] }, { frames: [['']] },
    { frames: [['A.', 'A']] }, { frames: [['A.', 'X.']] }, { frames: [[12]] },
    { frames: [['A.', '.B'], ['AA']] }, { frames: [['A.', '.B'], ['AAA', 'BBB']] },
    { durations: null }, { durations: [100] }, { durations: [0, 100] },
    { durations: [-1, 100] }, { durations: [Infinity, 100] }, { durations: ['100', 100] },
  ];
  for (const patch of invalid) expect(() => loadSpriteSets({ pose: { ...sample().pose, ...patch } }), JSON.stringify(patch)).toThrow();
});
