# 蠟筆小新小夥伴

個人使用的 VS Code 擴充套件：奶油色春日部淺色主題，以及 Explorer 裡會打招呼、發射動感光波、扭屁屁和睡覺的像素小新。

## 安裝

1. 在本專案執行 `npm run package`，產生 `shinchan-buddy.vsix`。
2. 在 VS Code 的擴充套件選單選「從 VSIX 安裝」，或執行 `code --install-extension shinchan-buddy.vsix --force`（亦可 `npm run install:local`）。
3. 在「色彩佈景主題」選擇「蠟筆小新 春日部」。在 Explorer 展開「小新小夥伴」。

## 操作

四個按鈕：打招呼、動感光波、扭屁屁、睡覺。點中角色會跳一下；角色獲得鍵盤焦點後也可按 Enter 或空白鍵。睡覺後點角色可喚醒，按動作則立即醒來。

存檔或錯誤增加時，小新偶爾會說一句話。可在設定關閉 `shinchanBuddy.reactToEditorEvents`。遵循 VS Code 的 `workbench.reduceMotion`；降低動態時不散步，各動作仍播放逐格圖像及位移，光波會延伸到面板邊緣。睡眠會在面板重新載入時還原。

台詞唯一編輯入口為 `src/core/lines.ts`；皆為簡短原創口吻。角色圖像來自 `assets/sprites.json` 的參考像素資料，以 3 倍整數比例繪製，在小新家前的道路散步；執行時不下載素材，也不傳送檔案或診斷內容。

像素參考圖作者：**a_cute_tattoo**；動畫取自使用者提供的 GIF。圖像僅供個人使用，**不得重新散布**。JSON 於建置時直接打包進 webview，VSIX 不包含 `assets/`、`docs/` 或 `tools/`。

## 開發與驗證

依賴已預先安裝，不需連網。`npm run typecheck`、`npm test`、`npm run test:coverage`、`npm run build`。`npm run pretest:integration` 僅建置與編譯；`npm run test:integration` 需要 GUI，請在本機手動執行。`npm run watch` 持續打包，`npm run build:prod` 產生壓縮版。

本套件僅供個人使用，未經官方授權，與原作權利人無關；不發佈 Marketplace。`npm run publish` 會主動失敗。MIT 授權適用於本專案程式碼；原作名稱與角色權利仍屬各權利人。
