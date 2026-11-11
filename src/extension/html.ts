export type HtmlOptions = Readonly<{ cspSource: string; scriptUri: string; styleUri: string; nonce: string }>;
function attribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/** Static markup only. Bubble copy and positions are updated through DOM APIs. */
export function buildHtml(options: HtmlOptions): string {
  if (!/^[\w-]+$/.test(options.nonce)) throw new Error('Unsafe webview nonce');
  const policy = `default-src 'none'; img-src ${options.cspSource} data:; style-src ${options.cspSource}; script-src 'nonce-${options.nonce}'; font-src ${options.cspSource}`;
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${attribute(policy)}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="${attribute(options.styleUri)}">
<title>小新小夥伴</title>
</head>
<body>
<main>
<div id="scene">
<canvas id="buddy" tabindex="0" role="button" aria-label="小新，按 Enter 或空白鍵互動">小新小夥伴：請使用下方動作按鈕。</canvas>
<div id="speech" role="status" aria-live="polite" aria-atomic="true" hidden></div>
</div>
<div id="actions" role="group" aria-label="小新動作">
<button type="button" data-action="greet">打招呼</button>
<button type="button" data-action="beam">動感光波</button>
<button type="button" data-action="wiggle">扭屁屁</button>
<button type="button" data-action="sleep">睡覺</button>
</div>
<p class="hint">點小新玩一下，睡著時點他就會醒來。</p>
<p id="error" role="alert" hidden></p>
</main>
<script nonce="${attribute(options.nonce)}" src="${attribute(options.scriptUri)}"></script>
</body>
</html>`;
}
