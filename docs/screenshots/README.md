# Screenshot maintenance / 截图维护

These files are product evidence, not concept art. They must be regenerated from the current renderer whenever the visible UI changes.

这些文件是当前产品界面的证据，不是概念稿。任何可见 UI 变化都必须在同一提交中重新生成受影响的截图。

| File | Route | Viewport | Expected layout |
| --- | --- | --- | --- |
| `miao-zh-cn.png` | `/?lang=zh` | `520×460` | Chinese, full, one seven-day demo quota |
| `miao-en-us.png` | `/?lang=en` | `520×460` | English, full, one seven-day demo quota |
| `miao-compact.png` | `/?lang=zh` | `240×160` | Chinese compact layout, about 35% scale |

Before committing screenshots:

1. Run the current Vite dev server without `with-5h`.
2. Confirm the page title, DOM text, layout mode, and zero relevant console errors.
3. Confirm demo data is visibly labeled `演示账号` or `Demo account`.
4. Check for clipping and overflow, especially in the compact layout.
5. Update both root README files and remove superseded images in the same commit.

The browser preview uses a dark neutral background only to make the transparent cat outline readable in repository documentation. Electron keeps the real desktop area transparent.
