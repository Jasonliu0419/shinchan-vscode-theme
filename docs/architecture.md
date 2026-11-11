# shinchan-buddy 設計與驗證邊界

產品規格採用使用者定稿內容。核心與介面分離：

- `src/core` 不讀取時鐘、DOM、Node 或 VS Code。事件帶入 `now`，mulberry32 的 seed 存在不可變 Model 中。`step` 負責行為，`renderSpec` 是畫面投影。
- `clips.ts` 定義動畫幀與時長，光波階段與跳躍時長也由這裡提供，避免 renderer 重建規則。
- `lines.ts` 是台詞唯一編輯入口；picker 與政策模組決定不連續重複及事件冷卻。`errorTracker` 每次更新基準，包含下降後再上升。
- extension adapter 負責配置、全域 Error 計數與 300ms debounce、可見性與設定閘門，以及 webview 資源與 CSP。
- webview adapter 負責輸入、DPR、rAF、系統降低動態偏好、睡眠狀態保存。背景只在邏輯寬度／日夜變更時重畫。角色 cache 包含左右方向，左向由純 `mirror` 產生。

## 規格衝突的明確處理

Invalid token 明訂白字 `#FFFFFF` 搭配紅底 `#D7332F`，同時一般對比規則要求每個 token 前景對奶油底達 4.5。白字對奶油底無法符合；保留明訂的 invalid 樣式，測試其實際紅底（4.7684:1）。所有其他 token 與 semantic token 仍對 `#FFFCF4` 測試。titleBar 與 statusBar 錨點無須更改。

## TDD 與交付

每階段先建立測試，由驗證子代理確認 RED，再實作與確認 GREEN。後續審閱新增「睡眠兩幀不同」與「整個氣泡位於場景內」回歸案例，也先確認 RED。整合測試只編譯，不執行 GUI。

`test/packaging.test.mjs` 是獨立的封裝驗收測試：封裝前因 VSIX 不存在而 RED，`npm run package` 後驗證 archive、vsce 檔案列表及 publish 阻擋。它與只測原始碼的 Vitest suite 分開，避免單元測試依賴建置產物。
