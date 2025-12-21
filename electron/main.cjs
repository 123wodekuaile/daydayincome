/**
 * electron/main.cjs
 * 改造为悬浮窗模式
 */
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  dialog,
} = require("electron");
const path = require("path");

let mainWindow; // 收入展示窗口
let settingsWindow; // 配置窗口

// 创建悬浮窗（展示收入）
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 260, // 初始宽度较小
    height: 150, // 增加一点高度给设置按钮
    x: width - 300, // 默认位置：右上角
    y: 100,
    type: "toolbar", // 在 macOS 上有助于浮动层级
    frame: false, // 无边框
    transparent: true, // 透明背景
    alwaysOnTop: true, // 全局置顶
    resizable: false, // 禁止用户随意拉伸大小
    hasShadow: false, // 去掉系统阴影
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 设置全屏显示策略
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const isDev = process.env.NODE_ENV === "development";
  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // 监听 React 发来的“打开设置”请求
  ipcMain.on("open-settings", () => {
    openSettingsWindow(startUrl);
  });

  // 监听 React 发来的“数据更新”请求
  ipcMain.on("settings-updated", () => {
    mainWindow.webContents.send("refresh-data");
  });

  // 监听保存成功后的弹窗请求
  ipcMain.on("show-save-success", () => {
    dialog.showMessageBox(settingsWindow || mainWindow, {
      type: "info",
      title: "配置已保存",
      message: "新的设置已生效，收入计算逻辑已更新。",
      buttons: ["好的"],
    });
  });

  // 注册全局快捷键：Cmd+Shift+I
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

// 创建配置窗口
function openSettingsWindow(baseUrl) {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show(); // 确保显示
    settingsWindow.focus(); // 确保前端聚焦
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 600,
    title: "设置 - DayDay Income",
    autoHideMenuBar: true,
    // parent: mainWindow, // 移除父子绑定，避免层级问题
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // 加载同一个页面，通过 hash 路由到设置页
  const settingsUrl = baseUrl.endsWith("/")
    ? `${baseUrl}#/settings`
    : `${baseUrl}/#/settings`;
  settingsWindow.loadURL(settingsUrl);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
