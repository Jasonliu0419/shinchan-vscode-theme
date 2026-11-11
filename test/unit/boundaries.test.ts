import { describe, expect, it } from 'vitest';
import { parseHostMessage, parseWebviewMessage } from '../../src/core/protocol';
import { buildHtml } from '../../src/extension/html';
describe('versioned message guards',()=>{
 it('accepts only valid kinds and motion settings, drops malformed messages',()=>{
  for(const reduceMotion of ['on','off','auto']) expect(parseHostMessage({v:1,type:'config',reduceMotion})).toEqual({v:1,type:'config',reduceMotion});
  for(const kind of ['save','errorsIncreased']) expect(parseHostMessage({v:1,type:'editorEvent',kind})).toEqual({v:1,type:'editorEvent',kind});
  expect(parseWebviewMessage({v:1,type:'ready'})).toEqual({v:1,type:'ready'});
  for(const value of [null,undefined,1,'ready',[],{}, {v:2,type:'ready'},{v:1,type:'unknown'},{v:1,type:'config',reduceMotion:true},{v:1,type:'editorEvent',kind:'error'}]) {
   expect(parseHostMessage(value)).toBeUndefined();expect(parseWebviewMessage(value)).toBeUndefined();
  }
 });
});
describe('strict nonce-only webview HTML',()=>{
 it('uses resource URLs with no inline styling/eval and an accessible scene',()=>{
  const html=buildHtml({cspSource:'vscode-webview://local',scriptUri:'vscode-resource://local/main.js',styleUri:'vscode-resource://local/ui.css',nonce:'abc123'});
  for(const directive of ["default-src 'none'","img-src vscode-webview://local data:","style-src vscode-webview://local","script-src 'nonce-abc123'","font-src vscode-webview://local"]) expect(html).toContain(directive);
  expect(html).not.toMatch(/unsafe-inline|unsafe-eval|<style\b|\sstyle=/);
  expect(html).toContain('nonce="abc123"');expect(html).toContain('aria-live="polite"');expect(html).toContain('tabindex="0"');
  expect(html.match(/<button\b/g)).toHaveLength(4);
 });
 it('escapes attribute input and rejects unsafe nonces',()=>{
  const html=buildHtml({cspSource:'vscode-webview://local',scriptUri:'x" onload="bad',styleUri:'x<bad>&"',nonce:'safe'});
  expect(html).not.toContain('src="x" onload=');expect(html).toContain('&quot;');expect(html).toContain('&lt;');
  expect(()=>buildHtml({cspSource:'x',scriptUri:'x',styleUri:'x',nonce:"bad'nonce"})).toThrow();
 });
});
