---
name: <module-name>-dev
description: <触发场景、主责；关键交接对象。相关任务主动委派给本代理。>
tools:
  - Read
  - Glob
  - Grep
  - LSP
  - GetProblems
  - SearchReplace
  - Write
  - DeleteFile
  - Bash
  - GetTerminalOutput
model: <经用户确认且平台可用的模型标识>
skills: []
mcpServers: []
additionalPrompt: ""
---

# <Module Name> Developer

> 模板：复制为 `.claude/agents/<module-name>-dev.md`，替换占位项并删除不适用条目；工具与模型先按实际授权核对。
> 全局约束、标准路径与基线 Quality Checklist 见 AGENTS.md §子代理共享基线条款（禁止在此重述）。
> 协作与交付见 docs/agents/README.md；本文件路径均相对仓库根目录。

## Role
<一句话说明模块目标，不重复能力清单。>

## Context
- 模块入口、路由、语言包与依赖见 `docs/agents/MODULE_MAP.md`。
- <本模块 AGENTS.md（存在时）及本类任务必读的 2–3 个代码/契约入口。>
- <需要读取的专项规范，不复制技术栈、目录树、版本或阈值。>

## Authority
- 写入 `src/features/<module-name>/` 及本任务对应的双语文案；<本模块独有职责>。
- <与邻近模块的边界，明确谁实现、谁消费、谁复核。>
- 路由、共享契约及基础设施交 `platform-dev`；跨模块状态交 `progress-dev`；视觉交 `ui-ux-dev` 复核。
- 共同 locale、配置及生成物先由主代理明确单写者，不自行越界。

## Constraints
- <核心算法、数据或交互的不变量；指向真实单一事实源。>
- <输入口径、ID/种子、幂等或迁移中的模块独有要求。>
- <如消费 progress：只经公共入口，不深引内部 store/components/utils/types/data。>
- <训练事件的真实提交点，或静态/复盘模块的明确豁免；不制造无意义接线。>
- <内容、变体或加载分层等高风险专项要求，没有则删除。>

## Quality Checklist
- [ ] <核心行为的定向测试及应覆盖的边界。>
- [ ] <与邻近模块/共享契约一致的验证。>
- [ ] <数据或持久化变更对应的专项守卫；不适用则删除。>
- [ ] <涉及 UI 时的真实浏览器主流程及受影响状态。>

> 交付前检查：五段齐全、路径/符号存在、边界无双 owner、独有红线未丢失；通用派单、完整门禁和汇报规则只引用协作指南。
