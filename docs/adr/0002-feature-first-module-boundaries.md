# ADR-0002: Feature-first + 单向跨模块边界

- 状态：Accepted
- 日期：2026-11-04

## Context

项目有 10 个业务模块，课程与题库内容量大，且由多个 AI 代理并行维护。若允许模块间自由引用，内容改动、状态写入与 UI 复用会迅速形成环形依赖，AI 也难以判断文件归属。

## Decision

- 每个 feature 自包含：`components/` / `hooks/` / `utils/` / `data/` / `store.ts` / `types.ts` / `index.ts`（纯静态模块可豁免 store）。
- `shared/` 只接收被 ≥2 个模块使用的代码；单模块代码留在模块内。
- 跨模块只允许两种通道：引用 `progress` 的公开 API，或经 `trainingEvents` 事件总线；允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源，收紧时只删不加。
- 数据源采用注册表倒置（`academyDataSourceRegistry` / `achievementRegistry`），避免 progress 反向依赖学院模块。
- 每个 feature 与 `.claude/agents/<module>-dev.md` 1:1 绑定；模块增删同步 `docs/agents/MODULE_MAP.md`。

## Consequences

- 模块边界清晰，AI 可按目录归属判断改动范围；`progress` 成为跨模块状态中枢。
- 新增跨模块边必须改白名单并更新守卫快照，成本高，能有效阻止随意耦合。
- `shared/` 的准入门槛需要持续守卫；单消费者组件应下沉回模块。
- 新增模块的完整步骤见 `docs/how-to/add-a-feature-module.md`。

## References

- `AGENTS.md` — 代码组织、关键约束、Agent 协作
- `eslint.config.js` — `ALLOWED_CROSS_IMPORTS`
- `src/guards/eslintCrossImports.test.ts` / `src/features/eslint-guard-dependency-graph.test.ts`
- `docs/agents/MODULE_MAP.md`
