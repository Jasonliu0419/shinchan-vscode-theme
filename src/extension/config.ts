import * as vscode from 'vscode';
import type { ReduceMotion } from '../core/protocol';
export function readReduceMotion(): ReduceMotion {
  const value = vscode.workspace.getConfiguration('workbench').get<unknown>('reduceMotion', 'auto');
  return value === 'on' || value === 'off' ? value : 'auto';
}
export function reactsToEditorEvents(): boolean {
  return vscode.workspace.getConfiguration('shinchanBuddy').get<boolean>('reactToEditorEvents', true);
}
