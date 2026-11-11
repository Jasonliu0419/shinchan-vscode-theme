import { beforeEach, describe, expect, it, vi } from 'vitest';
const fake=vi.hoisted(()=>{
 const saves: Array<()=>void>=[],diagnostics: Array<()=>void>=[],changes: Array<(e:{affectsConfiguration:(s:string)=>boolean})=>void>=[];
 let errors=2,enabled=true,motion='auto';
 const registrations: unknown[][]=[];
 const disposable=()=>({dispose:vi.fn()});
 const api={
  Uri:{joinPath:(base:{fsPath:string},...parts:string[])=>({fsPath:[base.fsPath,...parts].join('/'),toString(){return this.fsPath;}})},
  window:{registerWebviewViewProvider:vi.fn((...args:unknown[])=>{registrations.push(args);return disposable();})},
  workspace:{getConfiguration:()=>({get:(key:string,fallback:unknown)=>key==='reactToEditorEvents'?enabled:key==='reduceMotion'?motion:fallback}),onDidSaveTextDocument:(cb:()=>void)=>{saves.push(cb);return disposable();},onDidChangeConfiguration:(cb:(e:{affectsConfiguration:(s:string)=>boolean})=>void)=>{changes.push(cb);return disposable();}},
  languages:{getDiagnostics:()=>[['uri',Array.from({length:errors},()=>({severity:0})).concat([{severity:1}])]],onDidChangeDiagnostics:(cb:()=>void)=>{diagnostics.push(cb);return disposable();}},
  DiagnosticSeverity:{Error:0},
 };
 return {api,saves,diagnostics,changes,registrations,setErrors:(n:number)=>{errors=n;},setEnabled:(b:boolean)=>{enabled=b;},setMotion:(s:string)=>{motion=s;}};
});
vi.mock('vscode',()=>fake.api);
import { activate } from '../../src/extension/extension';
import { BuddyViewProvider } from '../../src/extension/buddyViewProvider';
import { registerEditorEvents } from '../../src/extension/editorEvents';
import { nonce } from '../../src/extension/nonce';
function context(){return {extensionUri:{fsPath:'/extension'},subscriptions:[] as Array<{dispose:()=>void}>};}
function view(){
 let listener:(m:unknown)=>void=()=>{};let disposed=()=>{};
 const postMessage=vi.fn().mockResolvedValue(true);
 const result={visible:true,webview:{options:{},html:'',cspSource:'vscode-webview://test',asWebviewUri:(u:{toString:()=>string})=>u,onDidReceiveMessage:(cb:(m:unknown)=>void)=>{listener=cb;return {dispose:vi.fn()};},postMessage},onDidDispose:(cb:()=>void)=>{disposed=cb;return {dispose:vi.fn()};}};
 return {result,postMessage,receive:(m:unknown)=>listener(m),dispose:()=>disposed()};
}
beforeEach(()=>{fake.saves.length=0;fake.diagnostics.length=0;fake.changes.length=0;fake.registrations.length=0;fake.setErrors(2);fake.setEnabled(true);fake.setMotion('auto');vi.clearAllMocks();});
describe('host wiring',()=>{
 it('registers the Explorer view without retaining hidden context and exposes resolution',()=>{
  const ctx=context(),api=activate(ctx as never);expect(api.viewId).toBe('shinchanBuddy.buddyView');expect(api.isViewResolved()).toBe(false);
  expect(fake.registrations[0]?.[0]).toBe(api.viewId);expect(fake.registrations[0]?.[2]).toEqual({webviewOptions:{retainContextWhenHidden:false}});
  const provider=fake.registrations[0]?.[1] as BuddyViewProvider;
  const v=view();provider.resolveWebviewView(v.result as never);expect(api.isViewResolved()).toBe(true);
  expect(v.result.webview.options).toMatchObject({enableScripts:true});
  v.dispose();expect(api.isViewResolved()).toBe(false);for(const d of ctx.subscriptions)d.dispose();
 });
 it('sends config on ready/change, ignores invalid messages, gates editor events and disposes',()=>{
  const provider=new BuddyViewProvider({fsPath:'/extension'} as never);provider.postEditorEvent('save');
  const v=view();provider.resolveWebviewView(v.result as never);expect(v.result.webview.html).toContain('dist/webview.js');
  v.receive({v:2,type:'ready'});expect(v.postMessage).not.toHaveBeenCalled();
  v.receive({v:1,type:'ready'});expect(v.postMessage).toHaveBeenLastCalledWith({v:1,type:'config',reduceMotion:'auto'});
  fake.setMotion('on');fake.changes[0]?.({affectsConfiguration:()=>true});expect(v.postMessage).toHaveBeenLastCalledWith({v:1,type:'config',reduceMotion:'on'});
  provider.postEditorEvent('save');expect(v.postMessage).toHaveBeenLastCalledWith({v:1,type:'editorEvent',kind:'save'});
  const count=v.postMessage.mock.calls.length;v.result.visible=false;provider.postEditorEvent('save');v.result.visible=true;fake.setEnabled(false);provider.postEditorEvent('save');expect(v.postMessage).toHaveBeenCalledTimes(count);
  provider.dispose();provider.postEditorEvent('save');expect(v.postMessage).toHaveBeenCalledTimes(count);
 });
 it('debounces global error counts from the activation baseline and cleans timers',()=>{
  vi.useFakeTimers();try {
   const emit=vi.fn(),disposable=registerEditorEvents(emit);
   vi.advanceTimersByTime(5000);
   fake.saves[0]?.();expect(emit).toHaveBeenLastCalledWith('save');
   fake.diagnostics[0]?.();vi.advanceTimersByTime(300);expect(emit).toHaveBeenCalledTimes(1);
   fake.setErrors(4);fake.diagnostics[0]?.();vi.advanceTimersByTime(200);fake.diagnostics[0]?.();vi.advanceTimersByTime(299);expect(emit).toHaveBeenCalledTimes(1);
   vi.advanceTimersByTime(1);expect(emit).toHaveBeenLastCalledWith('errorsIncreased');
   fake.setErrors(1);fake.diagnostics[0]?.();vi.advanceTimersByTime(300);expect(emit).toHaveBeenCalledTimes(2);
   fake.setErrors(2);fake.diagnostics[0]?.();vi.advanceTimersByTime(300);expect(emit).toHaveBeenCalledTimes(3);
   fake.setErrors(5);fake.diagnostics[0]?.();disposable.dispose();vi.advanceTimersByTime(300);expect(emit).toHaveBeenCalledTimes(3);
  } finally {vi.useRealTimers();}
 });
 it('suppresses startup diagnostic bursts including debounce crossing the grace boundary',()=>{
  vi.useFakeTimers();vi.setSystemTime(0);
  let disposable:ReturnType<typeof registerEditorEvents>|undefined;
  try {
   const emit=vi.fn();disposable=registerEditorEvents(emit);
   fake.setErrors(4);fake.diagnostics[0]?.();vi.advanceTimersByTime(300);
   expect(emit).not.toHaveBeenCalled();
   vi.advanceTimersByTime(4699);
   fake.setErrors(6);fake.diagnostics[0]?.();vi.advanceTimersByTime(300);
   expect(emit).not.toHaveBeenCalled();
   fake.setErrors(7);fake.diagnostics[0]?.();vi.advanceTimersByTime(300);
   expect(emit).toHaveBeenCalledExactlyOnceWith('errorsIncreased');
  } finally {disposable?.dispose();vi.useRealTimers();}
 });
 it('uses cryptographically generated safe, unique nonces',()=>{expect(nonce()).toMatch(/^[A-Za-z0-9_-]{32,}$/);expect(nonce()).not.toBe(nonce());});
});
