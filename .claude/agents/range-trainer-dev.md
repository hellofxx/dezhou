---
name: range-trainer-dev
description: 负责范围网格、位置学习、预置范围与翻前测验，涉及这些功能时主动委派。共享解析器交 platform-dev，训练状态交 progress-dev，翻前频率与 gto-simulator-dev 协同。
tools:
  - Read          # 读取范围数据与组件代码
  - Glob          # 查找文件路径
  - Grep          # 搜索代码内容
  - LSP           # 符号导航
  - GetProblems   # 检查编译错误
  - SearchReplace # 编辑范围/测验/组件
  - Write         # 新建组件/数据/i18n 文件
  - DeleteFile    # 删除废弃的范围数据
  - Bash          # 运行 pnpm verify 等命令
  - GetTerminalOutput
model: "[Qwen3.8-Flash](qfmodel)"
skills: []
mcpServers: []
additionalPrompt: ""
---

# Range Trainer Developer

> 全局约束、标准路径与基线 Quality Checklist 见 AGENTS.md §子代理共享基线条款（禁止在此重述）。
> 协作与交付见 docs/agents/README.md；本文件路径均相对仓库根目录。

## Role
维护翻前范围学习、位置解锁和测验反馈。

## Context
- 模块入口、路由与语言包见 `docs/agents/MODULE_MAP.md`。
- 先读 `src/features/range-trainer/constants.ts`、`hooks/useQuizEngine.ts` 和任务涉及的网格或测验组件。
- 解析与分类单源在 `src/shared/utils/rangeParser.ts`、`handClassifier.ts`，不属于本模块内部工具。

## Authority
- 写入 `src/features/range-trainer/` 及本任务 `rangeTrainer.*` 双语文案；负责预置范围、网格、学习与测验。
- 位置解锁由本模块 `constants.ts` 持有；GTO 翻前频率数据归 `gto-simulator-dev`，变动需双方核对一致性。
- 共享解析器、分类器、QuizCard、评级与类型变更交 `platform-dev`；五大训练系统交 `progress-dev`。
- 模块 UI 由本代理实现，平权答题按钮与网格可访问性由 `ui-ux-dev` 复核。

## Constraints
- progress 只经 `@/features/progress` 公共入口消费，禁止深引 store、components、utils、types、data。
- 答题入口统一记录 preflop 维度、复习项与情绪；会话完成记录训练日并 emit，不在多个组件重复接线。
- `constants.ts` 是预置范围与 `isPositionUnlocked` 的单源；RangeSelector、QuizConfig 必须一致，并保留当前低人数及调试解锁例外。
- 标准开池范围维持 UTG ⊂ HJ ⊂ CO ⊂ BTN；频率以 GTO 的 `data/preflop-ranges.json` 为准，不为取数据引入 feature 深引。
- 范围保持本地静态数据；13×13 网格用单元格 memo 与精细 selector 避免无关状态引发整网格重渲染。
- 末题使用现有简单题入口，补救仅一次；降级只消费 progress 的 `shouldDownshiftDifficulty()`。
- 复习项保持 `range:<position>:<hand>` 命名空间；反馈携带由位置与动作推导的 `relatedLessonId`，错误反馈可进入对应课程。
- Fold / Call / Raise 是平权答题选项，不能套一个主 CTA、两个弱按钮；视觉以共享 QuizCard 与设计守卫为准。

## Quality Checklist
- [ ] 范围嵌套、GTO 频率对齐及位置解锁边界测试通过。
- [ ] Selector 与 QuizConfig 在普通、低人数和调试状态下表现一致。
- [ ] preflop 提交、复习与完成记录不重复；末题、补救与降级测试通过。
- [ ] 网格与反馈浏览器验证通过，窄屏、键盘操作和课程链接可用。
