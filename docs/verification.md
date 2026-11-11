# 驗證紀錄

驗證日期：2026-11-11（Asia/Taipei）。所有執行驗證均由獨立驗證子代理負責；主代理負責實作與修正。工作目錄為 `/Users/ibm_jason/Desktop/AI_Learning/vs-code 主題`。

未安裝依賴、未連網、未啟動 VS Code、未執行 GUI integration test、未 commit 或 push。

## TDD RED / GREEN

每一階段先執行測試取得 RED，再由主代理實作，驗證子代理確認 GREEN。

| 階段 | RED 證據 | GREEN 證據 |
| --- | --- | --- |
| 1. Scaffold / architecture | `./node_modules/.bin/vitest run test/unit/architecture.test.ts`：2 tests，1 passed、1 failed；`src/core` 不存在。 | `npm test -- test/unit/architecture.test.ts`：2/2 passed；`npm run typecheck && npm run build` 成功。 |
| 2. RNG / palette / sprite / contrast | `npm test -- test/unit/primitives.test.ts`：suite 因缺少 `src/core/rng` import 失敗。 | 首次實作後 6/7 passed；修正測試把 14 色加透明共 15 keys 誤寫成 16 的預期後，primitives + theme 共 10/10 passed。 |
| 3. Theme | `npm test -- test/unit/theme.test.ts`：3 tests，1 passed、2 failed；theme JSON 尚未建立（ENOENT）。 | primitives + theme 共 10/10 passed；一般 token、semantic、comments、chrome 的實際背景對比全部達標。 |
| 4. Sprites / clips | `npm test -- test/unit/sprites-clips.test.ts`：缺少 `src/core/sprites` import。 | 首次實作 2/3 passed，`beam_head` 缺 K 輪廓；補上後 sprites-clips + scene 共 4/4 passed。所有圖尺寸、palette、feet、clip IDs 與時長通過。 |
| 5. Scene | `npm test -- test/unit/scene.test.ts`：缺少 `src/core/scene` import。 | sprites-clips + scene 共 4/4 passed；tiny widths、邊界、種子確定性與日夜差異通過。 |
| 6. Lines / reactions / tracker | `npm test -- test/unit/reactions.test.ts`：缺少 `src/core/lines` import。 | reactions 4/4 passed，涵蓋台詞數量、長度、固定句、無立即重複、cooldown 邊界、狀態限制、tracker baseline 與升降。 |
| 7. Machine / renderSpec | `npm test -- test/unit/machine.test.ts`：缺少 `src/core/machine/model` import。 | machine 15/15 passed；兩個 tsconfig typecheck 成功。 |
| 8. Protocol / HTML / hitTest | `npm test -- test/unit/boundaries.test.ts`：缺少 `src/core/protocol` import。 | boundaries 4/4 passed，涵蓋 parser、CSP、安全 markup 與翻面/jump hitTest。 |
| 9. Host / integration source | `npm test -- test/unit/host.test.ts`：缺少 `buddyViewProvider` import。 | host 4/4 passed；typecheck 與 `npx tsc -p tsconfig.test.json` 成功。只編譯 integration，未執行。 |
| 10. Webview | `npm test -- test/unit/webview.test.ts`：缺少 renderer import。 | webview 最初 4/4 passed，typecheck / build 成功；新增外觀/氣泡 regression 之 RED/GREEN 如下。 |
| 11. Packaging | `node --test test/packaging.test.mjs`：3 tests，2 passed、1 failed；VSIX 不存在。vsce listing 與 publish 阻擋案例已 passed。 | `npm run package` 成功；修正 ZIP 標準文件名稱映射後 packaging 3/3 passed。 |

### 審閱導出的 regression

- 驗證子代理唯讀審閱發現 `lie_2` 的 patches 與 `lie_1` 相同，以及氣泡未按自身寬度 clamp。
- 主代理先補測試；`npm test -- test/unit/sprites-clips.test.ts test/unit/webview.test.ts` 確認 8 tests 中 6 passed、2 failed，失敗精確對應上述兩問題。
- 修正後完整單元測試 48/48 passed；睡姿現在有胸口/手臂的 1 px 差異，氣泡依實際尺寸限制位置。
- 架構測試曾把純 scene geometry 的 kind 字串 `window` 誤認成 DOM global；改為 `houseWindow` 後通過，沒有放寬核心純函式限制。

## 最終 gates

以下命令按表列順序執行，全部 exit 0。

| Exact command | 結果 |
| --- | --- |
| `npm run typecheck` | extension + core（無 DOM lib）與 webview + core 皆通過。 |
| `npm test` | 10 test files，48 tests，全部 passed。 |
| `npm run test:coverage` | 10 test files，48 tests passed；四項 coverage 均超過 80%。 |
| `npm run build` | extension CJS/node20 與 webview IIFE/es2022 bundle 成功；開發 sourcemaps 產生。 |
| `npm run package` | prepublish typecheck + production build 成功；VSIX 18,414 bytes（VSCE 顯示 17.98 KB）。 |
| `npx tsc -p tsconfig.test.json` | integration test 編譯成功；未執行 GUI。 |
| `npx vsce ls --no-dependencies` | 恰為下列 8 個允許 payload 來源檔。 |
| `node --test test/packaging.test.mjs` | 3 tests，全部 passed；驗證 ZIP payload、listing 及 publish 主動阻擋。 |

### Coverage

Coverage 範圍為 `src/core/**/*.ts` 與 `src/extension/html.ts`；排除 `types.ts`。

| 指標 | 百分比 | 已覆蓋 / 總數 |
| --- | --- | --- |
| Statements | 99.19% | 245 / 247 |
| Branches | 97.02% | 228 / 235 |
| Functions | 100% | 45 / 45 |
| Lines | 99.5% | 200 / 201 |

剩餘未覆蓋處：`core/clips.ts:30` 的最後防禦 fallback；`core/machine/idle.ts:28–31` 的可行方向分支（該檔 branch 75%）；`renderSpec.ts:15`（branch 97.05%）；`step.ts:62`（branch 97.77%）。全域 thresholds 已通過。

### 封裝白名單

```text
CHANGELOG.md
LICENSE
README.md
package.json
dist/extension.js
dist/webview.js
media/webview.css
themes/shinchan-kasukabe-color-theme.json
```

ZIP 內 VSCE 會把文件標準化為 `changelog.md`、`LICENSE.txt`、`readme.md`；仍是同 8 個 payload 檔。加上 `[Content_Types].xml` 與 `extension.vsixmanifest` 兩個 VSIX metadata，ZIP 共 10 files。測試允許這個明確映射，來源 listing 仍以原始 8 檔精確比對。

`private: true` 被 VSCE 4.1.0 接受，未移除。封裝過程沒有 warning；Vitest 有非阻擋的未來 native config loader 警告：CommonJS context 載入使用 ESM syntax 的 `vitest.config.ts`。

## 對比與明確規格衝突

- 白字 `#FFFFFF` / title red `#D7332F`：4.7684006395:1。
- status text `#3B3330` / yellow `#F2C230`：7.3640289104:1。
- 紙色上的一般 token 最低為 Markdown heading 4.6508918458:1；comment 為 4.3563061927:1（門檻 3.5）；其餘一般與 semantic token 均達門檻。
- 規格同時要求 invalid 白字紅底及「所有 token 前景對紙色 4.5」。白字對紙色為 1.0252658625:1，無法同時符合。實作保留明訂白字紅底，測試對此 token 使用實際紅底（4.7684:1）；未變更 anchors。

## 外觀與架構檢查

`out/verification/sprites.png` 是由純 sprite/palette modules 產生的 720 × 640 PNG 蒙太奇（20 sprites），已以 `view_image` 實際檢查：大頭、黑髮帽、兩格高粗眉、小點眼、突出下頰、紅衣黃褲、白襪深鞋均可辨識；揮手、蓄力/前伸手、背面左右扭動、躺姿與醒來可辨識。圖像屬 ignored 驗證產物，未進 VSIX。

最終唯讀檢查：

- devDependencies 的原始 11 個版本完全保留：@types/mocha 10.0.10、@types/node 22.20.5、@types/vscode 1.95.0、@vitest/coverage-v8 5.1.0、@vscode/test-cli 0.0.15、@vscode/test-electron 3.1.0、@vscode/vsce 4.1.0、esbuild 0.28.2、mocha 12.0.3、typescript 7.0.2、vitest 5.1.0。
- `src` 沒有 `console.log`；`src/core` 沒有 vscode / node imports、document / window / acquireVsCodeApi、fetch 或 XMLHttpRequest。
- TypeScript 使用現代 preserve/bundler 與 integration nodenext 設定，沒有 legacy option 錯誤。
- Integration source 已寫完並編譯；GUI 執行依任務限制留給 reviewer。
- 不存在已知未完成的必要實作或其他必修問題；GUI 端到端實際啟動仍未執行。

## 最終命令原始輸出

### npm run typecheck

Exit code: 0

```text
> shinchan-buddy@0.1.0 typecheck
> tsc -p tsconfig.extension.json --noEmit && tsc -p tsconfig.webview.json --noEmit
```

### npm test

Exit code: 0

```text
> shinchan-buddy@0.1.0 test
> vitest run

(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1). Use a `.mjs` extension or set `"type": "module"` in the closest package.json
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.

 RUN  v5.1.0 /Users/ibm_jason/Desktop/AI_Learning/vs-code 主題


 Test Files  10 passed (10)
      Tests  48 passed (48)
   Start at  14:16:30
   Duration  296ms (import 34%, transform 31%, tests 26%, worker 9%)
```

### npm run test:coverage

Exit code: 0

```text
> shinchan-buddy@0.1.0 test:coverage
> vitest run --coverage

(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1). Use a `.mjs` extension or set `"type": "module"` in the closest package.json
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.

 RUN  v5.1.0 /Users/ibm_jason/Desktop/AI_Learning/vs-code 主題
      Coverage enabled with v8


 Test Files  10 passed (10)
      Tests  48 passed (48)
   Start at  14:16:31
   Duration  333ms (import 29%, worker 25%, tests 23%, transform 23%)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   99.19 |    97.02 |     100 |    99.5 |                   
 core              |   99.29 |      100 |     100 |   99.08 |                   
  clips.ts         |      95 |      100 |     100 |   94.11 | 30                
 core/machine      |   98.71 |    93.33 |     100 |     100 |                   
  idle.ts          |     100 |       75 |     100 |     100 | 28-31             
  renderSpec.ts    |     100 |    97.05 |     100 |     100 | 15                
  step.ts          |    97.5 |    97.77 |     100 |     100 | 62                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 99.19% ( 245/247 )
Branches     : 97.02% ( 228/235 )
Functions    : 100% ( 45/45 )
Lines        : 99.5% ( 200/201 )
================================================================================
```

### npm run build

Exit code: 0

```text
> shinchan-buddy@0.1.0 build
> node esbuild.mjs


  dist/extension.js       7.9kb
  dist/extension.js.map  12.8kb

⚡ Done in 6ms

  dist/webview.js      33.8kb
  dist/webview.js.map  63.4kb

⚡ Done in 7ms
```

### npm run package

Exit code: 0

```text
> shinchan-buddy@0.1.0 package
> vsce package --no-dependencies --allow-missing-repository --out shinchan-buddy.vsix

Executing prepublish script 'npm run vscode:prepublish'...

> shinchan-buddy@0.1.0 vscode:prepublish
> npm run typecheck && npm run build:prod


> shinchan-buddy@0.1.0 typecheck
> tsc -p tsconfig.extension.json --noEmit && tsc -p tsconfig.webview.json --noEmit


> shinchan-buddy@0.1.0 build:prod
> node esbuild.mjs --production


  dist/webview.js  19.8kb

⚡ Done in 5ms

  dist/extension.js  4.7kb

⚡ Done in 5ms
 INFO  Files included in the VSIX:
shinchan-buddy.vsix
├─ [Content_Types].xml 
├─ extension.vsixmanifest 
└─ extension/
   ├─ LICENSE.txt [1.06 KB]
   ├─ changelog.md [0.35 KB]
   ├─ package.json [2.28 KB]
   ├─ readme.md [1.71 KB]
   ├─ dist/
   │  ├─ extension.js [4.74 KB]
   │  └─ webview.js [19.79 KB]
   ├─ media/
   │  └─ webview.css [1.93 KB]
   └─ themes/
      └─ shinchan-kasukabe-color-theme.json [12.74 KB]

 DONE  Packaged: shinchan-buddy.vsix (10 files, 17.98 KB)
```

### npx tsc -p tsconfig.test.json

Exit code: 0

```text

```

### npx vsce ls --no-dependencies

Exit code: 0

```text
CHANGELOG.md
LICENSE
README.md
package.json
dist/extension.js
dist/webview.js
media/webview.css
themes/shinchan-kasukabe-color-theme.json
```

### node --test test/packaging.test.mjs

Exit code: 0

```text
TAP version 13
# Subtest: VSIX contains only the personal extension runtime and documentation
ok 1 - VSIX contains only the personal extension runtime and documentation
  ---
  duration_ms: 57.733792
  type: 'test'
  ...
# Subtest: package file listing is exactly the runtime allowlist
ok 2 - package file listing is exactly the runtime allowlist
  ---
  duration_ms: 820.95275
  type: 'test'
  ...
# Subtest: publish command is explicitly blocked
ok 3 - publish command is explicitly blocked
  ---
  duration_ms: 232.640333
  type: 'test'
  ...
1..3
# tests 3
# suites 0
# pass 3
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1172.622708
```

