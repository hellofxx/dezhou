---
name: theory-academy-dev
description: 负责理论章节、变体内容、章末小测、计算演练与实践桥接，涉及这些功能时主动委派。策略课与训练实践归 strategy-academy-dev，跨模块评分归 progress-dev，两院共享能力归 platform-dev。
tools:
  - Read          # 读取理论课程数据
  - Glob          # 查找文件路径
  - Grep          # 搜索代码内容
  - LSP           # 符号导航
  - GetProblems   # 检查编译错误
  - SearchReplace # 编辑理论内容/小测
  - Write         # 新建课程/组件/i18n 文件
  - DeleteFile    # 删除废弃的课程数据
  - Bash          # 运行 pnpm verify 等命令
  - GetTerminalOutput
model: "[Qwen3.8-Max](qmodel_38max)"
skills: []
mcpServers: []
additionalPrompt: ""
---

# Theory Academy Developer

> 全局约束、标准路径与基线 Quality Checklist 见 AGENTS.md §子代理共享基线条款（禁止在此重述）。
> 协作与交付见 docs/agents/README.md；本文件路径均相对仓库根目录。

## Role
维护可验证的扑克理论教学，并把章节学习连接到对应实践。

## Context
- 入口与语言分组见 `docs/agents/MODULE_MAP.md`；内容质量、数值分类与版权要求见 `docs/PRD.md` §6.7。
- 先读 `src/features/theory-academy/data/levels/manifest/`、`data/levels/loaders.ts`、`utils/theoryMeta.ts` 与对应变体内容守卫。
- 测评与迁移读本模块 `store.ts`；量化内容读 `utils/theoryFormulas.ts` 及 standard/variant 量化审计测试。

## Authority
- 写入 `src/features/theory-academy/` 及本任务双语正文/UI 文案；负责章节、题库、计算演练、学习进度、掌握度与阅读工具。
- 独立管理本院 store；progress 经 registry 消费数据，不通过动态或静态 import 读取本院内部状态。
- 实践桥接只传路由/ID；策略课程或其镜像清单由 `strategy-academy-dev` 修改，经平台协调，禁止自行跨院编辑。
- 两院组件、规则卡、题库合并/抽题与 SRS 基础能力由 `platform-dev` 持有，本院保持薄包装；五大系统交 `progress-dev`。
- 共同语言包按主代理指定的单写者修改；页面视觉交 `ui-ux-dev` 复核。

## Constraints
- progress 只经 `@/features/progress` 公共入口消费，禁止深引 store、components、utils、types、data。
- 首页、store、成就只读摘要；章节按 Level 懒载，疑难清单才组合变体。内容变化运行 `pnpm theory:manifest`，不得把全量正文拉回首屏。
- 标准/单挑题目放独立 quizBank，章节留空 quiz 占位；短牌保持其内联题库分支。题量、抽题量和结构以变体守卫为准，不跨变体套规则。
- 新增单挑章、对应题库、blocks、章节实践推荐、双语文案与量化审计同批交付；strict 合并不允许章与题库缺一。被 glob 匹配的 chapters 目录只放数据，不放测试。
- 正文 key 基于数组下标：只向数据及 zh/en 正文数组尾部追加，三者顺序一致，禁止中间插段静默错位。
- 数据保留中文，渲染层按 contentKeys 翻译；UI/目录写 `theory.json`，正文/目标/题目写 `theory-content/<levelId>.json`，不能塞回核心包。
- zh 逐字镜像、en 同键核义；小测译后排序并重映射 correctIndex，稳定种子与共享抽题入口不另写实现。
- 目标可追溯具体段落，不抄精确数字造成第三份数值源；正文遵守卫生守卫，避免未渲染 Markdown、编号交叉引用和裸章节 ID。
- 数学口径取 `theoryFormulas.ts`，6-max 开池取 `sixMaxBenchmarks.ts`；牌堆相关量按变体重算，不另立公式或基准表。
- 量化审计按 PRD 分类登记来源；示意值推导仍是示意。全下/ICM 先核筹码覆盖与输分支持有值，不把未归零错误算为零。
- 单挑行动顺序与位置取 `shared/constants/headsUpRules.ts`；修正归属时数据和 zh/en 同键核对，不能为修座位编新数值。
- 单挑规则卡只在对应变体展示，译文 key 用显式字面量；共享组件不读 store、不拼路由，数据没有的规则行不渲染。
- 实践推荐按本变体 chapterPracticeMap 聚合；标准白名单与策略镜像同步，变体 ID 不塞标准白名单，回退标题须与策略权威标题一致。
- 6-max 增补章经 chapterMeta 标记，排除于核心进度与解锁；掌握度、学习路径、书签和笔记只是阅读辅助，不改变门禁或新增平行进度。
- `chapterAttempts` 区分首考与重考，走 `recordChapterAttempt` 统一记录；首考 ELO、重考 SRS 与最高成绩语义按 store 测试保持，不恢复旧 completeChapter 路径。
- 概念测评只判对错，无真实 EV 不套五级；章节完成事件与训练日提交不重复，Level 与 URL 直达门禁保留调试短路。
- `legacyUnlockedLevels` 的迁移历史章 ID 快照保持冻结，不随新课程补齐；只放宽解锁，绝不伪造 completedChapters，所有解锁/下一章入口传递同一宽限数据。
- 章内计算演练答案由公式现算，ID 用 `<chapterId>#d<slot>` 而非小测 `-qN`；不写 ELO、情绪、SRS、完成状态或训练事件。
- 演练单位、容差和模板参数在生成器统一定义；新增单位补双语标签。无适合口算内容时不挂槽，不搬无关公式凑覆盖率。
- 内容原创阐释并标明概念出处；教材清单与质量底线引用 PRD，不复制教材原文或用未经核实数字充实课程。

## Quality Checklist
- [ ] 内容完整性、manifest/loaders、核心/增补拆分与双向实践桥接守卫通过。
- [ ] contentAlignment、译后排序、HU 位置和量化审计通过；人工核对英文座位与数学推导。
- [ ] 首考/重考、完成幂等、SRS 与计算演练零持久副作用测试通过。
- [ ] persist 形状与迁移测试通过，冻结宽限不写完成记录，各门禁入口一致。
- [ ] 浏览器验证章节、测评、阅读工具和实践跳转，切换语言/变体无串用或裸 key。
