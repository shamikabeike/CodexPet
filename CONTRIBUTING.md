# 参与贡献

[English](#contributing-in-english) · 中文

感谢你愿意给码喵添猫粮。提交改动前，请先确认它没有扩大本地数据读取范围，也没有破坏猫头额度面板的单一形态。

## 本地开发

```powershell
npm.cmd install
npm.cmd run dev
```

提交前运行完整检查：

```powershell
npm.cmd run verify
```

## Pull Request 约定

1. 一个 PR 只解决一个清晰问题。
2. UI 改动请附猫头额度面板截图，并确认没有引入独立全身宠物或第二种窗口形态。
3. 额度解析改动必须补测试；禁止读取 `auth.json`、提示词正文或其他与额度无关的数据。
4. 摇耳与眨眼应低频、自然，并遵守系统“减少动态效果”设置。
5. 新依赖应说明必要性，避免把常驻桌面面板养成内存大户。

## 提交信息

推荐使用简洁的 Conventional Commits 风格，例如：

- `feat: add compact quota indicators`
- `fix: handle missing secondary limit`
- `docs: explain local session adapter`

## 设计资料

视觉改动应先更新 `docs/design/UI_SPEC.md`，再修改实现。生成素材不得包含真实账户信息、可读令牌或未经授权的商标素材。

---

## Contributing in English

Thank you for helping Miao. Keep the project focused on one cat-head usage panel and do not widen its local data access without an explicit design and security review.

### Local development

```powershell
npm.cmd ci
npm.cmd run dev
```

Run the full check before submitting:

```powershell
npm.cmd run verify
```

### Pull request rules

1. Keep each pull request focused on one clear problem.
2. Include cat-head panel screenshots for UI changes. Do not add a full-body pet or second window mode.
3. Add tests for usage parsing changes. Never read `auth.json`, prompt text, answer text, or unrelated session data.
4. Keep ear and blink motion subtle and honor `prefers-reduced-motion`.
5. Explain every new dependency; Miao is a persistent desktop panel, so bundle and memory cost matter.
6. Add both Chinese and English UI strings for new user-visible behavior.

Prefer concise Conventional Commit messages, such as `feat: add compact quota indicators`, `fix: handle missing secondary limit`, or `docs: explain local session adapter`.

Update `docs/design/UI_SPEC.md` before making a visual change. Generated material must not contain real account data, readable tokens, or unauthorized trademark assets.
