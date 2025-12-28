# 实时收入 💰

> 看着钱进账，上班更有劲！

一款基于 Electron + React 开发的桌面应用，实时显示你的工资收入增长，让每一秒的工作都看得见回报。

## ✨ 功能特性

- 🎯 **实时显示** - 精确到分秒，看着收入数字跳动
- 💰 **人民币动画** - 鼠标悬停显示人民币扇形展开效果
- 🎨 **精美界面** - 半透明悬浮窗，不影响工作
- 🔧 **自定义配置** - 可设置月薪、工作天数、上下班时间
- 🖱️ **全局操作** - 可拖拽、快捷键隐藏/显示
- 🌍 **跨平台** - 支持 macOS 和 Windows

## 📦 下载安装

### macOS 用户

1. 前往 [Releases 页面](https://github.com/123wodekuaile/daydayincome/releases)
2. 下载最新版本的 `实时收入-x.x.x.dmg` 文件
3. 双击 DMG 文件，将「实时收入」拖入「应用程序」文件夹
4. 首次打开可能提示"无法验证开发者"，请前往 **系统设置 > 隐私与安全性** 中点击"仍要打开"

### Windows 用户

1. 前往 [Releases 页面](https://github.com/123wodekuaile/daydayincome/releases)
2. 下载最新版本的 `实时收入-Setup-x.x.x.exe` 文件
3. 双击安装程序，按照提示完成安装
4. 安装完成后会自动启动应用

## 🎮 使用说明

### 首次配置

1. 启动应用后，会在桌面右上角显示一个半透明的悬浮窗
2. 鼠标悬停在数字上，会出现「设置」按钮
3. 点击设置按钮，输入你的工资信息：
   - **月薪**：你的月工资（单位：元）
   - **月工作天数**：通常为 22 天
   - **上班时间**：例如 09:30
   - **下班时间**：例如 18:30
4. 点击「保存配置」，开始实时计算！

### 快捷键

- `Cmd+Shift+I` (macOS) / `Ctrl+Shift+I` (Windows) - 快速隐藏/显示窗口

### 交互操作

- **拖拽移动**：鼠标点击悬浮窗的"今日入账"标题区域，可以拖拽移动窗口位置
- **查看人民币**：鼠标悬停在收入数字上，会显示人民币扇形动画
- **修改配置**：悬停在数字上出现设置按钮，点击即可修改
- **退出应用**：在设置窗口中点击「退出应用」

## 🎨 界面预览

应用界面简洁优雅：

- 半透明黑色背景，带有毛玻璃效果
- 金色数字实时跳动
- 人民币扇形展开动画

## 🛠️ 开发相关

### 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 框架
- **Vite** - 构建工具
- **Ant Design** - UI 组件库

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm run dev

# 构建应用
pnpm run build

# 打包 Mac 应用
pnpm exec electron-builder --mac

# 打包 Windows 应用
pnpm exec electron-builder --win
```

### 自动化构建（推荐）

项目已配置 GitHub Actions，无需本地打包环境：

1. **提交代码并创建 Tag**：

   ```bash
   git add .
   git commit -m "feat: 新功能"
   git tag v0.0.1
   git push origin main --tags
   ```

2. **自动打包**：

   - GitHub Actions 会自动在云端打包 Mac 和 Windows 版本
   - 访问仓库的 Actions 标签页查看进度
   - 打包完成后会自动创建 Release 并上传安装包

3. **手动触发打包**：
   - 访问仓库的 Actions 标签页
   - 选择 "Build and Release" workflow
   - 点击 "Run workflow"

### 项目结构

```
dayday-income/
├── .github/
│   └── workflows/
│       └── build.yml     # GitHub Actions 配置
├── electron/             # Electron 主进程
│   └── main.cjs         # 主进程入口
├── src/                 # React 应用
│   ├── App.jsx          # 主组件
│   ├── main.jsx         # React 入口
│   └── assets/          # 资源文件
├── dist/                # 构建产物
└── release/             # 打包产物
```

## ❓ 常见问题

### macOS 提示"无法打开，因为无法验证开发者"

这是因为应用没有经过 Apple 公证。解决方法：

1. 前往 **系统设置 > 隐私与安全性**
2. 找到被阻止的应用，点击「仍要打开」

### Windows Defender 提示风险

这是因为应用没有代码签名证书。解决方法：

1. 点击「更多信息」
2. 点击「仍要运行」

### 收入计算不准确？

请检查：

- 月薪是否输入正确
- 月工作天数是否符合实际
- 上下班时间是否准确

### 应用无法启动？

尝试：

1. 重新下载安装
2. 检查系统版本（macOS 10.13+ / Windows 10+）
3. 查看是否被杀毒软件拦截

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 💡 灵感来源

每天上班，看着时间一分一秒流逝，却感觉不到收获？

这款应用让你**实时看到**工资的增长，把抽象的时间转化为具体的收入数字。每一秒都在赚钱，工作更有动力！

---

⭐ 如果这个项目帮到了你，请给一个 Star 支持一下！
