import * as vscode from 'vscode';
import { createErrorTracker, trackErrors } from '../core/errorTracker';
import type { EditorEventKind } from '../core/types';
export const DIAGNOSTICS_DEBOUNCE_MS = 300;
function countErrors(): number {
  return vscode.languages.getDiagnostics().reduce((total, [, diagnostics]) =>
    total + diagnostics.filter(diagnostic => diagnostic.severity === vscode.DiagnosticSeverity.Error).length, 0);
}
export function registerEditorEvents(emit: (kind: EditorEventKind) => void): vscode.Disposable {
  let tracker = createErrorTracker(countErrors(), Date.now());
  let timer: ReturnType<typeof setTimeout> | undefined;
  const save = vscode.workspace.onDidSaveTextDocument(() => emit('save'));
  const diagnostics = vscode.languages.onDidChangeDiagnostics(() => {
    const changedAt = Date.now();
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      const result = trackErrors(tracker, countErrors(), changedAt);
      tracker = result.tracker;
      if (result.increased) emit('errorsIncreased');
    }, DIAGNOSTICS_DEBOUNCE_MS);
  });
  return { dispose() { save.dispose(); diagnostics.dispose(); if (timer !== undefined) clearTimeout(timer); timer = undefined; } };
}
