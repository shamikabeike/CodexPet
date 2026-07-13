# 安全策略

[English](#security-policy-in-english) · 中文

## 支持范围

安全修复优先覆盖最新发布版本。尚未发布的开发分支可能随时调整本地 Codex 事件适配器。

## 报告漏洞

请使用 GitHub 仓库的 **Security → Report a vulnerability** 私密报告功能，不要把令牌、会话内容、个人路径或可复现的敏感数据贴到公开 Issue。

报告最好包含：

- 受影响版本与 Windows 版本；
- 可复现步骤；
- 实际影响；
- 已做脱敏的日志片段；
- 建议修复方式（如有）。

## 隐私边界

Miao 只在 Electron 主进程中读取本机 Codex 会话尾部的结构化额度事件，渲染进程只接收百分比、窗口时长、重置时间、套餐、模型名与更新时间。项目明确禁止：

- 读取或上传 `~/.codex/auth.json`；
- 读取提示词、回复正文或工具输出作为产品数据；
- 向第三方服务发送本地 Codex 会话内容；
- 在渲染进程开放任意文件系统或命令执行能力。

天气功能是唯一可选外部网络能力：

- 不使用 IP 定位、浏览器定位或 Windows 定位权限；
- 只有用户主动保存城市后，主进程才向 Open-Meteo 发送城市名称和解析后的经纬度；
- 城市配置仅写入 Electron `userData/weather-location.json`，不会与 Codex 会话数据合并；
- 渲染进程不能直接访问任意网络地址，只能调用固定天气 IPC；
- 不向天气服务发送 Codex 额度、模型、会话路径或任何会话内容。

---

## Security policy in English

### Supported versions

Security fixes prioritize the latest released version. Unreleased development branches can change the local Codex event adapter at any time.

### Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** private reporting flow. Do not post tokens, session contents, personal paths, or sensitive reproduction data in a public issue.

Include the affected Miao and Windows versions, reproduction steps, practical impact, redacted logs, and a suggested fix when available.

### Privacy boundary

Miao reads only structured rate-limit events from the tail of local Codex session files in the Electron main process. The renderer receives percentages, window duration, reset time, plan, model, and observation time. The project must never:

- read or upload `~/.codex/auth.json`;
- consume prompts, answers, or tool output as product data;
- send local Codex session content to third parties;
- expose arbitrary filesystem or command execution to the renderer.

Weather is the only optional external network feature. It starts only after the user saves a city, stores configuration in local Electron `userData`, restricts the renderer to fixed weather IPC methods, and never sends Codex data to the weather provider.
