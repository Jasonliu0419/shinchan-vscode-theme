import { expect, it } from 'vitest';
import { buildScene } from '../../src/core/scene';

it('centers the reference house with a red gable roof, balcony, brown door and road', () => {
  const day = buildScene(200,false,42);
  expect(day).toContainEqual({x:98,y:8,w:4,h:1,color:'#D9533F',kind:'roof'});
  expect(day).toContainEqual({x:106,y:37,w:5,h:10,color:'#C2702F',kind:'door'});
  expect(day).toContainEqual({x:0,y:52,w:200,h:12,color:'#B7B2D1',kind:'road'});
  expect(day).toContainEqual({x:2,y:58,w:5,h:1,color:'#D9D5E8',kind:'roadLine'});
  for (const kind of ['cloud','apartment','tree','cypress','house','antenna','houseWindow','balcony','carport','wall','hedge','gate','fence','sidewalk','curb']) {
    expect(day.some(r => r.kind === kind),kind).toBe(true);
  }
  expect(buildScene(201,false,42).find(r => r.kind === 'door')?.x).toBe(106);
  expect(buildScene(240,false,42).find(r => r.kind === 'door')?.x).toBe(126);
});
it('uses deterministic seeded stars, a moon and lit windows at night', () => {
  const day = buildScene(200,false,42), night = buildScene(200,true,42);
  expect(night).toEqual(buildScene(200,true,42)); expect(day).toEqual(buildScene(200,false,42));
  expect(day).not.toEqual(night);
  const stars = night.filter(r => r.kind === 'star');
  expect(stars.length).toBeGreaterThan(0);
  expect(stars).not.toEqual(buildScene(200,true,43).filter(r => r.kind === 'star'));
  expect(night.some(r => r.kind === 'moon')).toBe(true);
  expect(night.some(r => r.kind === 'houseWindow' && r.color === '#F3D46E')).toBe(true);
  expect(day.some(r => r.kind === 'star')).toBe(false);
});
it('clips every rectangle to the scene, including tiny and fractional widths', () => {
  for (const width of [-10,0,1,10,39,40,71,100,200,403.8]) for (const night of [false,true]) {
    const rects = buildScene(width,night,7);
    for (const r of rects) {
      expect(Number.isInteger(r.x) && Number.isInteger(r.y)).toBe(true);
      expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.w).toBeGreaterThan(0); expect(r.h).toBeGreaterThan(0);
      expect(r.x+r.w).toBeLessThanOrEqual(Math.max(0,Math.floor(width)));
      expect(r.y+r.h).toBeLessThanOrEqual(64);
    }
  }
  expect(buildScene(-10,false,0)).toEqual([]);
});
