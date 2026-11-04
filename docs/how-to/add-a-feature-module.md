# 新增 Feature 模块

> 状态：Current · 最后复核：2026-11-04
> 适用：新增 `src/features/<module>/` 业务模块。规则源：`AGENTS.md` §代码组织 / §Agent 协作。

## 前置阅读

- `AGENTS.md` — 模块边界、关键约束、质量门禁
- `docs/AI_GUIDE.md` — 编码 / 状态 / i18n / UI 规范
- `docs/agents/MODULE_MAP.md` — 现有模块的 owner / 入口 / store / i18n / 允许边

## 步骤

1. **建模块目录**：`src/features/<module>/` 至少包含 `components/`、`store.ts`、`types.ts`、`index.ts`；`hooks/`、`utils/`、`data/` 按需。纯静态模块可豁免 `store.ts`，但需在模块代理文件中声明。
2. **实现模块**：只改本模块文件；跨模块引用必须走 `shared/`、`progress` 公开 API 或 `trainingEvents`，不得直接 import 其他 feature。新增 `shared/` 代码须满足 ≥2 模块消费。
3. **接入 i18n**：在 `src/i18n/moduleRegistry.ts` 同步 `I18nModuleKey` / `ALL_MODULES` / `FEATURE_GROUPS`；新增 `src/i18n/locales/zh/<module>.json` 与 `en/<module>.json`，key 命名 `<module>.<context>.<field>`。仅首屏必需的模块才加入 `CORE_MODULES`。
4. **接入路由**：由 `platform-dev` 在 `src/app/routes.tsx` 用 `React.lazy()` + `<LazyWrapper>` 注册；`lazyPage` 会并行预加载该路由的 i18n 分组。
5. **创建代理**：复制 `docs/agents/TEMPLATE-dev.md` 为 `.claude/agents/<module>-dev.md`，文件名 = frontmatter `name`；在同一提交内完成模块与代理的 1:1 绑定。
6. **补测试**：按 `docs/how-to/add-or-update-tests.md` 选择 unit / component；持久化 store 必须有 `store.persist-shape.test.ts`（version > 1 还需 `store.migrate.test.ts`）。
7. **更新机器地图**：运行 `pnpm agents:map`，提交生成的 `docs/agents/MODULE_MAP.md`。
8. **文档与变更记录**：更新 `docs/agents/README.md` 的代理清单；在 `docs/CHANGELOG.md` 记录模块新增；如涉及架构决策，新增 ADR。

## 跨模块边（确有必要时）

1. 先评估能否用 `shared/`、`progress` 公开 API 或 `trainingEvents` 解决。
2. 确需新增 import 边时，在 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 登记，并同步 `src/guards/eslintCrossImports.test.ts` 的精确快照。
3. 白名单原则是「收紧时只删不加」；新增边必须有明确理由，并在 ADR 或 CHANGELOG 记录。

## 验收

```powershell
pnpm agents:map
pnpm verify
```

- [ ] 模块最小结构齐全，未直接 import 其他 feature
- [ ] zh / en i18n 双语齐备，`localeParity` 通过
- [ ] 路由已 lazy 包裹，i18n 分组正确
- [ ] `.claude/agents/<module>-dev.md` 已创建
- [ ] `MODULE_MAP.md` 已重新生成
- [ ] `pnpm verify` 全绿
