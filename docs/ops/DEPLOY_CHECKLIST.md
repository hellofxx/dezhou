# GitHub Pages 部署检查清单

> 状态：Current · 最后复核：2026-11-04
> 适用：GitHub Pages 项目页 `/dezhou/` 子路径。流水线定义以 `.github/workflows/deploy.yml` 与 `.github/workflows/ci.yml` 为准。

## 1. 触发与门禁

| 场景 | 工作流 | 门禁序列 |
|---|---|---|
| push `main` | `deploy.yml` | install → typecheck → lint → repo:check → docs:check → agents:map:check → test → build → size:check → SPA fallback → upload → deploy |
| PR / 非 `main` push | `ci.yml` | install → verify → build → size:check |

`pnpm verify` 的唯一定义以 `package.json` 为准（当前为 `typecheck && lint && repo:check && docs:check && agents:map:check && test`）。

## 2. 发布前本地检查

```powershell
pnpm install --frozen-lockfile
pnpm verify
pnpm build
pnpm size:check
```

- `vite.config.ts` 的 `base` 必须为 `'/dezhou/'`；路由 `basename` 使用 `import.meta.env.BASE_URL`。
- **不要提交 `dist/`**：它已在 `.gitignore` 中忽略；`404.html` 由 CI 在构建后执行 `cp dist/index.html dist/404.html` 生成。
- 改动路由 / 模块 / i18n 注册表后，先运行 `pnpm agents:map` 并提交更新后的 `docs/agents/MODULE_MAP.md`。
- 改动持久化 schema 时，按 `docs/AI_GUIDE.md` 的 persist 规则递增 version + 编写 migrate。

## 3. 发布后验证

- [ ] 首页 `https://<username>.github.io/dezhou/` 正常加载。
- [ ] 深层路由刷新不 404（例如 `/dezhou/academy/lesson/<id>`）。
- [ ] Network 面板无 JS / CSS / 字体 / 图标 404。
- [ ] 中英文切换正常，无原始 i18n key。
- [ ] Service Worker 更新后，硬刷新或清缓存可加载新版本。

## 4. 回滚

1. 优先在 GitHub Actions 中重跑上一个成功的 deploy workflow。
2. 若问题来自代码，`git revert <commit>` 后 push `main`，由流水线重新发布。
3. 不要在本地修改 `dist/`、手改 Pages 产物或绕过门禁直接发布。

## 5. 排障

- **Actions 失败**：先看失败步骤日志；本地用 `pnpm verify` / `pnpm build` 复现。
- **页面白屏**：检查 `base` 与资源路径、Network 404、Service Worker 缓存。
- **深层路由 404**：确认 CI 生成了 `dist/404.html`，且 Pages Source 为 `GitHub Actions`。
- **体积门禁失败**：查看 `pnpm size:check` 的 Top chunk 列表；不要在未分析的情况下抬高 `BUDGETS`。
- 历史诊断记录：[`../history/ops/github-actions-diagnosis-2026-09-24.md`](../history/ops/github-actions-diagnosis-2026-09-24.md)。
