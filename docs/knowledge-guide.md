# 项目知识库使用指南

> 状态：Current · 最后复核：2026-11-04
> 定位：说明 Qoder 知识库的**本机缓存**属性、使用方式与回退路径。代码与 Current 文档始终是唯一事实源。

## 1. 知识库是什么

- 位置：`.qoder/repowiki/`（Qoder 自动生成的模块知识卡片与知识库元数据）。
- 属性：**本机自动生成缓存**，已在 `.gitignore` 中忽略 `.qoder/`，**不入库、不跨机器共享**。
- 新克隆仓库或使用其他 AI 工具时没有该目录是正常现象，不是仓库缺文件。
- 知识库与代码可能不一致；冲突时以 `src/` 代码与 `docs/README.md` 列出的 Current 文档为准。

## 2. Qoder 中的使用方式

| 命令 | 用途 |
|---|---|
| `/knowledge` | 增量更新当前项目的知识库 |
| `/knowledge-plan` | 生成或调整 Repo Wiki 的预生成配置 |
| `/init` | 首次生成项目指令与知识库基础结构 |

- 开发时 Qoder 会自动检索相关模块知识并注入上下文；无需手工复制卡片内容到对话或文档。
- 代码结构、路由、模块清单变更后，优先运行 `pnpm agents:map` 更新 `docs/agents/MODULE_MAP.md`；知识库更新是辅助，不是门禁。

## 3. 子代理与文档约束

- `.claude/agents/*.md` **禁止复制知识库中的描述性内容**；只写职责、边界、工作流与引用路径。
- 模块能力与实现细节以代码为准；模块 owner / 入口 / store / i18n / 允许边以 `docs/agents/MODULE_MAP.md`（生成物）为准。
- 需要长期沉淀的决策写入 Current 文档（PRD / TDD / AI_GUIDE / DESIGN / AGENTS）；一次性分析不进入 Current。

## 4. 非 Qoder 环境的回退

不使用知识库，按以下顺序工作：

1. 读 `AGENTS.md`（约束与任务路由）与 `docs/README.md`（Current 文档索引）。
2. 读目标模块的 `src/features/<module>/` 代码与测试。
3. 需要跨模块事实时，运行/查看 `docs/agents/MODULE_MAP.md` 与 `src/guards/README.md`。
4. 可选：在本地手工记录模块笔记，但不入库、不作为事实源。

## 5. 质量检查

- 代码变更后运行 `pnpm verify`（typecheck → lint → repo:check → agents:map:check → test）。
- 文档变更后检查：Current 索引是否可达、链接是否有效、Historical 文档是否已登记 `docs/history/README.md`。
