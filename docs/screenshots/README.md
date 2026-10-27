# Screenshot maintenance / 截图维护

These files are product evidence, not concept art. They must be regenerated from the current renderer whenever the visible UI changes.

这些文件是当前产品界面的证据，不是概念稿。任何可见 UI 变化都必须在同一提交中重新生成受影响的截图。

| File | Route | Viewport | Expected layout |
| --- | --- | --- | --- |
| `miao-zh-cn.png` | `/?lang=zh&with-5h=1` | `520×460` | Chinese, full, five-hour and seven-day demo quotas |
| `miao-en-us.png` | `/?lang=en&with-5h=1` | `520×460` | English, full, five-hour and seven-day demo quotas |
| `miao-compact.png` | `/?lang=zh&with-5h=1` | `240×160` | Chinese compact two-quota layout, about 35% scale |

Before committing screenshots:

1. Run `npm.cmd run screenshots:generate`; the script builds the current renderer and captures all three routes at their exact viewport sizes.
2. Confirm the page title, DOM text, layout mode, and zero relevant console errors.
3. Confirm demo data is visibly labeled `演示账号` or `Demo account`.
4. Check for clipping and overflow, especially in the compact layout.
5. Update both root README files and remove superseded images in the same commit.

The browser preview uses a dark neutral background only to make the transparent cat outline readable in repository documentation. Electron keeps the real desktop area transparent.
