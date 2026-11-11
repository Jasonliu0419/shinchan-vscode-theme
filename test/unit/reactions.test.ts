import { expect, it } from 'vitest';
import { actions, wake, pools } from '../../src/core/lines';
import { pickLine } from '../../src/core/linePicker';
import { canReact, COOLDOWN } from '../../src/core/reactionPolicy';
import { createErrorTracker, trackErrors } from '../../src/core/errorTracker';
it('keeps all editable copy in short original pools with exact actions',()=>{
 expect(actions).toEqual({greet:'欸欸～大姊姊～',beam:'動感光波～逼逼逼～!',wiggle:'噗哩噗哩～',sleep:'晚安～'});
 expect(wake).toEqual(['嗯…再睡五分鐘啦…']);
 const all=[...Object.values(actions),...wake,...Object.values(pools).flat()];
 expect(all.length).toBeGreaterThanOrEqual(20);expect(all.length).toBeLessThanOrEqual(30);
 for(const line of all) expect([...line].length).toBeLessThanOrEqual(20);
});
it('never repeats the previous index with multiple choices, deterministically',()=>{
 let seed=12,previous=-1;
 for(let i=0;i<100;i++) {const picked=pickLine(['a','b','c'],previous,seed);expect(picked.index).not.toBe(previous);expect(picked).toEqual(pickLine(['a','b','c'],previous,seed));previous=picked.index;seed=picked.seed;}
 expect(pickLine(['one'],0,1).line).toBe('one');expect(()=>pickLine([],0,1)).toThrow();
});
it('reacts at inclusive independent cooldown boundaries, ignoring sleep/waking',()=>{
 expect(COOLDOWN).toEqual({save:20000,errorsIncreased:30000});
 const last={save:0,errorsIncreased:0};
 expect(canReact('save','idle',19999,last)).toBe(false);expect(canReact('save','idle',20000,last)).toBe(true);
 expect(canReact('errorsIncreased','beam',29999,last)).toBe(false);expect(canReact('errorsIncreased','beam',30000,last)).toBe(true);
 for(const mode of ['sleep','waking'] as const) expect(canReact('save',mode,1e6,last)).toBe(false);
 expect(canReact('save','idle',0,{save:-Infinity,errorsIncreased:100})).toBe(true);
});
it('tracks the baseline and recovers after a decrease before a fresh increase',()=>{
 let tracker=createErrorTracker(3,0);
 let result=trackErrors(tracker,3,5000);expect(result.increased).toBe(false);
 result=trackErrors(result.tracker,5,5001);expect(result.increased).toBe(true);
 result=trackErrors(result.tracker,1,5002);expect(result.increased).toBe(false);
 result=trackErrors(result.tracker,2,5003);expect(result.increased).toBe(true);
 expect(tracker.count).toBe(3);
});

it('re-baselines increases inside the startup grace without reacting or mutating input',()=>{
 const tracker=Object.freeze(createErrorTracker(2,10000));
 const result=trackErrors(tracker,4,14999);
 expect(result.tracker.count).toBe(4);expect(result.increased).toBe(false);expect(tracker.count).toBe(2);
 expect(trackErrors(result.tracker,4,15001).increased).toBe(false);
});
it('reports fresh increases after grace against the updated startup baseline',()=>{
 const baseline=trackErrors(createErrorTracker(2,10000),4,14000).tracker;
 const result=trackErrors(baseline,5,15001);
 expect(result.increased).toBe(true);expect(result.tracker.count).toBe(5);
});
it('ends the startup grace exactly 5000ms after activation',()=>{
 const tracker=createErrorTracker(2,10000);
 expect(trackErrors(tracker,3,15000).increased).toBe(true);
});
