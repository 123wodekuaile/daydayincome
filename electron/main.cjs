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
    width: 350, // 稍微加宽
    height: 450, // 增加高度以容纳人民币展示区域
    x: width - 350, // 调整默认位置
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
    openSettingsWindow();
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

  // 监听退出请求
  ipcMain.on("app-quit", () => {
    app.quit();
  });

  // 监听关闭设置窗口请求
  ipcMain.on("close-settings", () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
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
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 420,
    height: 750, // 增加高度以容纳所有表单项和按钮
    minHeight: 600,
    title: "设置 - 实时收入",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    settingsWindow.loadURL("http://localhost:5173/#/settings");
  } else {
    // 使用 loadFile 配合 hash 参数，这是 Electron 官方推荐的加载本地文件带路由的方式
    settingsWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/settings",
    });
  }
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
