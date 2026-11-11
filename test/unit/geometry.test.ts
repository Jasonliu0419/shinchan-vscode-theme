import { expect, it } from 'vitest';
import { loadSpriteSets, spriteSets } from '../../src/core/sprites';
import { spritePlacement } from '../../src/core/geometry';
import { hitTest } from '../../src/core/hitTest';
import { FEET_Y, PIXEL_SCALE, SCENE_HEIGHT, ROAD_TOP, SPRITE_SCALE } from '../../src/core/types';

it('halves sprites while keeping 3× scene pixels, a 64px scene and feet at logical y60', () => {
  expect([PIXEL_SCALE,SCENE_HEIGHT,ROAD_TOP,FEET_Y]).toEqual([3,64,49,60]);
  expect(SPRITE_SCALE).toBe(0.5);
  expect(spritePlacement(spriteSets.side,{x:50,facing:'left'})).toEqual({left:45,top:46,flip:false,scale:0.5,width:11,height:15});
  expect(spritePlacement(spriteSets.greet,{x:50,facing:'right'})).toEqual({left:45,top:46,flip:false,scale:0.5,width:14,height:15});
  expect(spritePlacement(spriteSets.greet,{x:50,facing:'left'})).toEqual({left:42,top:46,flip:true,scale:0.5,width:14,height:15});
  expect(spritePlacement(spriteSets.front,{x:50,facing:'left'})).toEqual({left:44.5,top:46,flip:false,scale:0.5,width:11.5,height:15});
  expect(spritePlacement(spriteSets.front,{x:50,facing:'right'})).toEqual({left:44.5,top:46,flip:false,scale:0.5,width:11.5,height:15});
  expect(spritePlacement(spriteSets.butt,{x:50,facing:'right',dx:-1,dy:1})).toEqual({left:42.5,top:51,flip:false,scale:0.5,width:15,height:10.5});
});
it('places every sprite on the half-pixel grid with its unshifted bottom at FEET_Y + 1', () => {
  for (const set of Object.values(spriteSets)) for (const facing of ['left','right'] as const) {
    const placement = spritePlacement(set,{x:50.3,facing});
    expect(placement.width).toBe(set.width / 2);
    expect(placement.height).toBe(set.height / 2);
    expect(Number.isInteger(placement.left * 2)).toBe(true);
    expect(Number.isInteger(placement.top * 2)).toBe(true);
    expect(placement.top + placement.height).toBe(61);
  }
});
it('snaps odd anchors and fractional positions after applying offsets in sprite pixels', () => {
  const set = loadSpriteSets({test:{legend:{A:'#141010'},faces:'left',anchor:1,
    frames:[['AAAAA','AAAAA','AAAAA']],durations:[100]}}).test!;
  expect(spritePlacement(set,{x:10.3,facing:'left'})).toEqual({left:10,top:59.5,flip:false,scale:0.5,width:2.5,height:1.5});
  expect(spritePlacement(set,{x:10.3,facing:'right'})).toEqual({left:9,top:59.5,flip:true,scale:0.5,width:2.5,height:1.5});
  expect(spritePlacement(set,{x:10.3,facing:'right',dx:1,dy:-1})).toEqual({left:9.5,top:59,flip:true,scale:0.5,width:2.5,height:1.5});
});
it.each(['left','right','front'] as const)('hits half-sized opaque pixels using %s art, fractional anchors, flip and offsets', faces => {
  const set = loadSpriteSets({test:{legend:{A:'#141010',B:'#FFFFFF'},faces,anchor:0.5,
    frames:[['A..','.BA'],['..A','B..']],durations:[100,100]}}).test!;
  for (const facing of ['left','right'] as const) {
    const pose = {x:10.4,facing,dx:1,dy:-4};
    const flipped = faces !== 'front' && faces !== facing;
    expect(spritePlacement(set,pose)).toEqual({left:flipped?10:10.5,top:58,flip:flipped,scale:0.5,width:1.5,height:1});
    const opaqueX = flipped?11:10.5;
    expect(hitTest(set,0,pose,opaqueX+0.1,58.4)).toBe(true);
    expect(hitTest(set,1,pose,opaqueX+0.1,58.4)).toBe(false);
    expect(hitTest(set,0,pose,flipped?10:11.5,58)).toBe(false);
    // Adjacent scene half-pixels map to distinct sprite pixels.
    expect(hitTest(set,0,pose,flipped?10.999:11,58)).toBe(false);
    const left = flipped?10:10.5;
    for (const [x,y] of [[left-0.001,58],[left,57.999],[left+1.5,58],[left,59]]) expect(hitTest(set,0,pose,x!,y!)).toBe(false);
  }
});
it('uses actual animation masks as they change and never mirrors front art', () => {
  for (const name of ['side','greet','front','sleep'] as const) {
    const set = spriteSets[name];
    for (const facing of ['left','right'] as const) {
      const pose = {x:100,facing,dx:-1,dy:-2}, placement = spritePlacement(set,pose);
      for (const frame of [0,set.frames.length-1]) {
        set.frames[frame]!.forEach((row,y) => [...row].forEach((char,x) => {
          const screenX = placement.left + (placement.flip?set.width-1-x:x) * 0.5;
          expect(hitTest(set,frame,pose,screenX+0.25,placement.top+y*0.5+0.25)).toBe(char!=='.');
        }));
      }
    }
  }
});
