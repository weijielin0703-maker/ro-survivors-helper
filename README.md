# RO Survivors 輔助器 by WJ

ro-survivors.com 的 Tampermonkey 掛機輔助腳本。**僅限作者 WJ 與朋友使用**：程式內容已加密，第一次使用要輸入密碼（向 WJ 索取）。

## 安裝

1. Chrome 安裝 [Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. `chrome://extensions` → Tampermonkey → 詳細資料 → 打開「允許使用者指令碼」
3. 點這個連結安裝：**[ro-survivors-helper.user.js](https://raw.githubusercontent.com/weijielin0703-maker/ro-survivors-helper/main/ro-survivors-helper.user.js)**，按「安裝」
4. 打開遊戲，右上角會出現密碼框，輸入密碼按「解鎖」，頁面會自動重新整理一次

## 更新

Tampermonkey 會自動檢查更新（約一天一次）；想立刻更新：管理面板 → 勾選腳本 → 「檢查更新」。
密碼存在瀏覽器裡，更新後不用再輸入（除非密碼換了）。

## 發佈（作者用）

原始碼不放在這裡。`RO_PASS=密碼 node build.js 原始碼.js` 產生加密的 `ro-survivors-helper.user.js`；
`RO_PASS=密碼 node build.js --decrypt > 原始碼.js` 取回原始碼。
