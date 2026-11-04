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
pnpm docs:check      # 文档链接 / 索引 / 状态检查
pnpm agents:map      # 重新生成 docs/agents/MODULE_MAP.md
pnpm agents:map:check  # 校验模块地图与代码事实一致
```

## 质量门禁

`pnpm verify` 是提交前唯一入口，当前序列为：

```text
typecheck → lint → repo:check → docs:check → agents:map:check → test
```

CI 的 `ci.yml` 在 PR / 非 `main` 分支执行 `verify → build → size:check`；`deploy.yml` 在 push `main` 时执行完整门禁并发布 GitHub Pages。发布流程见 [`docs/ops/DEPLOY_CHECKLIST.md`](./docs/ops/DEPLOY_CHECKLIST.md)。

## Git Hooks（可选，建议启用）

```powershell
git config core.hooksPath .git-hooks
```

`pre-commit` 是**阻断式**门禁（fail-closed）：

- 任意 `.ts / .tsx / .js / .jsx` 变更触发 ESLint；
- `.claude/agents/*-dev.md` 变更触发代理工具校验；
- 路由 / 模块 / i18n 注册表变更触发 `agents:map:check`。

详细说明见 [`.git-hooks/README.md`](./.git-hooks/README.md)。

## 文档

| 文档 | 描述 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | AI 代理唯一约束源：任务路由、架构约束、质量门禁 |
| [`docs/README.md`](./docs/README.md) | 文档索引与 Current / Historical 状态约定 |
| [`docs/PRD.md`](./docs/PRD.md) | 产品规格（What / Why） |
| [`docs/TDD.md`](./docs/TDD.md) | 技术设计（How） |
| [`docs/AI_GUIDE.md`](./docs/AI_GUIDE.md) | 编码 / 状态 / i18n / UI 详细规范 |
| [`docs/testing/README.md`](./docs/testing/README.md) | 测试体系规范 |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 版本演进记录 |
| [`DESIGN.md`](./DESIGN.md) | UI/UX 设计语言规范（唯一设计契约） |
| [`docs/architecture/README.md`](./docs/architecture/README.md) | 当前态架构模型（快照） |
| [`docs/adr/README.md`](./docs/adr/README.md) | 架构决策记录（ADR） |
| [`docs/how-to/README.md`](./docs/how-to/README.md) | 贡献者操作指南（新增模块 / 守卫 / 测试） |
| [`docs/history/README.md`](./docs/history/README.md) | 历史评审 / 计划 / 诊断报告索引 |

设计参考原型：[`poker-ui-demo/pages/index.html`](./poker-ui-demo/pages/index.html)。

## 架构概览

- **纯前端架构**：React 19 + TypeScript 7 + Vite 8
- **状态管理**：Zustand 5（persist + IndexedDB）
- **测试**：Vitest（unit + component 双项目）
- **国际化**：i18next（中英双语，路由级懒加载）
- **质量门禁**：ESLint + TypeScript strict + pnpm verify

## AI 代理协作

项目采用 12 个自定义子智能体（2 个基础层 + 10 个 feature 层）：

- **基础层**：`platform-dev`（路由 / shared 层 / 跨模块协调）、`ui-ux-dev`（设计语言守护）
- **Feature 层**：`range-trainer-dev`、`pot-odds-dev`、`gto-simulator-dev`、`hand-history-dev`、`progress-dev`、`onboarding-dev`、`puzzle-trainer-dev`、`strategy-academy-dev`、`theory-academy-dev`、`help-center-dev`

详见 [`AGENTS.md`](./AGENTS.md) §Agent 协作。

## 许可证

ISC（以 [`package.json`](./package.json) 的 `license` 字段为准）。如计划改为 MIT，请同时更新 `package.json` 并补充 `LICENSE` 文件。
