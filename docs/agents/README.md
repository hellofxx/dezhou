# docs/agents — 代理入口与任务路由

> 根 [`AGENTS.md`](../../AGENTS.md) 是项目级唯一约束源；本目录只做**导航**：先按任务定位该读什么、该找哪个代理。

## 任务路由表

| 任务 | 先读 | 负责代理 |
|---|---|---|
| UI / 视觉 / 响应式 | [`DESIGN.md`](../../DESIGN.md) + [`src/guards/README.md`](../../src/guards/README.md) | `ui-ux-dev` |
| 新模块 / 路由 / 跨模块协调 | `AGENTS.md` §代码组织 + [`src/app/routes.tsx`](../../src/app/routes.tsx) | `platform-dev` |
| store / persist / 五大系统 | [`src/features/progress/AGENTS.md`](../../src/features/progress/AGENTS.md) + `store.ts` | `progress-dev` |
| i18n key / 双语同步 | [`src/i18n/moduleRegistry.ts`](../../src/i18n/moduleRegistry.ts) + `docs/PRD.md` §12.4 | 对应 feature dev |
| 守卫 / 质量门禁 | [`src/guards/README.md`](../../src/guards/README.md) + `AGENTS.md` §质量门禁 | `platform-dev` |
| 结构 / 文档 | [`docs/README.md`](../README.md) | `platform-dev` |
| 模块事实（owner / 入口 / store / i18n / 允许边） | [`MODULE_MAP.md`](./MODULE_MAP.md) | 按表中 owner 列 |

## 本目录文件

- [`MODULE_MAP.md`](./MODULE_MAP.md) — **生成物**：模块表、lazy 路由表、已声明 URL、i18n 分组表。由 `scripts/generate-agent-map.mjs` 从代码事实生成，**不要手改**。
- [`behavior.md`](./behavior.md) — 行为准则历史全文；权威版本是根 `AGENTS.md` §行为准则。

## 生成与校验

```powershell
pnpm agents:map        # 重新生成 docs/agents/MODULE_MAP.md
pnpm agents:map:check  # 校验与代码事实一致（CI 与 pre-commit 门禁）
```

改动以下任一文件后必须重新生成，否则 `pnpm verify` 会在 `agents:map:check` 处失败：

- `src/features/` 下模块增删（目录 / `store.ts` 的 persist version）
- `src/app/routes.tsx`（`lazyPage` / `lazyPageWithFeature` 声明、`path:`）
- `src/i18n/moduleRegistry.ts`（`CORE_MODULES` / `FEATURE_GROUPS`）
- `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS`
- `.claude/agents/` 下 `<module>-dev.md` 的增删

## 相关入口

- 根 [`AGENTS.md`](../../AGENTS.md) — 全局约束、质量门禁、提交粒度
- [`docs/README.md`](../README.md) — 文档索引与阅读顺序
- [`.claude/agents/`](../../.claude/agents/) — 各代理定义（文件名 = frontmatter `name`）
