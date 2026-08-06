# 德州扑克训练平台 (Poker Training Platform)

纯前端、零后端依赖的德州扑克系统性训练工具。通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家提升决策能力。

## 🎯 核心功能

- **范围训练 (Range Trainer)**: 13×13 范围网格、位置渐进解锁
- **GTO 模拟器**: Web Worker 计算卸载、EV 损失分析
- **赔率计算器**: Rule of 2 and 4、隐含赔率估算
- **策略学院**: 三段式互动教学、Drill 题库系统
- **理论学院**: T1-T9 完整体系、游戏变体（短牌/单挑）支持
- **每日谜题**: 日期种子确定性题目流
- **手牌复盘**: IndexedDB 存储、多格式解析

## 🚀 快速开始

### 环境要求

```powershell
Node.js 20.x (建议使用 nvm 管理)
pnpm 9.x+
```

### 安装步骤

```powershell
# 克隆仓库
git clone <repository-url>
cd dezhou

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 构建与部署

```powershell
# 类型检查
pnpm typecheck

# 代码质量
pnpm lint

# 单元测试
pnpm test

# 完整验证
pnpm verify

# 生产构建
pnpm build
```

## 🔧 Git Hooks（可选）

本项目包含自动化质量门禁钩子，建议在首次运行时启用：

```powershell
# Windows PowerShell
git config core.hooksPath .git-hooks
Copy-Item ".git-hooks\pre-commit" ".git\hooks\pre-commit" -Force

# Linux/macOS
git config core.hooksPath .git-hooks
ln -s ../.git-hooks/pre-commit .git/hooks/
```

**功能说明**：
- 仅在 `.claude/agents/*.md`变更时触发代理工具校验
- 非强制门禁（warning 级别），建议启用
- 详细说明见 [`.git-hooks/README.md`](./.git-hooks/README.md)

## 📚 文档

| 文档 | 描述 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | AI 代理协作规范与职责划分 |
| [`docs/PRD.md`](./docs/PRD.md) | 产品需求规格说明书 |
| [`docs/TDD.md`](./docs/TDD.md) | 技术设计文档 |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 版本演进记录 |
| [`poker-ui-demo/DESIGN_LANGUAGE.md`](./poker-ui-demo/DESIGN_LANGUAGE.md) | UI/UX设计语言规范 |

## 🏗️ 架构概览

- **纯前端架构**: React 19 + TypeScript 7 + Vite 8
- **状态管理**: Zustand v5 (persist + IndexedDB)
- **测试**: Vitest (unit + component 双项目)
- **国际化**: i18next (中英双语)
- **质量门禁**: ESLint + TypeScript strict + pnpm verify

## 🤝 AI 代理协作

项目采用 12 个子智能体分工模式：

- **platform-dev**: 基础层（路由/shared 层）
- **ui-ux-dev**: 设计语言守护
- **feature-dev** (9 个): range-trainer / pot-odds / gto-simulator / hand-history / progress / onboarding / puzzle-trainer / strategy-academy / theory-academy / help-center

详见 [`AGENTS.md`](./AGENTS.md) 《Agent 协作》章节。

## 📄 许可证

MIT License
