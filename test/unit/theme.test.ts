import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/core/contrast';
const load = () => JSON.parse(readFileSync('themes/shinchan-kasukabe-color-theme.json','utf8'));
const anchors = {
  'titleBar.activeBackground':'#D7332F','activityBar.background':'#D7332F','statusBar.background':'#F2C230',
  'sideBar.background':'#FAF5EA','editor.background':'#FFFCF4','foreground':'#3B3330','editor.foreground':'#3B3330',
  'focusBorder':'#6FB7E9','progressBar.background':'#6FB7E9','statusBar.debuggingBackground':'#6FB7E9',
  'titleBar.activeForeground':'#FFFFFF','activityBar.foreground':'#FFFFFF','activityBar.activeBorder':'#F2C230',
  'activityBarBadge.background':'#F2C230','statusBar.foreground':'#3B3330','button.background':'#D7332F',
  'tab.activeBorderTop':'#D7332F','editorCursor.foreground':'#D7332F','list.highlightForeground':'#D7332F',
};
const required = [
 'sideBarSectionHeader.background','list.activeSelectionBackground','statusBarItem.hoverBackground',
 'editor.lineHighlightBackground','editor.selectionBackground','editor.findMatchBackground','editorLineNumber.foreground',
 'editorIndentGuide.background1','editorWhitespace.foreground','editorRuler.foreground','editorBracketMatch.background',
 'editorError.foreground','editorWarning.foreground','editorInfo.foreground','editorGutter.addedBackground',
 'tab.activeBackground','editorGroup.border','editorWidget.background','editorSuggestWidget.background',
 'peekViewEditor.background','quickInput.background','menu.background','notificationCenterHeader.background',
 'breadcrumb.foreground','input.background','dropdown.background','checkbox.background','badge.background',
 'scrollbarSlider.background','panel.background','terminal.background','gitDecoration.modifiedResourceForeground',
 'diffEditor.insertedTextBackground','textBlockQuote.background','textCodeBlock.background',
];
describe('Kasukabe light theme', () => {
 it('is strict JSON, light, with broad valid colors and exact anchors', () => {
  const theme=load(); expect(theme.type).toBe('light'); expect(theme.semanticHighlighting).toBe(true);
  for(const [key,value] of Object.entries(anchors)) expect(theme.colors[key],key).toBe(value);
  for(const key of required) expect(theme.colors[key],key).toMatch(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/);
  for(const color of Object.values(theme.colors)) expect(color).toMatch(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/);
  for(const name of ['Black','Red','Green','Yellow','Blue','Magenta','Cyan','White']) {
   expect(theme.colors['terminal.ansi'+name]).toBeTruthy(); expect(theme.colors['terminal.ansiBright'+name]).toBeTruthy();
  }
  expect(theme.colors['editor.selectionBackground']).toHaveLength(9);
 });
 it('meets token and chrome contrast thresholds', () => {
  const theme=load();
  for(const token of theme.tokenColors) {
   const comment=String(token.scope).includes('comment');
   if(token.settings.foreground) expect(contrastRatio(token.settings.foreground,token.settings.background ?? '#FFFCF4'),token.name).toBeGreaterThanOrEqual(comment?3.5:4.5);
  }
  for(const [name,value] of Object.entries(theme.semanticTokenColors)) {
   const color=typeof value==='string'?value:(value as {foreground:string}).foreground;
   expect(contrastRatio(color,'#FFFCF4'),name).toBeGreaterThanOrEqual(name.includes('comment')?3.5:4.5);
  }
  expect(contrastRatio(theme.colors['statusBar.foreground'],theme.colors['statusBar.background'])).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(theme.colors['titleBar.activeForeground'],theme.colors['titleBar.activeBackground'])).toBeGreaterThanOrEqual(4.5);
 });
 it('contributes the final Chinese label to VS Code', () => {
  const p=JSON.parse(readFileSync('package.json','utf8'));
  expect(p.contributes.themes).toEqual([{label:'蠟筆小新 春日部',uiTheme:'vs',path:'./themes/shinchan-kasukabe-color-theme.json'}]);
 });
});
