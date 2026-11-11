import * as vscode from 'vscode';
import { VIEW_ID } from '../core/types';
import { BuddyViewProvider } from './buddyViewProvider';
import { registerEditorEvents } from './editorEvents';
export type ExtensionTestApi = Readonly<{ viewId: string; isViewResolved(): boolean }>;
export function activate(context: vscode.ExtensionContext): ExtensionTestApi {
  const provider = new BuddyViewProvider(context.extensionUri);
  const registration = vscode.window.registerWebviewViewProvider(VIEW_ID, provider, {
    webviewOptions: { retainContextWhenHidden: false },
  });
  context.subscriptions.push(provider, registration, registerEditorEvents(kind => provider.postEditorEvent(kind)));
  return { viewId: VIEW_ID, isViewResolved: () => provider.isViewResolved() };
}
