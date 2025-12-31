const toggleSidebar = async (tab) => {
  // chrome:// や edge:// などのシステムページでは実行できないため除外
  if (
    !tab.id ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("about:")
  ) {
    console.warn("Cannot inject script into system pages.");
    return;
  }

  try {
    // まずメッセージを送ってみる
    await chrome.tabs.sendMessage(tab.id, { action: "toggle_sidebar" });
  } catch (error) {
    // 受信側がいない(=content scriptが注入されていない)場合
    console.log("Content script not found, injecting...", error);

    try {
      // スクリプトを動的に注入
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // 注入後、再度メッセージ送信
      await chrome.tabs.sendMessage(tab.id, { action: "toggle_sidebar" });
    } catch (injectError) {
      console.error("Failed to inject script:", injectError);
    }
  }
};

chrome.action.onClicked.addListener(toggleSidebar);

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle_sidebar") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      await toggleSidebar(tab);
    }
  }
});
