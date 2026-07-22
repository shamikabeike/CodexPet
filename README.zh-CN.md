# CodexPet · Miao

简体中文 · [English](README.md)

[![CI](https://github.com/shamikabeike/CodexPet/actions/workflows/ci.yml/badge.svg)](https://github.com/shamikabeike/CodexPet/actions/workflows/ci.yml)
[![许可证：MIT](https://img.shields.io/badge/License-MIT-61e8ad.svg)](LICENSE)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-405674.svg)](#安装)
[![macOS](https://img.shields.io/badge/macOS-14%2B-405674.svg)](#安装)

Miao 是一只开源的 Windows 与 macOS 桌面猫咪：它只保留猫头形额度面板，显示本机 Codex 额度与可选天气信息，会自然眨眼、偶尔摇耳，并能在 25%–150% 尺寸下保持可读。项目不包含任何全身宠物动画资产。

## 当前界面

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/miao-zh-cn.png" alt="Miao 当前简体中文界面"><br><sub>简体中文 · 100% 展示</sub></td>
    <td align="center"><img src="docs/screenshots/miao-en-us.png" alt="Miao 当前英文界面"><br><sub>English · 100% 展示</sub></td>
  </tr>
</table>

<p align="center"><img src="docs/screenshots/miao-compact.png" alt="Miao 当前紧凑布局" width="240"><br><sub>25%–36% 使用的紧凑布局</sub></p>

以上截图由当前 `main` 分支渲染，并明确使用演示数据；安装后的 Electron 窗口会读取本机 Codex 事件，并把“演示账号”替换为检测到的会员状态。为方便在文档中看清细节，截图采用 100% 展示，应用实际默认窗口为 `260×230`（50%）。

> Miao 是独立的 Electron 桌面伴侣，不是 OpenAI 官方产品、Codex 官方插件，也不会修改 Codex 桌面软件。

## 功能

- 只显示最新本地 Codex 事件中实际存在的额度周期。因此当前截图只有一条 7 天额度，不伪造第二条占位；以后周期增减也按事件动态适配。
- 显示已用/剩余百分比、重置时间、可用重置次数、约剩余时长和账号会员状态。
- 以剩余额度显示警示色：60%–100% 绿色、30%–59% 黄色、低于 30% 红色。
- 通过本机 Codex App Server 的只读额度接口同步，Codex 会话变化时触发刷新，并保留 60 秒轮询兜底。
- 始终只有一个猫头额度面板，没有全身精灵图、第二宠物窗口、刷新按钮或关闭按钮。
- 猫眼自然眨动、猫耳低频轻摇，并遵守系统“减少动态效果”设置。
- 可选显示城市天气、气温、体感温度、湿度、风速和轻量动态天气图层。
- 默认以设计尺寸的 50% 启动，可在 25%–150% 间等比缩放；最小尺寸使用单独的大字排版。
- 首次启动跟随系统语言，可在天气设置弹层中手动切换简体中文或英语，选择会保存在本机。
- 使用无文字、无天气信息的 Miao 猫头系统托盘图标，可显示、隐藏、置顶或退出 Miao。

## 隐私与数据边界

Miao 没有自建云端服务，也不需要 OpenAI API Key。

Electron 主进程优先启动本机 Codex 随附的 App Server，只调用只读的 `account/rateLimits/read`，取得额度和可用重置次数；它不会调用“消耗重置次数”接口。查询不可用时才读取 `~/.codex/sessions` 与 `~/.codex/archived_sessions` 中最近 `rollout-*.jsonl` 的额度对象作为后备。Miao **不会**读取 `auth.json`、提示词、回答或工具输出，也不会上传 Codex 会话内容；本机 Codex 子进程自行复用已有登录状态。

天气是可选功能。Miao 不使用 IP、浏览器或操作系统定位；只有用户主动保存城市后，才会访问 [Open-Meteo](https://open-meteo.com/)。城市与坐标仅保存在 Electron 本地 `userData` 目录。Open-Meteo 数据采用 CC BY 4.0 许可，其免费接口主要面向非商业使用。

完整边界见[安全策略](SECURITY.md)和[技术架构](docs/ARCHITECTURE.md)。

## 安装

当前桌面正式版为 [Miao v0.2.0](https://github.com/shamikabeike/CodexPet/releases/tag/v0.2.0)：

- [`Miao-0.2.0-x64-nsis.exe`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-x64-nsis.exe)：Windows 安装版；
- [`Miao-0.2.0-x64-portable.exe`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-x64-portable.exe)：Windows 便携版；
- [`Miao-0.2.0-mac-x64.dmg`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-mac-x64.dmg)：macOS Intel 芯片版；
- [`Miao-0.2.0-mac-arm64.dmg`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-mac-arm64.dmg)：macOS Apple 芯片版（M1 及更新芯片）；
- [`SHA256SUMS.txt`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/SHA256SUMS.txt)：全部发行文件的 SHA-256 校验清单。

社区开源构建没有商业代码签名。Windows SmartScreen 可能提示“未知发布者”；macOS 用户挂载 DMG 并把 Miao 拖入“应用程序”后，首次启动请按住 Control 点击 Miao，选择“打开”。若仍被 Gatekeeper 拦截，请到“系统设置 → 隐私与安全性 → 仍要打开”。请确认文件来自本仓库 Releases 页面。

Miao 会从已安装的 Codex/新版 ChatGPT 桌面应用、`CODEX_HOME` 和 `PATH` 中寻找本机 Codex。请先登录 Codex 再启动 Miao；只读 App Server 查询不可用时，会后备读取最近的本地额度事件。

首次启动后：

1. 拖动猫耳或标题区域调整位置。
2. 拖动右下角缩放手柄，在 25%–150% 范围内选择尺寸。
3. 点击天气区域设置城市或切换界面语言。
4. 在系统托盘中显示、隐藏、置顶或退出 Miao。

## 本地开发

要求：Windows 10/11 或 macOS 14+、Node.js 24 和 npm。

```powershell
git clone https://github.com/shamikabeike/CodexPet.git
cd CodexPet
npm ci
npm run dev
```

Windows PowerShell 若因脚本策略无法运行 `npm`，请改用 `npm.cmd`。

浏览器直接打开 Vite 页面时会使用明确标记的演示额度；只有 Electron 窗口能读取本机 Codex 额度事件。

常用命令：

```powershell
npm run typecheck          # TypeScript 检查
npm test                   # Vitest 单元测试
npm run build              # 生产构建
npm run verify             # 类型检查 + 测试 + 生产构建
npm run screenshots:generate # 构建并生成三张当前界面截图
npm run package:win        # Windows NSIS 安装包 + 便携版
npm run package:mac:intel  # macOS Intel DMG（需在 macOS 执行）
npm run package:mac:arm64  # macOS Apple 芯片 DMG（需在 macOS 执行）
```

## 项目结构

```text
electron/                 Electron 主进程、preload、额度与天气适配器
src/                      React UI、双语、动画和共享契约
docs/screenshots/         由当前渲染器生成的界面截图
docs/design/              UI 规格
docs/ARCHITECTURE*.md     中英文架构说明
.github/workflows/        CI 与多平台 Release 自动化
```

## 已知边界

- Windows 与 macOS 发行包均为未签名的社区构建。两个 macOS DMG 分别在 GitHub 的 Intel 与 Apple 芯片执行器上原生构建，但尚未使用 Apple Developer ID 公证。
- Codex App Server 与本地 rollout 后备格式可能随 Codex 版本变化，上游变化时可能需要更新适配器；旧版本不返回重置次数时会显示 `—`。
- 本机尚无合法额度事件时，Miao 会明确显示演示模式。
- Open-Meteo 免费接口不提供商业可用性保证。
- 本项目使用 Codex App Server 的本机接口，但项目本身仍不是 OpenAI 官方产品或官方插件。

## 参与项目

提交 Pull Request 或安全报告前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)、[SECURITY.md](SECURITY.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 许可证与商标

项目代码和自有素材采用 [MIT License](LICENSE)。

Miao 与 CodexPet 是社区开源项目，与 OpenAI 无隶属或官方背书关系。“Codex”“OpenAI”及相关产品名称归其各自权利人所有。
