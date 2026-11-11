import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Renderer } from '../../src/webview/renderer';
import { SpriteCache } from '../../src/webview/spriteCache';
import { startLoop } from '../../src/webview/loop';
import { updateSpeech } from '../../src/webview/ui';
import { isReduced } from '../../src/webview/motion';
import { renderSpec } from '../../src/core/machine/renderSpec';
import { createModel } from '../../src/core/machine/model';
import { step } from '../../src/core/machine/step';
function canvas() {
 const ctx={imageSmoothingEnabled:true,fillStyle:'',fillRect:vi.fn(),clearRect:vi.fn(),drawImage:vi.fn(),setTransform:vi.fn()};
 return {width:0,height:0,style:{width:'',height:''},getContext:()=>ctx,ctx};
}
afterEach(()=>vi.unstubAllGlobals());
it('honors host motion overrides and system auto preference',()=>{
 expect(isReduced('on',false)).toBe(true);expect(isReduced('off',true)).toBe(false);expect(isReduced('auto',true)).toBe(true);expect(isReduced('auto',false)).toBe(false);
});
it('renders half-size sprites at DPR 2 in an unchanged scene, caches frames, and paints scaled shadows and beams',()=>{
 const made:ReturnType<typeof canvas>[]=[];vi.stubGlobal('document',{createElement:()=>{const c=canvas();made.push(c);return c;}});
 const surface=canvas(),renderer=new Renderer(surface as never);
 expect(renderer.resize(403,2)).toBe(134);expect(surface.width).toBe(804);expect(surface.height).toBe(384);expect(surface.ctx.imageSmoothingEnabled).toBe(false);
 expect(surface.style).toEqual({width:'402px',height:'192px'});
 expect(surface.ctx.setTransform).toHaveBeenLastCalledWith(6,0,0,6,0,0);
 const spec=renderSpec(createModel({now:0,seed:1,width:134}),0);
 renderer.render(spec);const scene=made[0]!;const count=scene.ctx.fillRect.mock.calls.length;expect(count).toBeGreaterThan(0);
 expect(scene).toMatchObject({width:134,height:64});
 expect(surface.ctx.drawImage).toHaveBeenCalledWith(scene,0,0);
 expect(surface.ctx.drawImage).toHaveBeenLastCalledWith(expect.anything(),spec.left,spec.top,12,15.5);
 expect(surface.ctx.fillRect).toHaveBeenCalledWith(spec.x-3.5,61,7,0.5);
 renderer.render({...spec,x:67.25});
 expect(surface.ctx.fillRect).toHaveBeenCalledWith(63.75,61,7,0.5);
 renderer.render(spec);expect(scene.ctx.fillRect).toHaveBeenCalledTimes(count);
 renderer.render({...spec,night:true});expect(scene.ctx.fillRect.mock.calls.length).toBeGreaterThan(count);
 renderer.resize(403,1);expect(surface.ctx.imageSmoothingEnabled).toBe(false);expect(surface.width).toBe(402);
 const cache=new SpriteCache();
 expect(cache.get('side',0,false)).toBe(cache.get('side',0,false));
 expect(cache.get('side',0,true)).not.toBe(cache.get('side',0,false));
 expect(cache.get('greet',0,false)).not.toBe(cache.get('greet',1,false));
 expect(cache.get('front',0,false)).not.toBe(cache.get('side',0,false));
 expect(cache.get('beam',0,false)).toMatchObject({width:76,height:31});
 renderer.resize(600,1);
 const beam=step(createModel({now:0,seed:1,width:200,reduced:true}),{type:'action',action:'beam',now:0});
 renderer.render(renderSpec({...beam,facing:'left'},1050));
 expect(surface.ctx.fillRect).toHaveBeenCalledWith(0,49,68.5,0.5);
 renderer.render(renderSpec({...beam,facing:'right'},1050));
 expect(surface.ctx.fillRect).toHaveBeenCalledWith(132,49,68,0.5);
 const empty=new Renderer(canvas() as never);empty.render(spec);
});
it('throttles reducer ticks to at most every 50ms and pauses rAF while hidden',()=>{
 let frame:(now:number)=>void=()=>{};let visibility=()=>{};
 const doc={hidden:false,addEventListener:vi.fn((_name:string,cb:()=>void)=>{visibility=cb;}),removeEventListener:vi.fn()};
 const request=vi.fn((cb:(now:number)=>void)=>{frame=cb;return 1;}),cancel=vi.fn();
 vi.stubGlobal('document',doc);vi.stubGlobal('requestAnimationFrame',request);vi.stubGlobal('cancelAnimationFrame',cancel);
 const tick=vi.fn(),draw=vi.fn(),stop=startLoop(tick,draw);
 frame(0);frame(20);frame(50);expect(tick.mock.calls.map(args=>args[0])).toEqual([0,50]);expect(draw).toHaveBeenCalledTimes(3);
 doc.hidden=true;visibility();expect(cancel).toHaveBeenCalled();const requested=request.mock.calls.length;
 doc.hidden=false;visibility();expect(request.mock.calls.length).toBe(requested+1);frame(1000);expect(tick).toHaveBeenLastCalledWith(1000);
 stop();expect(doc.removeEventListener).toHaveBeenCalled();
});
it('connects the browser adapter with safe DOM writes and one VS Code API acquisition',()=>{
 const main=readFileSync('src/webview/main.ts','utf8');expect(main.match(/acquireVsCodeApi\(\)/g)).toHaveLength(1);
 for(const path of ['main','ui','messaging','renderer','motion','loop','spriteCache']) {
  const source=readFileSync(`src/webview/${path}.ts`,'utf8');expect(source).not.toMatch(/\.innerHTML|setAttribute\(['"]style/);
 }
 const ui=readFileSync('src/webview/ui.ts','utf8');expect(ui).toContain('textContent');expect(ui).toContain('.style.left');
});

it('anchors speech above standing frames using cached width, without reading layout',()=>{
 const spec=renderSpec(createModel({now:0,seed:1,width:100}),0);
 const element={hidden:true,textContent:'',style:{left:'',top:''},
  get offsetWidth(){throw new Error('layout read');},get offsetHeight(){throw new Error('layout read');}};
 const line={text:'動感光波～逼逼逼～!',expiresAt:4000};
 updateSpeech(element as never,line,{...spec,x:2},100,180);
 expect(element.style.left).toBe('98px');expect(element.style.top).toBe('126.5px');
 updateSpeech(element as never,line,{...spec,x:98},100,180);
 expect(element.style.left).toBe('202px');
 updateSpeech(element as never,line,{...spec,x:50},100,180);
 expect(element.style.left).toBe('150px');
 updateSpeech(element as never,null,spec,100,180);expect(element.hidden).toBe(true);expect(element.textContent).toBe('');
});

it('boots with crypto entropy, draws once per rAF and observes scene/speech sizes without frame layout reads',async()=>{
 vi.resetModules();
 let frame:(now:number)=>void=()=>{},resize:(entries:unknown[])=>void=()=>{};
 const windowEvents=new Map<string,()=>void>();let reads=0;
 const surface={...canvas(),addEventListener:vi.fn(),removeEventListener:vi.fn()},
  scene={get clientWidth(){reads++;return 300;}},
  speech={hidden:true,textContent:'',style:{left:'',top:''},get offsetWidth(){throw new Error('layout read');},get offsetHeight(){throw new Error('layout read');}};
 const doc={hidden:false,createElement:()=>canvas(),querySelector:(selector:string)=>({'#buddy':surface,'#scene':scene,'#speech':speech})[selector],
  querySelectorAll:()=>[],addEventListener:vi.fn(),removeEventListener:vi.fn()};
 const api={getState:()=>null,setState:vi.fn(),postMessage:vi.fn()};
 const random=vi.fn((array:Uint32Array)=>{array[0]=123456;return array;});
 const disconnect=vi.fn(),observe=vi.fn();
 vi.stubGlobal('document',doc);vi.stubGlobal('window',{devicePixelRatio:1,addEventListener:(name:string,fn:()=>void)=>windowEvents.set(name,fn),removeEventListener:vi.fn()});
 vi.stubGlobal('crypto',{getRandomValues:random});vi.stubGlobal('acquireVsCodeApi',()=>api);
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
 vi.stubGlobal('ResizeObserver',class {constructor(callback:typeof resize){resize=callback;}observe=observe;disconnect=disconnect;});
 vi.stubGlobal('requestAnimationFrame',(cb:typeof frame)=>{frame=cb;return 1;});vi.stubGlobal('cancelAnimationFrame',vi.fn());
 await import('../../src/webview/main');
 expect(random).toHaveBeenCalledOnce();
 expect(observe.mock.calls[0]![0]).toBe(scene);expect(observe.mock.calls[1]![0]).toBe(speech);
 expect(surface.ctx.clearRect).not.toHaveBeenCalled();const initialReads=reads;
 frame(0);expect(surface.ctx.clearRect).toHaveBeenCalledTimes(1);
 frame(20);expect(surface.ctx.clearRect).toHaveBeenCalledTimes(2);
 frame(50);expect(surface.ctx.clearRect).toHaveBeenCalledTimes(3);expect(reads).toBe(initialReads);
 resize([{target:scene,contentRect:{width:360}},{target:speech,borderBoxSize:[{inlineSize:180}]}]);
 expect(surface.width).toBe(360);expect(surface.ctx.clearRect).toHaveBeenCalledTimes(3);
 frame(100);expect(surface.ctx.clearRect).toHaveBeenCalledTimes(4);expect(reads).toBe(initialReads);
 windowEvents.get('resize')!();expect(reads).toBe(initialReads);
 windowEvents.get('pagehide')!();expect(disconnect).toHaveBeenCalledOnce();
});
