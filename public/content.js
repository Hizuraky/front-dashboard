let iframe = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_sidebar") {
    if (iframe) {
      // 既に存在する場合は表示/非表示を切り替え
      const isHidden = iframe.style.transform === "translateX(-100%)";
      iframe.style.transform = isHidden ? "translateX(0)" : "translateX(-100%)";
    } else {
      // 初回作成: iframeを生成してページに注入
      iframe = document.createElement("iframe");

      // スタイルの適用
      iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 450px;
        height: 100vh;
        border: none;
        z-index: 2147483647; /* 最大のz-index */
        box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        background: white;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      `;

      // Next.jsアプリのindex.htmlを読み込む
      iframe.src = chrome.runtime.getURL("index.html");

      document.body.appendChild(iframe);

      // アニメーションのために少し遅延させてスライドイン
      setTimeout(() => {
        iframe.style.transform = "translateX(0)";
      }, 50);
    }
  }
});
