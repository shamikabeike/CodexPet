# CodexPet · Miao

[简体中文](README.zh-CN.md) · English

[![CI](https://github.com/shamikabeike/CodexPet/actions/workflows/ci.yml/badge.svg)](https://github.com/shamikabeike/CodexPet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-61e8ad.svg)](LICENSE)
[![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-405674.svg)](#install)

Miao is an open-source, cat-head-shaped Windows desktop companion that displays local Codex usage limits and optional weather information. It blinks, occasionally twitches its ears, stays readable from 25% to 150% size, and contains no full-body pet assets.

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
- Shows used and remaining percentages, reset time, approximate time remaining, and account membership status.
- Uses the remaining allowance for warning colors: green at 60%–100%, yellow at 30%–59%, and red below 30%.
- Updates when Codex writes a new usage event, with a 60-second polling fallback.
- Keeps a single cat-head panel—no full-body sprite sheet, second pet window, refresh button, or close button.
- Blinks naturally and performs low-frequency ear twitches while honoring `prefers-reduced-motion`.
- Shows optional city weather, temperature, feels-like temperature, humidity, wind, and a subtle animated weather layer.
- Starts at 50% of the design size and resizes proportionally between 25% and 150%; the smallest sizes use a dedicated readable layout.
- Follows the system language on first launch and supports manual switching between Simplified Chinese and English in the weather settings popover.
- Uses the system tray to show, hide, keep on top, or quit Miao.

## Privacy and data boundaries

Miao has no custom cloud backend and does not need an OpenAI API key.

The Electron main process reads only the tail of recent Codex `rollout-*.jsonl` files under `~/.codex/sessions` and `~/.codex/archived_sessions`. It extracts structured `payload.rate_limits` values and sends only normalized usage numbers to the sandboxed renderer. It does **not** read `auth.json`, prompts, answers, or tool output, and it does not upload Codex session content.

Weather is optional. Miao does not use IP, browser, or Windows geolocation. It contacts [Open-Meteo](https://open-meteo.com/) only after the user saves a city. The resolved city and coordinates stay in Electron's local `userData` directory. Open-Meteo data is available under CC BY 4.0; its free API is intended for non-commercial use.

See [Security Policy](SECURITY.md) and [Architecture](docs/ARCHITECTURE.en.md) for the complete boundary.

## Install

No version tag has been published yet. After the first tagged release, Windows builds will appear on [GitHub Releases](https://github.com/shamikabeike/CodexPet/releases):

- `Miao-<version>-x64-nsis.exe` — installer;
- `Miao-<version>-x64-portable.exe` — portable build.

Unsigned community builds can trigger a Windows SmartScreen “Unknown publisher” warning. Verify that the file came from this repository's Releases page.

After launch:

1. Drag the ears or title area to move Miao.
2. Drag the lower-right resize handle to choose a size from 25% to 150%.
3. Select the weather area to set a city or switch the interface language.
4. Use the tray menu to show, hide, keep on top, or quit Miao.

## Develop locally

Requirements: Windows 10/11, Node.js 24, and npm.

```powershell
git clone https://github.com/shamikabeike/CodexPet.git
cd CodexPet
npm.cmd ci
npm.cmd run dev
```

Opening the Vite page in a browser uses clearly marked demo usage data. Only the Electron window can read local Codex usage events.

Useful commands:

```powershell
npm.cmd run typecheck   # TypeScript checks
npm.cmd test            # Vitest unit tests
npm.cmd run build       # Production build
npm.cmd run verify      # Typecheck + tests + production build
npm.cmd run package:win # NSIS installer + portable executable
```

## Project layout

```text
electron/                 Electron main process, preload, usage and weather adapters
src/                      React UI, localization, animation and shared contracts
docs/screenshots/         Screenshots generated from the current renderer
docs/design/              UI specification
docs/ARCHITECTURE*.md     Chinese and English architecture notes
.github/workflows/        CI and Windows release automation
```

## Known limitations

- Packaged desktop releases currently target Windows only.
- Codex local rollout events are not a public protocol controlled by this project. Upstream format changes may require an adapter update.
- Miao shows demo mode until a valid local rate-limit event exists.
- Open-Meteo's free endpoint has no commercial availability guarantee.
- There is no official OpenAI or Codex integration contract behind this project.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening a pull request or security report.

## License and trademarks

Project code and original assets are licensed under the [MIT License](LICENSE).

Miao and CodexPet are community projects with no affiliation with or endorsement by OpenAI. “Codex”, “OpenAI”, and related product names belong to their respective owners.
