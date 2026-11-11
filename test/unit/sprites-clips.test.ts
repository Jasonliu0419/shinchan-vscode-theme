import { expect, it } from 'vitest';
import { spriteSets } from '../../src/core/sprites';
import { clips, frameAt, clipDuration, actionClip, type Clip } from '../../src/core/clips';

it('references valid frames with exact approved timing, offsets and looping', () => {
  for (const clip of Object.values(clips)) for (const f of clip.frames) {
    expect(spriteSets[f.set].frames[f.frame]).toBeDefined();
    expect(f.ms).toBeGreaterThan(0);
  }
  expect(Object.fromEntries(Object.entries(clips).map(([name, clip]) => [name, clipDuration(clip)]))).toEqual({
    idle: 1400, walk: 800, greet: 3060, beam: 1890, wiggle: 2400, sleep: 1764, jump: 480, waking: 900,
  });
  expect(clips.greet.frames.map(f => f.frame)).toEqual([0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8]);
  expect(clips.beam.frames.map(f => f.ms)).toEqual(Array(9).fill(210));
  expect(clips.sleep.frames.map(f => f.ms)).toEqual(Array(9).fill(196));
  expect(clips.wiggle.frames.map(f => f.dx)).toEqual([-1,1,-1,1,-1,1,-1,1,-1,1,-1,1]);
  expect(clips.jump.frames.map(f => f.dy)).toEqual([-2,-4,-2,0]);
  expect(clips.idle.loop && clips.walk.loop && clips.sleep.loop).toBe(true);
  for (const name of ['greet','beam','wiggle','waking','jump'] as const) expect(clips[name].loop).toBe(false);
  for (const action of ['greet','beam','wiggle','sleep'] as const) expect(actionClip(action)).toBe(clips[action]);
});

it('loops eight walk frames with arm swing at their own durations, lifting only passing frames 0 and 4', () => {
  expect(clips.walk.loop).toBe(true);
  expect(clips.walk.frames).toEqual([
    { set: 'walk', frame: 0, ms: 100, dy: -1 },
    { set: 'walk', frame: 1, ms: 100 },
    { set: 'walk', frame: 2, ms: 100 },
    { set: 'walk', frame: 3, ms: 100 },
    { set: 'walk', frame: 4, ms: 100, dy: -1 },
    { set: 'walk', frame: 5, ms: 100 },
    { set: 'walk', frame: 6, ms: 100 },
    { set: 'walk', frame: 7, ms: 100 },
  ]);
  expect(clips.walk.frames.map(f => f.ms)).toEqual(spriteSets.walk.durations);
  expect(clipDuration(clips.walk)).toBe(800);
});

it('selects whole frames, loops or clamps at exact boundaries and rejects empty clips', () => {
  const clip: Clip = { frames: [{set:'front',frame:0,ms:100},{set:'side',frame:0,ms:200,dy:-1}],loop:true };
  expect(frameAt(clip,-1)).toEqual(clip.frames[0]);
  expect(frameAt(clip,0)).toEqual(clip.frames[0]);
  expect(frameAt(clip,100)).toEqual(clip.frames[1]);
  expect(frameAt(clip,300)).toEqual(clip.frames[0]);
  expect(frameAt({...clip,loop:false},300)).toEqual(clip.frames[1]);
  expect(frameAt({...clip,loop:false},999)).toEqual(clip.frames[1]);
  expect(() => frameAt({frames:[],loop:false},0)).toThrow();
});
