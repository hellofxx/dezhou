# 德州扑克训练平台（PokerLab）

纯前端、零后端依赖的德州扑克系统性训练工具。通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家提升决策能力。

## 核心功能

- **范围训练（Range Trainer）**：13×13 范围网格、位置渐进解锁
- **GTO 模拟器**：Web Worker 计算卸载、EV 损失分析
- **赔率计算器**：Rule of 2 and 4、隐含赔率估算
- **策略学院**：三段式互动教学、Drill 题库系统
- **理论学院**：T1-T9 完整体系、游戏变体（短牌 / 单挑）支持
- **每日谜题**：日期种子确定性题目流
- **手牌复盘**：IndexedDB 存储、多格式解析
- **帮助中心**：快速上手、模块教程、概念卡片与 FAQ

## 快速开始

### 环境要求

- **Node.js 22**（以 `.nvmrc` 为唯一事实源）
- **pnpm 11.18.0**（以 `package.json` 的 `packageManager` 为唯一事实源）

### 安装与启动

```powershell
git clone <repository-url>
cd dezhou
pnpm install
pnpm dev
```

### 常用命令

```powershell
pnpm dev             # 开发服务器
pnpm build           # tsc -b && vite build
pnpm preview         # 预览生产构建
pnpm typecheck       # 类型检查
pnpm lint            # ESLint
pnpm test            # 全量测试
pnpm test:unit       # 仅 unit 项目
pnpm test:component  # 仅 component 项目
pnpm test:guards     # 全局守卫 + i18n + 跨模块守卫
pnpm test:coverage   # 覆盖率报告（非门禁）
pnpm verify          # typecheck + lint + repo:check + docs:check + agents:map:check + test
pnpm verify:parallel # 并行变体
pnpm size:check      # 构建产物体积门禁
pnpm repo:check      # 仓库卫生检查
pnpm docs:check      # 文档链接 / 内联路径 / 锚点 / 新鲜度 / 索引 / 状态
pnpm agents:map      # 重新生成 docs/agents/MODULE_MAP.md
pnpm agents:map:check  # 校验模块地图与代码事实一致
```

## 质量门禁

`pnpm verify` 是提交前唯一入口，当前序列为：

```text
typecheck → lint → repo:check → docs:check → agents:map:check → test
```

CI 的 `ci.yml` 在 PR / 非 `main` 分支执行 `verify → build → size:check`；`deploy.yml` 在 push `main` 时执行完整门禁并发布 GitHub Pages。发布与回滚见下文。

## 部署与回滚

适用 GitHub Pages 项目页 `/dezhou/`。流水线定义以 `.github/workflows/ci.yml` 与 `.github/workflows/deploy.yml` 为准。

### 触发与门禁

| 场景 | 工作流 | 门禁序列 |
|---|---|---|
| push `main` | `deploy.yml` | install → verify → build → size:check → E2E（typecheck / lint / Chromium / test）→ SPA fallback → upload → deploy |
| PR / 非 `main` push | `ci.yml` | install → verify → build → size:check → E2E |

`pnpm verify` 的唯一定义以 `package.json` 为准；E2E 跑生产构建（`vite preview`），失败即不可发布。

### 发布前本地检查

```powershell
pnpm install --frozen-lockfile
pnpm verify
pnpm build
pnpm size:check
pnpm exec playwright install chromium
pnpm typecheck:e2e
pnpm exec eslint e2e playwright.config.ts
pnpm test:e2e
```

等价一条命令：`pnpm verify:e2e`。失败即视为不可发布；trace / screenshot 在 `test-results/`，HTML 报告在 `playwright-report/`，禁止用重试或放宽断言放行。

- `vite.config.ts` 的 `base` 必须为 `/dezhou/`；路由 `basename` 使用 `import.meta.env.BASE_URL`。
- 不提交 `dist/`；`404.html` 由 CI 在构建后生成。
- 路由 / 模块 / i18n 注册表变更后先运行 `pnpm agents:map` 并提交更新后的 `docs/agents/MODULE_MAP.md`。
- 持久化 schema 变更按 `docs/TDD.md` §16「状态管理」递增 version + 编写 migrate。

### 发布后验证

- [ ] 首页正常加载；深层路由刷新不 404。
- [ ] Network 面板无 JS / CSS / 字体 / 图标 404。
- [ ] 中英文切换正常，无原始 i18n key。
- [ ] Service Worker：关闭站点所有标签页后重新打开即加载新版本，无需硬刷新或清缓存。
- [ ] 离线：首次打开完成预缓存后，断网直接访问未访问过的深层路由正常渲染。`e2e/offline.test.ts` 覆盖 `/dezhou/help`；课程深链与真实 Pages 环境仍需人工复核。

### 回滚

1. 优先在 GitHub Actions 中重跑上一个成功的 deploy workflow。
2. 若问题来自代码，`git revert <commit>` 后 push `main`，由流水线重新发布。
3. 不在本地修改 `dist/`、手改 Pages 产物或绕过门禁直接发布。

### 排障

- **Actions 失败**：先看失败步骤日志；本地用 `pnpm verify` / `pnpm build` 复现。
- **页面白屏**：检查 `base` 与资源路径、Network 404、Service Worker 缓存。
- **深层路由 404**：确认 CI 生成了 `dist/404.html`，且 Pages Source 为 `GitHub Actions`。
- **体积门禁失败**：查看 `pnpm size:check` 的 Top chunk；不要在未分析的情况下抬高 `BUDGETS`。
- **E2E 失败**：先看 `test-results/**/trace.zip` 与 `playwright-report/`；本地复现用 `pnpm build; pnpm test:e2e`。

## Git Hooks（可选，建议启用）

```powershell
git config core.hooksPath .git-hooks
```

`pre-commit` 是**阻断式**门禁（fail-closed）：

- 任意 `.ts / .tsx / .js / .jsx` 变更触发 ESLint；
- 任意 `.md` 变更触发文档检查；
- 路由 / 模块 / i18n 注册表变更触发 `agents:map:check`。

详细说明见 [`.git-hooks/README.md`](./.git-hooks/README.md)。

## 文档

| 文档 | 描述 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | AI 代理唯一约束源：任务路由、架构约束、质量门禁 |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 贡献流程入口（约束、命令、所有权、文档变更） |
| [`SECURITY.md`](./SECURITY.md) | 安全策略与漏洞报告 |
| [`docs/README.md`](./docs/README.md) | 文档索引与 Current / Historical 状态约定 |
| [`docs/PRD.md`](./docs/PRD.md) | 产品规格（What / Why） |
| [`docs/TDD.md`](./docs/TDD.md) | 技术设计（How；含课程 IA、工程规范、测试体系） |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | 架构决策记录（ADR） |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 版本演进记录（当月） |
| [`DESIGN.md`](./DESIGN.md) | UI/UX 设计语言规范（唯一设计契约） |
| [`docs/agents/MODULE_MAP.md`](./docs/agents/MODULE_MAP.md) | 生成的模块 / 路由 / i18n 地图（勿手改） |

设计参考原型：[`poker-ui-demo/pages/index.html`](./poker-ui-demo/pages/index.html)。

## 架构概览

- **纯前端架构**：React 19 + TypeScript 7 + Vite 8
- **状态管理**：Zustand 5（persist + IndexedDB）
- **测试**：Vitest（unit + component 双项目）
- **国际化**：i18next（中英双语，路由级懒加载）
- **质量门禁**：ESLint + TypeScript strict + pnpm verify

## AI 代理协作

项目不维护自带子代理文件，执行层由全栈开发组插件代理按技能派单（派单与会诊、实现下沉、出图、质量、发布），项目内职责以**文件所有权**表达：

- **模块层**：`src/features/<module>/**` 归各模块，机器事实见 [`docs/agents/MODULE_MAP.md`](./docs/agents/MODULE_MAP.md)
- **共享层**：`src/shared/**` 需 ≥2 模块消费才可准入
- **平台层**：`src/app/`、`src/layouts/`、`src/i18n/`、`src/guards/`、`scripts/`

详见 [`AGENTS.md`](./AGENTS.md) §Agent 协作。

## 许可证

ISC（以 [`package.json`](./package.json) 的 `license` 字段与 [`LICENSE`](./LICENSE) 文件为准）。如计划改变许可证，请同时更新两处。
