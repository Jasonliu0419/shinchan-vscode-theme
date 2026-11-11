import { describe, expect, it } from 'vitest';
import { createModel } from '../../src/core/machine/model';
import { step } from '../../src/core/machine/step';
import { renderSpec } from '../../src/core/machine/renderSpec';
import { positionAt, clampX, WALK_MIN_X, WALK_MAX_MARGIN } from '../../src/core/machine/idle';
import { actions, pools } from '../../src/core/lines';
import { beamExtensions } from '../../src/core/beam';
import { spriteSets } from '../../src/core/sprites';
import { spritePlacement } from '../../src/core/geometry';
const initial=(options={})=>createModel({now:0,seed:42,width:100,...options});
const tick=(m:ReturnType<typeof initial>,now:number)=>step(m,{type:'tick',now});
function freeze<T>(value:T):T {if(value && typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
describe('three-second continuous idle patrol',()=>{
 it('starts exactly three seconds after creation, including a nonzero creation time',()=>{
  for(const now of [0,12345]) {
   let m=initial({now});
   m=tick(m,now+2999);expect(m.walk).toBe(null);
   m=tick(m,now+3000);expect(m.walk).not.toBe(null);
   expect(m.walk!.startedAt).toBe(now+3000);
  }
 });
 it('chooses the farther margin regardless of seed or facing, with ties going right',()=>{
  for(const seed of [1,42,12345]) for(const [x,facing,to] of [[20,'right',89.75],[80,'left',10.25],[50,'right',89.75]] as const) {
   const m=tick({...initial({seed}),x,facing:facing==='right'?'left':'right'},3000);
   expect(m.walk).not.toBe(null);expect(m.walk!.to).toBe(to);expect(m.facing).toBe(facing);
  }
 });
 it('moves four scene pixels during one second of walking',()=>{
  const m=tick(initial(),3000);
  expect(m.x).toBe(50);
  expect(positionAt(m,4000)-m.x).toBe(4);
  expect(tick(m,4000).x).toBe(54);
 });
 it('reaches each margin at 4px/s and turns on the same tick without pausing',()=>{
  let m=tick(initial(),3000);
  expect(m.walk).not.toBe(null);
  expect(m.walk).toMatchObject({from:50,to:89.75,startedAt:3000,duration:9937.5});
  m=tick(m,12937.5);
  expect(m.x).toBe(89.75);expect(m.facing).toBe('left');
  expect(m.walk).toMatchObject({from:89.75,to:10.25,startedAt:12937.5,duration:19875});
  m=tick(m,32812.5);
  expect(m.x).toBe(10.25);expect(m.facing).toBe('right');
  expect(m.walk).toMatchObject({from:10.25,to:89.75,startedAt:32812.5});
 });
 it('patrols more than 80% of an undisturbed minute with every sampled x inside the margins',()=>{
  let m=initial({width:90,seed:12345}),walking=0;
  const directions=new Set<string>();
  for(let now=50;now<=60000;now+=50) {
   m=tick(m,now);
   expect(m.x).toBeGreaterThanOrEqual(WALK_MIN_X);expect(m.x).toBeLessThanOrEqual(90-WALK_MAX_MARGIN);
   if(m.walk){walking++;directions.add(m.facing);}
  }
  expect(walking/1200).toBeGreaterThan(0.8);expect([...directions].sort()).toEqual(['left','right']);
 });
 it.each([['greet',3060],['beam',1890],['wiggle',2400]] as const)('resumes exactly three seconds after %s ends, even if the end tick is late',(action,duration)=>{
  const walking=tick(initial(),3000);
  const active=step(walking,{type:'action',action,now:3200});
  expect(active.walk).toBe(null);expect(active.x).toBeCloseTo(50.8);
  const end=3200+duration;
  for(const firstTick of [end,end+250]) {
   let m=tick(active,firstTick);expect(m.mode).toBe('idle');
   m=tick(m,end+2999);expect(m.walk).toBe(null);
   m=tick(m,end+3000);expect(m.walk).not.toBe(null);expect(m.walk!.startedAt).toBe(end+3000);
  }
 });
 it('does not walk asleep or waking and starts three seconds after waking ends',()=>{
  const sleeping=tick(initial({sleeping:true}),60000);expect(sleeping.walk).toBe(null);
  const waking=step(sleeping,{type:'click',now:60100});expect(tick(waking,60999).walk).toBe(null);
  let m=tick(waking,61100);expect(m.mode).toBe('idle');
  m=tick(m,63999);expect(m.walk).toBe(null);
  m=tick(m,64000);expect(m.walk).not.toBe(null);
 });
 it.each([false,true])('resets the idle timer on every click-jump (already walking: %s)',walking=>{
  let m=walking?tick(initial(),3000):initial();
  const clickAt=walking?3200:2000;
  const x=positionAt(m,clickAt);
  m=step(m,{type:'click',now:clickAt});expect(m.walk).toBe(null);expect(m.x).toBeCloseTo(x);
  m=tick(m,clickAt+480);expect(m.jumpStartedAt).toBe(null);expect(m.walk).toBe(null);
  m=step(m,{type:'click',now:clickAt+1000});
  m=tick(m,clickAt+3999);expect(m.walk).toBe(null);
  m=tick(m,clickAt+4000);expect(m.walk).not.toBe(null);
 });
 it('editor speech and idle chatter neither delay the start nor interrupt the patrol',()=>{
  let m=step(initial(),{type:'editorEvent',kind:'save',now:2999});
  m=tick(m,3000);expect(m.walk).not.toBe(null);
  const walk=m.walk;
  m=step(m,{type:'editorEvent',kind:'errorsIncreased',now:3200});
  expect(m.walk).toEqual(walk);expect(m.x).toBeCloseTo(50.8);
  const deadline=m.nextIdleLineAt;
  for(let now=3250;now<deadline;now+=50)m=tick(m,now);
  m=tick(m,deadline);expect(pools.idle).toContain(m.speech?.text);expect(m.walk).not.toBe(null);
  const afterChatter=m.walk;
  m=tick(m,deadline+50);expect(m.walk).toEqual(afterChatter);
 });
 it('never walks under reduced motion and restarts exactly three seconds after re-enabling motion',()=>{
  let m=initial({reduced:true});
  for(const now of [3000,60000]){m=tick(m,now);expect(m.walk).toBe(null);}
  m=step(m,{type:'motion',reduced:false,now:60100});
  m=tick(m,63099);expect(m.walk).toBe(null);
  m=tick(m,63100);expect(m.walk).not.toBe(null);
  m=step(m,{type:'motion',reduced:true,now:63300});
  expect(m.walk).toBe(null);expect(m.x).toBeCloseTo(50.8);
  expect(tick(m,100000).walk).toBe(null);
 });
 it.each([0,10,20,21,26])('never walks when a %spx scene has less than 6px between margins',width=>{
  let m=initial({width});
  for(let now=0;now<=60000;now+=50){m=tick(m,now);expect(m.walk).toBe(null);expect(Number.isFinite(m.x)).toBe(true);}
 });
 it('patrols in the first integer-width scene with at least 6px between margins',()=>{
  let m=tick(initial({width:27}),3000);
  expect(m.walk).not.toBe(null);expect(m.walk!.to).toBe(16.75);
  m=tick(m,3937.5);expect(m.x).toBe(16.75);expect(m.facing).toBe('left');expect(m.walk).not.toBe(null);
 });
 it('clamps a resized active patrol and waits exactly three seconds before resuming',()=>{
  let m=tick(initial(),3000);
  m=step(m,{type:'resize',width:45,now:4000});
  expect(m.walk).toBe(null);expect(m.x).toBe(34.75);
  m=tick(m,6999);expect(m.walk).toBe(null);
  m=tick(m,7000);expect(m.walk).not.toBe(null);expect(m.facing).toBe('left');expect(m.walk!.to).toBe(10.25);
 });
 it('uses the latest interruption when resize or motion changes overlap an action',()=>{
  for(const event of [{type:'resize',width:90},{type:'motion',reduced:false}] as const) {
   let m=step(initial({reduced:event.type==='motion'}),{type:'action',action:'greet',now:100});
   m=step(m,{...event,now:3000});m=tick(m,3159);expect(m.mode).toBe('greet');
   m=tick(m,6159);expect(m.walk).toBe(null);
   m=tick(m,6160);expect(m.walk).not.toBe(null);
  }
 });
 it('preserves speed through late ticks spanning the start and multiple turns',()=>{
  let m=tick(initial(),4000);expect(m.walk).not.toBe(null);
  expect(m.walk!.startedAt).toBe(3000);expect(m.x).toBeCloseTo(54);
  m=tick(m,10000);expect(m.x).toBeCloseTo(78);expect(m.facing).toBe('right');
  m=tick(m,70000);expect(m.x).toBeCloseTo(20.5);expect(m.facing).toBe('left');expect(m.walk).not.toBe(null);
 });
 it('projects the returning patrol consistently before the next tick or click',()=>{
  const m=freeze(tick(initial(),3000));
  expect(m.walk).not.toBe(null);
  const projected=renderSpec(m,17000);
  expect(projected).toMatchObject({x:73.5,facing:'left',set:'walk'});
  expect(renderSpec(tick(m,17000),17000)).toEqual(projected);
  const clicked=step(m,{type:'click',now:17000});
  expect(clicked.walk).toBe(null);expect(clicked.x).toBeCloseTo(73.5);expect(clicked.facing).toBe('left');
 });
});
describe('action and sleep lifecycle',()=>{
 it.each([['greet',3060],['beam',1890],['wiggle',2400]] as const)('%s returns to idle exactly at clip end', (action,end)=>{
  let m=step(initial(),{type:'action',action,now:100});
  expect(m.mode).toBe(action);expect(m.speech?.text).toBe(actions[action]);
  expect(tick(m,100+end-1).mode).toBe(action);expect(tick(m,100+end).mode).toBe('idle');
 });
 it('restarts and interrupts a clip, including sleep waking immediately',()=>{
  let m=step(initial(),{type:'action',action:'greet',now:0});
  m=step(m,{type:'action',action:'greet',now:1500});expect(m.modeStartedAt).toBe(1500);expect(tick(m,2400).mode).toBe('greet');
  m=step(m,{type:'action',action:'beam',now:1600});expect(m.mode).toBe('beam');
  m=step(m,{type:'action',action:'sleep',now:1700});expect(m.mode).toBe('sleep');expect(renderSpec(m,1700).night).toBe(true);
  m=step(m,{type:'action',action:'wiggle',now:1800});expect(m.mode).toBe('wiggle');expect(renderSpec(m,1800).night).toBe(false);
 });
 it('restores persistent sleep indefinitely, click wakes, waking clicks ignored',()=>{
  let m=initial({sleeping:true});expect(m.mode).toBe('sleep');
  m=tick(m,1e7);expect(m.mode).toBe('sleep');expect(renderSpec(m,1e7).set).toBe('sleep');
  m=step(m,{type:'click',now:1e7});expect(m.mode).toBe('waking');expect(renderSpec(m,1e7).night).toBe(false);
  expect(m.speech?.text).toBe('嗯…再睡五分鐘啦…');
  const ignored=step(m,{type:'click',now:1e7+200});expect(ignored.modeStartedAt).toBe(1e7);expect(ignored.speech).toEqual(m.speech);
  expect(tick(m,1e7+899).mode).toBe('waking');expect(tick(m,1e7+900).mode).toBe('idle');
  expect(renderSpec(m,1e7).set).toBe('front');
 });
 it('idle click jumps 480ms and chooses a greeting',()=>{
  let m=step(initial(),{type:'click',now:100});
  expect(m.mode).toBe('idle');expect(m.jumpStartedAt).toBe(100);
  expect([100,220,340,460].map(now=>renderSpec(m,now).dy)).toEqual([-2,-4,-2,0]);
  expect(tick(m,580).jumpStartedAt).toBe(null);
  const old=m.speech?.text;m=step(m,{type:'click',now:200});expect(m.speech?.text).not.toBe(old);
 });
});
describe('idle scheduling and walk interruption',()=>{
 it('schedules walks and chatter and breathes by swapping frame offsets',()=>{
  const m=initial();
  expect(m.x).toBe(50);
  expect(m.nextWalkAt).toBe(3000);
  expect(m.nextIdleLineAt).toBeGreaterThanOrEqual(60000);expect(m.nextIdleLineAt).toBeLessThanOrEqual(120000);
  expect(renderSpec(m,0)).toMatchObject({set:'front34',frame:0,dy:0});
  expect(renderSpec(m,700)).toMatchObject({set:'front34',frame:0,dy:1});
  expect(renderSpec(m,1400).dy).toBe(0);
  const line=tick({...m,nextWalkAt:Infinity},m.nextIdleLineAt);expect(line.speech).not.toBe(null);
 });
 it('walks to the far margin at 4px/s and action freezes interpolated x',()=>{
  let m=initial();m=tick(m,m.nextWalkAt);expect(m.walk).not.toBe(null);
  const walk=m.walk!;const distance=Math.abs(walk.to-walk.from);
  expect(distance).toBe(39.75);expect(walk.duration).toBe(9937.5);
  expect(walk.to).toBeGreaterThanOrEqual(WALK_MIN_X);expect(walk.to).toBeLessThanOrEqual(100-WALK_MAX_MARGIN);
  expect(m.facing).toBe(walk.to>walk.from?'right':'left');
  const half=walk.startedAt+walk.duration/2;
  expect(positionAt(m,half)).toBeCloseTo((walk.from+walk.to)/2);
  const interrupted=step(m,{type:'action',action:'greet',now:half});expect(interrupted.walk).toBe(null);expect(interrupted.x).toBeCloseTo((walk.from+walk.to)/2);
  const turned=tick(m,walk.startedAt+walk.duration);expect(turned.walk).not.toBe(null);expect(turned.facing).toBe('left');
 });
 it('never schedules reduced motion walks, cancels active walking, supports off again',()=>{
  let m=initial({reduced:true});expect(m.nextWalkAt).toBe(Infinity);expect(tick(m,1e6).walk).toBe(null);
  m=initial();m=tick(m,m.nextWalkAt);const walk=m.walk!;
  m=step(m,{type:'motion',reduced:true,now:walk.startedAt+100});expect(m.walk).toBe(null);expect(m.nextWalkAt).toBe(Infinity);
  m=step(m,{type:'motion',reduced:false,now:m.now+1});expect(m.nextWalkAt-m.now).toBe(3000);
 });
 it('clamps position on resize, cancels stale walk, handles tiny widths',()=>{
  let m={...initial(),x:70};m=step(m,{type:'resize',width:45,now:1});expect(m.x).toBe(34.75);
  m=step(m,{type:'resize',width:10,now:2});expect(m.x).toBe(5);expect(m.walk).toBe(null);
  expect(tick({...m,nextWalkAt:3},3).walk).toBe(null);
 });
});
describe('speech, reactions and deterministic immutability',()=>{
 it('expires speech at 2500 + 120 times unicode character count',()=>{
  const m=step(initial(),{type:'action',action:'greet',now:100});const end=100+2500+120*[...actions.greet].length;
  expect(m.speech?.expiresAt).toBe(end);expect(tick(m,end-1).speech).not.toBe(null);expect(tick(m,end).speech).toBe(null);
 });
 it('consumes only shown cooldowns and tracks event kinds independently',()=>{
  let m=initial();m=step(m,{type:'editorEvent',kind:'save',now:0});expect(m.lastReactionAt.save).toBe(0);expect(m.lastReactionAt.errorsIncreased).toBe(-Infinity);
  const line=m.speech;m=step(m,{type:'editorEvent',kind:'save',now:19999});expect(m.speech).toEqual(null);expect(m.lastReactionAt.save).toBe(0);
  m=step(m,{type:'editorEvent',kind:'save',now:20000});expect(m.lastReactionAt.save).toBe(20000);
  m=step(m,{type:'editorEvent',kind:'errorsIncreased',now:20001});expect(m.lastReactionAt.errorsIncreased).toBe(20001);expect(line).not.toBe(null);
  m=step(m,{type:'action',action:'sleep',now:20002});const sleeping=m;
  m=step(m,{type:'editorEvent',kind:'save',now:40000});expect(m.lastReactionAt).toEqual(sleeping.lastReactionAt);
  m=step(m,{type:'click',now:40001});m=step(m,{type:'editorEvent',kind:'errorsIncreased',now:60001});expect(m.lastReactionAt.errorsIncreased).toBe(60001);
  expect(m.mode).toBe('idle'); // waking finishes before the late event, so it can react
 });
 it('does not consume cooldown during waking and preserves action mode for editor events',()=>{
  let m=step(initial({sleeping:true}),{type:'click',now:0});
  m=step(m,{type:'editorEvent',kind:'save',now:100});expect(m.lastReactionAt.save).toBe(-Infinity);
  m=step(m,{type:'action',action:'greet',now:200});m=step(m,{type:'editorEvent',kind:'save',now:201});expect(m.mode).toBe('greet');expect(m.lastReactionAt.save).toBe(201);
 });
 it('is deterministic with deeply frozen inputs over all event variants',()=>{
  const events=[{type:'tick',now:10000},{type:'action',action:'beam',now:10001},{type:'click',now:10002},{type:'editorEvent',kind:'save',now:10003},{type:'resize',width:40,now:10004},{type:'motion',reduced:true,now:10005}] as const;
  let m=initial();for(const event of events){freeze(m);const before=JSON.stringify(m);expect(step(m,event)).toEqual(step(m,event));expect(JSON.stringify(m)).toBe(before);m=step(m,event);}
 });
});
describe('render projection',()=>{
 it('projects timed reference frames, facing and offsets even with reduced motion',()=>{
  const beam=step(initial({width:200}),{type:'action',action:'beam',now:0});
  expect(renderSpec(beam,0)).toMatchObject({set:'beam',frame:0,flip:true});
  expect(renderSpec(beam,1049).frame).toBe(4);
  expect(renderSpec(beam,1050)).toMatchObject({set:'beam',frame:5});
  expect(renderSpec(beam,1890).set).toBe('front34');
  for (const facing of ['left','right'] as const) {
   const spec=renderSpec({...beam,reduced:true,facing},1050);
   const rects=beamExtensions(spriteSets[spec.set],spec.frame,spec,200);
   expect(rects).toHaveLength(16);
   expect(facing==='left'?rects[0]!.x:rects[0]!.x+rects[0]!.w).toBe(facing==='left'?0:200);
  }
  const greet=step(initial(),{type:'action',action:'greet',now:0});
  expect(renderSpec(greet,1530)).toMatchObject({set:'greet',frame:0,dx:0});
  expect(renderSpec({...greet,facing:'left'},0).flip).toBe(true);
  const back=step(initial({reduced:true}),{type:'action',action:'wiggle',now:0});
  expect(renderSpec(back,0)).toMatchObject({set:'butt',dx:-1});
  expect(renderSpec(back,200)).toMatchObject({set:'butt',dx:1});
  const jump=step(initial({reduced:true}),{type:'click',now:0});
  expect(renderSpec(jump,120)).toMatchObject({set:'wave',dy:-4});
  const walking=tick(initial(),initial().nextWalkAt);
  expect(renderSpec(walking,walking.now)).toMatchObject({set:'walk',frame:0,dy:-1});
  expect(renderSpec(walking,walking.now+100)).toMatchObject({set:'walk',frame:1,dy:0});
  expect(renderSpec(initial({sleeping:true}),196)).toMatchObject({set:'sleep',frame:1,night:true});
 });
 it('cycles all eight walk frames every 800ms in either direction, lifting only passing frames 0 and 4',()=>{
  for(const x of [20,80]) {
   const m=freeze(tick({...initial(),x},3000));
   for(const [elapsed,frame,dy] of [
    [0,0,-1],[99,0,-1],[100,1,0],[199,1,0],
    [200,2,0],[299,2,0],[300,3,0],[399,3,0],
    [400,4,-1],[499,4,-1],[500,5,0],[599,5,0],
    [600,6,0],[699,6,0],[700,7,0],[799,7,0],
    [800,0,-1],[900,1,0],[1000,2,0],[1100,3,0],
    [1200,4,-1],[1300,5,0],[1400,6,0],[1500,7,0],[1600,0,-1],
   ] as const) {
    const now=3000+elapsed,spec=renderSpec(m,now);
    expect(spec).toMatchObject({set:'walk',frame,dy,facing:x===20?'right':'left'});
    expect(renderSpec(tick(m,now),now)).toEqual(spec);
   }
  }
 });
});

describe('idle chatter speech protection', () => {
 it('preserves the wake line through idle entry and reschedules overdue chatter', () => {
  let m=tick(initial({sleeping:true}),130000);
  m=step(m,{type:'click',now:130001});
  const wakeSpeech=m.speech!;
  m=tick(m,130901);
  expect(m.mode).toBe('idle');expect(m.speech).toEqual(wakeSpeech);
  expect(m.nextIdleLineAt-130901).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-130901).toBeLessThanOrEqual(120000);
  expect(tick(m,wakeSpeech.expiresAt-1).speech).toEqual(wakeSpeech);
  expect(tick(m,wakeSpeech.expiresAt).speech).toBe(null);
 });
 it.each([['greet',3060],['beam',1890],['wiggle',2400]] as const)('reschedules chatter when %s crosses its deadline and again on idle entry', (action,duration) => {
  let m=initial({reduced:true});const deadline=m.nextIdleLineAt;
  m=step(m,{type:'action',action,now:deadline-100});const speech=m.speech;
  m=tick(m,deadline);
  expect(m.mode).toBe(action);expect(m.speech).toEqual(speech);
  expect(m.nextIdleLineAt-deadline).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-deadline).toBeLessThanOrEqual(120000);
  const end=deadline-100+duration;m=tick(m,end);
  expect(m.mode).toBe('idle');expect(m.speech).toEqual(speech);
  expect(m.nextIdleLineAt-end).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-end).toBeLessThanOrEqual(120000);
 });
 it('skips chatter over visible speech while preserving the continuous-idle cadence', () => {
  let m=initial({reduced:true});const deadline=m.nextIdleLineAt;
  m=step(m,{type:'editorEvent',kind:'save',now:deadline-1});const speech=m.speech!;
  m=tick(m,deadline);expect(m.speech).toEqual(speech);expect(m.lastLineIndex.idle).toBe(-1);
  expect(m.nextIdleLineAt-deadline).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-deadline).toBeLessThanOrEqual(120000);
  const nextDeadline=m.nextIdleLineAt;
  m=tick(m,speech.expiresAt);expect(m.speech).toBe(null);expect(m.nextIdleLineAt).toBe(nextDeadline);
  m=tick(m,nextDeadline-1);expect(m.speech).toBe(null);
  m=tick(m,nextDeadline);expect(m.speech).not.toBe(null);
  expect(m.nextIdleLineAt-nextDeadline).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-nextDeadline).toBeLessThanOrEqual(120000);
 });
 it('reschedules overdue chatter while remaining asleep', () => {
  const m=tick(initial({sleeping:true}),130000);
  expect(m.mode).toBe('sleep');expect(m.speech).toBe(null);
  expect(m.nextIdleLineAt-130000).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-130000).toBeLessThanOrEqual(120000);
 });
 it('reschedules a future chatter deadline on idle entry even without an overdue line', () => {
  let m=step({...initial({reduced:true}),nextIdleLineAt:60000},{type:'action',action:'greet',now:0});
  m=tick(m,3060);
  expect(m.nextIdleLineAt-3060).toBeGreaterThanOrEqual(60000);
  expect(m.nextIdleLineAt-3060).toBeLessThanOrEqual(120000);
  expect(m.speech?.text).toBe(actions.greet);
 });
});

describe('click walk cancellation cooldown', () => {
 it('freezes the interpolated position and waits three seconds before walking again', () => {
  let m=initial();m=tick(m,m.nextWalkAt);const clickAt=m.walk!.startedAt+200;
  const x=positionAt(m,clickAt);freeze(m);
  const clicked=step(m,{type:'click',now:clickAt});
  expect(clicked.walk).toBe(null);expect(clicked.x).toBeCloseTo(x);
  expect(clicked.jumpStartedAt).toBe(clickAt);expect(renderSpec(clicked,clickAt).set).toBe('wave');
  expect(tick(clicked,clickAt+480).walk).toBe(null);
  expect(clicked.nextWalkAt-clickAt).toBe(3000);
  m=tick(clicked,clicked.nextWalkAt-1);expect(m.walk).toBe(null);
  m=tick(m,clicked.nextWalkAt);expect(m.walk).not.toBe(null);
 });
 it('resets the schedule for non-walking clicks and preserves Infinity under reduced motion', () => {
  const idle=initial();
  expect(step(idle,{type:'click',now:100}).nextWalkAt).toBe(3100);
  let m=tick(idle,idle.nextWalkAt);const now=m.now+100;
  m=step(m,{type:'motion',reduced:true,now});
  m=step(m,{type:'click',now:now+1});expect(m.nextWalkAt).toBe(Infinity);
  expect(tick(m,now+481).walk).toBe(null);
 });
});

it('keeps many walks inside centre-based bounds in both directions and at narrow edges',()=>{
 let left=false,right=false;
 for (let seed=0;seed<40;seed++) for (const x of [WALK_MIN_X,20,50,80,100-WALK_MAX_MARGIN]) {
  const base=createModel({now:0,seed,width:100});
  const m=tick({...base,x,nextWalkAt:0},0),walk=m.walk!;
  expect(walk.to).toBeGreaterThanOrEqual(WALK_MIN_X);expect(walk.to).toBeLessThanOrEqual(100-WALK_MAX_MARGIN);
  expect(Math.abs(walk.to-x)).toBeGreaterThanOrEqual(6);
  expect(walk.to).toBe(x<50?100-WALK_MAX_MARGIN:x>50?WALK_MIN_X:100-WALK_MAX_MARGIN);
  left ||= m.facing==='left';right ||= m.facing==='right';
 }
 expect(left && right).toBe(true);
 const narrow=initial({width:26});expect(tick({...narrow,nextWalkAt:0},0).walk).toBe(null);
});

describe('sprite-derived position margins',()=>{
 it('keeps every non-beam set, including walk, inside a 100px scene at both walk extremes and both facings',()=>{
  expect(Object.keys(spriteSets)).toContain('walk');
  // Sleep's 18.5 sprite-pixel extent becomes 9.25 scene pixels, plus 1 scene pixel.
  expect([WALK_MIN_X,WALK_MAX_MARGIN]).toEqual([10.25,10.25]);
  expect(WALK_MIN_X).toBeLessThan(19.5);expect(WALK_MAX_MARGIN).toBeLessThan(19.5);
  for(const [name,set] of Object.entries(spriteSets)) {
   if(name==='beam') continue;
   for(const x of [clampX(-100,100),clampX(200,100)]) for(const facing of ['left','right'] as const) {
    const pose=spritePlacement(set,{x,facing});
    expect(pose.left,`${name}/${facing} at ${x}`).toBeGreaterThanOrEqual(0);
    expect(pose.left+pose.width,`${name}/${facing} at ${x}`).toBeLessThanOrEqual(100);
   }
  }
 });
 it.each(['greet','wiggle','sleep'] as const)('clamps %s on action entry near either edge, including flipped art and wiggle offsets',action=>{
  for(const [x,expectedX] of [[8,10.25],[92,89.75],[12,12],[88,88]] as const) for(const facing of ['left','right'] as const) {
   const m=step({...initial(),x,facing},{type:'action',action,now:0});
   expect(m.x).toBe(expectedX);
   for(const now of [0,200]) {
    const spec=renderSpec(m,now);
    expect(spec.left).toBeGreaterThanOrEqual(0);
    expect(spec.left+spec.width).toBeLessThanOrEqual(100);
   }
  }
 });
 it('uses the derived margins on resize and centers panels too narrow for both margins',()=>{
  expect(step({...initial(),x:8},{type:'resize',width:100,now:1}).x).toBe(10.25);
  expect(step({...initial(),x:92},{type:'resize',width:100,now:1}).x).toBe(89.75);
  expect(step(initial(),{type:'resize',width:20,now:1}).x).toBe(10);
  const m=initial({width:20});expect(m.x).toBe(10);
  expect(tick({...m,nextWalkAt:0},0).walk).toBe(null);
  // The smaller character can now walk in a 38-scene-pixel panel.
  const wider=initial({width:38}),walking=tick({...wider,nextWalkAt:0},0);
  expect(walking.walk).not.toBe(null);
  expect(walking.walk!.to).toBeGreaterThanOrEqual(10.25);
  expect(walking.walk!.to).toBeLessThanOrEqual(27.75);
 });
});

describe('clicks during action clips',()=>{
 it.each([['greet',100],['beam',1050],['wiggle',200]] as const)('keeps %s frames playing while clicks choose nonrepeating greetings', (action,now)=>{
  for(const reduced of [false,true]) {
   const m=step(initial({reduced}),{type:'action',action,now:0});freeze(m);
   const before=renderSpec(m,now),clicked=step(m,{type:'click',now});
   expect(clicked.mode).toBe(action);expect(clicked.modeStartedAt).toBe(0);
   expect(clicked.jumpStartedAt).toBe(null);
   expect(pools.greeting).toContain(clicked.speech?.text);
   expect(renderSpec(clicked,now)).toEqual(before);
   expect(renderSpec(clicked,now+120)).toEqual(renderSpec(m,now+120));
   const again=step(clicked,{type:'click',now:now+1});
   expect(again.speech?.text).not.toBe(clicked.speech?.text);
   expect(again.jumpStartedAt).toBe(null);
   expect(renderSpec(again,now+1)).toEqual(renderSpec(m,now+1));
   // The projection also restricts a leftover jump timestamp to idle/walking.
   expect(renderSpec({...m,jumpStartedAt:now},now)).toEqual(before);
  }
 });
 it.each([['greet',3060],['beam',1890],['wiggle',2400]] as const)('allows a jump once %s ends', (action,now)=>{
  const m=step(initial(),{type:'action',action,now:0}),clicked=step(m,{type:'click',now});
  expect(clicked.mode).toBe('idle');expect(clicked.jumpStartedAt).toBe(now);
  expect(renderSpec(clicked,now).set).toBe('wave');
 });
});
