import * as vscode from 'vscode';
import { VIEW_ID, type EditorEventKind } from '../core/types';
import { parseWebviewMessage, type HostMessage } from '../core/protocol';
import { buildHtml } from './html';
import { nonce } from './nonce';
import { readReduceMotion, reactsToEditorEvents } from './config';
export class BuddyViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly viewId = VIEW_ID;
  private view: vscode.WebviewView | undefined;
  private readonly configSubscription: vscode.Disposable;
  private viewSubscriptions: vscode.Disposable[] = [];
  constructor(private readonly extensionUri: vscode.Uri) {
    this.configSubscription = vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('workbench.reduceMotion')) this.sendConfig();
    });
  }
  isViewResolved(): boolean { return this.view !== undefined; }
  resolveWebviewView(view: vscode.WebviewView): void {
    this.clearView();
    this.view = view;
    const dist = vscode.Uri.joinPath(this.extensionUri, 'dist');
    const media = vscode.Uri.joinPath(this.extensionUri, 'media');
    view.webview.options = { enableScripts: true, localResourceRoots: [dist, media] };
    view.webview.html = buildHtml({
      cspSource: view.webview.cspSource,
      scriptUri: view.webview.asWebviewUri(vscode.Uri.joinPath(dist, 'webview.js')).toString(),
      styleUri: view.webview.asWebviewUri(vscode.Uri.joinPath(media, 'webview.css')).toString(), nonce: nonce(),
    });
    this.viewSubscriptions = [
      view.webview.onDidReceiveMessage((message: unknown) => { if (parseWebviewMessage(message)) this.sendConfig(); }),
      view.onDidDispose(() => this.clearView()),
    ];
  }
  postEditorEvent(kind: EditorEventKind): void {
    if (this.view?.visible && reactsToEditorEvents()) this.post({ v: 1, type: 'editorEvent', kind });
  }
  private sendConfig(): void { this.post({ v: 1, type: 'config', reduceMotion: readReduceMotion() }); }
  private post(message: HostMessage): void {
    // A disposed webview may reject a pending delivery. Dropping it is safe.
    void this.view?.webview.postMessage(message).then(undefined, () => undefined);
  }
  private clearView(): void {
    this.view = undefined;
    for (const subscription of this.viewSubscriptions) subscription.dispose();
    this.viewSubscriptions = [];
  }
  dispose(): void { this.clearView(); this.configSubscription.dispose(); }
}
