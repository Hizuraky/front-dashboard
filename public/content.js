let sidebarContainer = null;
let iframe = null;
let resizer = null;
let modeToggleBtn = null;

let state = {
  isOpen: false,
  width: 450,
  mode: "overlay", // "overlay" | "split"
};

const createSidebar = () => {
  if (sidebarContainer) return;

  // --- Container ---
  sidebarContainer = document.createElement("div");
  sidebarContainer.id = "dashboard-sidebar-container";
  sidebarContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${state.width}px;
    height: 100vh;
    z-index: 2147483647;
    background: white;
    box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    display: flex;
  `;

  // --- Iframe ---
  iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("index.html");
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    flex-grow: 1;
  `;
  sidebarContainer.appendChild(iframe);

  // --- Resizer Handle ---
  resizer = document.createElement("div");
  resizer.style.cssText = `
    width: 10px;
    height: 100%;
    background: transparent;
    cursor: col-resize;
    position: absolute;
    right: -5px;
    top: 0;
    z-index: 2147483648;
  `;
  // Add hover effect indicator
  const resizerLine = document.createElement("div");
  resizerLine.style.cssText = `
    width: 4px;
    height: 100%;
    margin: 0 auto;
    background: rgba(0,0,0,0.0);
    transition: background 0.2s;
  `;
  resizer.appendChild(resizerLine);

  resizer.addEventListener("mouseenter", () => {
    resizerLine.style.background = "rgba(0,0,0,0.1)";
  });
  resizer.addEventListener("mouseleave", () => {
    resizerLine.style.background = "rgba(0,0,0,0)";
  });

  sidebarContainer.appendChild(resizer);

  // --- Mode Toggle Button (on the resizer/edge) ---
  modeToggleBtn = document.createElement("button");
  modeToggleBtn.innerHTML = "◫"; // Icon for split/overlay
  modeToggleBtn.title = "Toggle Split/Overlay Mode";
  modeToggleBtn.style.cssText = `
    position: absolute;
    right: -24px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background: #333;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    z-index: 2147483648;
  `;
  modeToggleBtn.onclick = toggleMode;
  sidebarContainer.appendChild(modeToggleBtn);

  document.body.appendChild(sidebarContainer);

  setupResizer();
};

const setupResizer = () => {
  let isResizing = false;

  resizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    document.body.style.cursor = "col-resize";
    iframe.style.pointerEvents = "none"; // iframe上のマウスイベント干渉を防ぐ
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(
      300,
      Math.min(e.clientX, window.innerWidth - 100)
    ); // Min 300px, Max Window Width - 100px
    state.width = newWidth;
    updateLayout();
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "default";
      iframe.style.pointerEvents = "auto";
    }
  });
};

const updateLayout = () => {
  if (!sidebarContainer) return;

  // Update Width
  sidebarContainer.style.width = `${state.width}px`;

  // Handle Split Mode
  if (state.isOpen && state.mode === "split") {
    document.documentElement.style.marginLeft = `${state.width}px`;
    document.documentElement.style.width = `calc(100% - ${state.width}px)`;
    document.documentElement.style.transition =
      "margin-left 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
  } else {
    document.documentElement.style.marginLeft = "0";
    document.documentElement.style.width = "100%";
  }

  // Update Toggle Icon/State presentation if needed
  modeToggleBtn.innerHTML = state.mode === "split" ? "Overlay" : "Split";
  modeToggleBtn.style.background = state.mode === "split" ? "#0070f3" : "#333";
  modeToggleBtn.innerText = state.mode === "split" ? "⇔" : "◫";
};

const toggleMode = () => {
  state.mode = state.mode === "overlay" ? "split" : "overlay";
  updateLayout();
};

const toggleVisibility = () => {
  if (!sidebarContainer) createSidebar();

  state.isOpen = !state.isOpen;

  if (state.isOpen) {
    sidebarContainer.style.transform = "translateX(0)";
  } else {
    sidebarContainer.style.transform = "translateX(-100%)";
  }

  updateLayout();
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_sidebar") {
    toggleVisibility();
  }
});
