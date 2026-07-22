# CodexPet · Miao

[简体中文](README.zh-CN.md) · English

[![CI](https://github.com/shamikabeike/CodexPet/actions/workflows/ci.yml/badge.svg)](https://github.com/shamikabeike/CodexPet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-61e8ad.svg)](LICENSE)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-405674.svg)](#install)
[![macOS](https://img.shields.io/badge/macOS-14%2B-405674.svg)](#install)

Miao is an open-source, cat-head-shaped Windows and macOS desktop companion that displays local Codex usage limits and optional weather information. It blinks, occasionally twitches its ears, stays readable from 25% to 150% size, and contains no full-body pet assets.

## Current interface

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/miao-zh-cn.png" alt="Current Miao interface in Simplified Chinese"><br><sub>Simplified Chinese · 100% view</sub></td>
    <td align="center"><img src="docs/screenshots/miao-en-us.png" alt="Current Miao interface in English"><br><sub>English · 100% view</sub></td>
  </tr>
</table>

<p align="center"><img src="docs/screenshots/miao-compact.png" alt="Current Miao compact layout" width="240"><br><sub>Compact layout used at 25%–36%</sub></p>

These screenshots are generated from the current `main` renderer with clearly labeled demo data. The installed Electron app reads local Codex events and replaces `Demo account` with the detected membership status. Screenshots use a 100% view for documentation clarity; the actual window starts at `260×230` (50%).

> Miao is an independent Electron companion app. It is not an OpenAI product, an official Codex plugin, or a modification of the Codex desktop app.

## Features

- Displays only the quota windows present in the latest local Codex event. The current screenshots therefore show one seven-day window and no invented secondary placeholder; future window changes are handled dynamically.
- Shows used and remaining percentages, reset time, available reset count, approximate time remaining, and account membership status.
- Uses the remaining allowance for warning colors: green at 60%–100%, yellow at 30%–59%, and red below 30%.
- Syncs through the local Codex App Server's read-only rate-limit method, refreshes after Codex session changes, and keeps a 60-second polling fallback.
- Keeps a single cat-head panel—no full-body sprite sheet, second pet window, refresh button, or close button.
- Blinks naturally and performs low-frequency ear twitches while honoring `prefers-reduced-motion`.
- Shows optional city weather, temperature, feels-like temperature, humidity, wind, and a subtle animated weather layer.
- Starts at 50% of the design size and resizes proportionally between 25% and 150%; the smallest sizes use a dedicated readable layout.
- Follows the system language on first launch and supports manual switching between Simplified Chinese and English in the weather settings popover.
- Uses a dedicated text-free Miao cat-head system-tray icon to show, hide, keep on top, or quit Miao.

## Privacy and data boundaries

Miao has no custom cloud backend and does not need an OpenAI API key.

The Electron main process first starts the local Codex App Server and calls only the read-only `account/rateLimits/read` method for usage and available reset count. It never calls the reset-consumption method. If that query is unavailable, Miao falls back to structured rate-limit objects in recent `rollout-*.jsonl` files. Miao does **not** read `auth.json`, prompts, answers, or tool output, and it does not upload Codex session content; the local Codex child process reuses the existing login itself.

Weather is optional. Miao does not use IP, browser, or operating-system geolocation. It contacts [Open-Meteo](https://open-meteo.com/) only after the user saves a city. The resolved city and coordinates stay in Electron's local `userData` directory. Open-Meteo data is available under CC BY 4.0; its free API is intended for non-commercial use.

See [Security Policy](SECURITY.md) and [Architecture](docs/ARCHITECTURE.en.md) for the complete boundary.

## Install

The current desktop release is [Miao v0.2.0](https://github.com/shamikabeike/CodexPet/releases/tag/v0.2.0):

- [`Miao-0.2.0-x64-nsis.exe`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-x64-nsis.exe) — Windows installer;
- [`Miao-0.2.0-x64-portable.exe`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-x64-portable.exe) — Windows portable build;
- [`Miao-0.2.0-mac-x64.dmg`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-mac-x64.dmg) — macOS Intel;
- [`Miao-0.2.0-mac-arm64.dmg`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/Miao-0.2.0-mac-arm64.dmg) — macOS Apple Silicon (M1 or newer);
- [`SHA256SUMS.txt`](https://github.com/shamikabeike/CodexPet/releases/download/v0.2.0/SHA256SUMS.txt) — checksums for every release asset.

These community builds are not commercially code-signed. Windows may show a SmartScreen “Unknown publisher” warning. On macOS, mount the DMG, drag Miao to Applications, then Control-click Miao and choose **Open** the first time. If Gatekeeper still blocks it, use **System Settings → Privacy & Security → Open Anyway**. Verify that every file came from this repository's Releases page.

Miao looks for the local Codex executable in the installed Codex/ChatGPT desktop app, `CODEX_HOME`, and `PATH`. Sign in to Codex before launching Miao; if the read-only App Server cannot be queried, Miao falls back to recent local rate-limit events.

After launch:

1. Drag the ears or title area to move Miao.
2. Drag the lower-right resize handle to choose a size from 25% to 150%.
3. Select the weather area to set a city or switch the interface language.
4. Use the tray menu to show, hide, keep on top, or quit Miao.

## Develop locally

Requirements: Windows 10/11 or macOS 14+, Node.js 24, and npm.

```powershell
git clone https://github.com/shamikabeike/CodexPet.git
cd CodexPet
npm ci
npm run dev
```

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks the npm shim.

Opening the Vite page in a browser uses clearly marked demo usage data. Only the Electron window can read local Codex usage events.

Useful commands:

```powershell
npm run typecheck          # TypeScript checks
npm test                   # Vitest unit tests
npm run build              # Production build
npm run verify             # Typecheck + tests + production build
npm run screenshots:generate # Build and capture the current three UI screenshots
npm run package:win        # Windows NSIS installer + portable executable
npm run package:mac:intel  # macOS Intel DMG (run on macOS)
npm run package:mac:arm64  # macOS Apple Silicon DMG (run on macOS)
```

## Project layout

```text
electron/                 Electron main process, preload, usage and weather adapters
src/                      React UI, localization, animation and shared contracts
docs/screenshots/         Screenshots generated from the current renderer
docs/design/              UI specification
docs/ARCHITECTURE*.md     Chinese and English architecture notes
.github/workflows/        CI and multi-platform release automation
```

## Known limitations

- Windows and macOS packages are unsigned community builds. The macOS DMGs are built natively on Intel and Apple Silicon GitHub runners, but they are not notarized with an Apple Developer ID.
- Codex App Server and the local rollout fallback can change with Codex versions. Older versions that omit reset credits display `—` and may require an adapter update after upstream changes.
- Miao shows demo mode until a valid local rate-limit event exists.
- Open-Meteo's free endpoint has no commercial availability guarantee.
- Miao uses the local Codex App Server interface, but remains an unofficial community project rather than an OpenAI product or official plugin.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request or security report.

## License and trademarks

Project code and original assets are licensed under the [MIT License](LICENSE).

Miao and CodexPet are community projects with no affiliation with or endorsement by OpenAI. “Codex”, “OpenAI”, and related product names belong to their respective owners.
