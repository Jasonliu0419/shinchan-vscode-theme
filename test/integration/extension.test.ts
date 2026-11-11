import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';
type TestApi = Readonly<{ viewId: string; isViewResolved(): boolean }>;
suite('shinchan-buddy Extension Host', () => {
  test('activates and resolves the Explorer webview with its light theme contribution', async function () {
    this.timeout(10_000);
    const extension = vscode.extensions.getExtension<TestApi>('local.shinchan-buddy');
    assert.ok(extension, 'Extension local.shinchan-buddy should be installed');
    const api = await extension.activate();
    assert.equal(api.viewId, 'shinchanBuddy.buddyView');
    await vscode.commands.executeCommand('shinchanBuddy.buddyView.focus');
    const deadline = Date.now() + 5000;
    while (!api.isViewResolved() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(api.isViewResolved(), true, 'Explorer webview must resolve within 5 seconds');
    const manifest = extension.packageJSON as { contributes: { themes: Array<{ label: string; uiTheme: string }> } };
    assert.equal(manifest.contributes.themes[0]?.label, '蠟筆小新 春日部');
    assert.equal(manifest.contributes.themes[0]?.uiTheme, 'vs');
  });
});
