import { expect, it } from 'vitest';
import { beamExtensions } from '../../src/core/beam';
import { loadSpriteSets, spriteSets } from '../../src/core/sprites';
import { spritePlacement } from '../../src/core/geometry';

it.each([[5,16,49,'#FEFB9F'],[6,14,49.5,'#FFF6C2']] as const)(
  'extends frame %i to either scene edge with the outer cell colors', (frame,count,y,color) => {
    const left = beamExtensions(spriteSets.beam,frame,spritePlacement(spriteSets.beam,{x:100,facing:'left'}),200);
    const right = beamExtensions(spriteSets.beam,frame,spritePlacement(spriteSets.beam,{x:100,facing:'right'}),200);
    expect(left).toHaveLength(count); expect(right).toHaveLength(count);
    expect(left[0]).toEqual({x:0,y,w:68.5,h:0.5,color});
    expect(right[0]).toEqual({x:132,y,w:68,h:0.5,color});
    expect(left.every(r => r.x === 0 && r.w === 68.5)).toBe(true);
    expect(right.every(r => r.x + r.w === 200)).toBe(true);
    expect([...left,...right].every(r => r.h === 0.5 && Number.isInteger(r.y * 2))).toBe(true);
    expect(left.some(r => r.color === '#FFFFFF')).toBe(true);
  },
);
it('does not extend frame zero, transparent cells, or the darkest outline regardless of its character', () => {
  for (const facing of ['left','right'] as const) {
    expect(beamExtensions(spriteSets.beam,0,spritePlacement(spriteSets.beam,{x:100,facing}),200)).toEqual([]);
  }
  const set = loadSpriteSets({ test: { legend:{Z:'#141010',A:'#FFFFFF'},faces:'left',anchor:0,
    frames:[['Z.','A.','..']],durations:[100] } }).test!;
  expect(beamExtensions(set,0,{left:10,top:20,flip:false},100)).toEqual([{x:0,y:20.5,w:10,h:0.5,color:'#FFFFFF'}]);
  expect(beamExtensions(set,0,{left:10,top:20,flip:true},100)).toEqual([{x:11,y:20.5,w:89,h:0.5,color:'#FFFFFF'}]);
  expect(beamExtensions(set,0,{left:10,top:63,flip:false},100)).toEqual([{x:0,y:63.5,w:10,h:0.5,color:'#FFFFFF'}]);
});
it('clips extensions at scene boundaries, including offscreen sprites and empty spans', () => {
  expect(beamExtensions(spriteSets.beam,5,{left:-4,top:31,flip:false},100)).toEqual([]);
  expect(beamExtensions(spriteSets.beam,5,{left:62,top:31,flip:true},100)).toEqual([]);
  expect(beamExtensions(spriteSets.beam,5,{left:300,top:31,flip:false},100)[0]).toMatchObject({x:0,w:100});
  expect(beamExtensions(spriteSets.beam,5,{left:-100,top:31,flip:true},100)[0]).toMatchObject({x:0,w:100});
  expect(beamExtensions(spriteSets.beam,5,{left:37,top:-40,flip:false},100)).toEqual([]);
  expect(beamExtensions(spriteSets.beam,5,{left:37,top:64,flip:false},100)).toEqual([]);
  expect(beamExtensions(spriteSets.beam,5,{left:37,top:31,flip:false},0)).toEqual([]);
});
