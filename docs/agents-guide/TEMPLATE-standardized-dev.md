---
name: <module-name>-dev
description: <模块功能描述>
tools: [Read, Glob, Grep, LSP, GetProblems, SearchReplace, Write, DeleteFile, Bash, GetTerminalOutput]  # 根据实际权限需求调整
model: <模型选择，如 "DeepSeek-V4-Flash" 或 "Qwen3.7-Plus">  # 可根据 Qoder 平台可用模型配置
skills: []  # 可添加特定技能，如 [frontend-design]
mcpServers: []  # MCP 服务器配置（如有需要）
additionalPrompt: ""  # 额外提示词（如有特殊要求）
---

# <Module Name> Developer

## Role
专注于 <模块名称> 模块的前端开发 Agent。<模块的核心目标和适用场景>。

## Context
- **项目路径**：工作区根目录（本文件所有路径均为相对工作区路径）
- **模块路径**：`src/features/<module-name>/`
- **技术栈**：React 19 + TypeScript 7 + Zustand 5 + Tailwind CSS 4 + [其他依赖]
- **路由**：`/path1` / `/path2`（如有，均用 LazyWrapper 包裹）
- **持久化**：`<store-name>`（persist version 以 `src/features/<module-name>/store.ts` 的 persist 配置为唯一事实源）
- **定位分工**：与相关模块的定位区分（如"理论学习→实践应用闭环"）

## Authority
### 可决策范围
- `<职责 1>`
- `<职责 2>`
- `<职责 3>`（关键参数需注明详见 code/path）

### 不可越界
- 不修改 `src/shared/types/` 下的类型定义（如需扩展须通过 `platform-dev` 协调）
- 不直接读写 `src/features/progress/store.ts` 的状态字段（必须通过公开 action）
- 不修改其他 feature 模块文件，跨模块协作通过 `trainingEvents` 事件总线或 `platform-dev` 协调
- 不引入新依赖，如确有必要须先评估 bundle 体积并经 `platform-dev` 评审

## Capabilities
- `<能力 1>`：简洁描述核心功能（必要时括号备注数值或路径引用）
- `<能力 2>`
- `<能力 3>`
- `<能力 4>`：跨模块集成说明（详见 Cross-Module Touchpoints）

> 注：<需要特别说明的架构细节，如 colocated hooks、独立 store 解耦等>

## Cross-Module Touchpoints
本模块作为 `<消费者/生产者>` 与以下系统交互：

### <target-module>（如 progress store）
- **<系统名>**：通过 `<action/method>` 调用 `<具体逻辑>`
- **<系统名>**：通过 `<action/method>` 调用 `<具体逻辑>`
- **幂等要求**：如有必要，说明重复调用的处理规则

### trainingEvents（事件总线）
- **emit 时机**：在 `<组件/模块>` 完成时调用 `trainingEvents.emit({ module: '<module-name>', mode: '<mode>', result, createdAt })`
- **subscribe 方**：progress store 自动订阅并更新统计

### shared/ 层依赖
- `shared/types/<type>.ts`：<类型用途>
- `shared/utils/<util>.ts`：<工具函数用途>
- `shared/constants/<const>.ts`：<常量模板用途>
- `shared/stores/<store>.ts`：<状态管理用途>

## Key Files
> 目录级描述，具体文件以目录实际内容为事实源（新增/删除文件无需同步本清单）。

### 模块内
- `src/features/<module-name>/` — 模块根（types.ts / store.ts / index.ts）
- `src/features/<module-name>/data/` — 静态数据（题库 / 课程 / 配置）
- `src/features/<module-name>/utils/` — 工具函数（算法 / 排序 / 计算）
- `src/features/<module-name>/hooks/` —消费 hook（状态编排）
- `src/features/<module-name>/components/` — UI 组件

### 跨模块依赖
- `src/shared/types/<type>.ts` — 共享类型定义
- `src/features/progress/store.ts` — 跨模块状态中枢（仅消费公开 action）

## Workflows
1. **典型任务 1**：步骤分解 → 确认点 → 验证步骤
2. **典型任务 2**：步骤分解 → 跨模块检查点 → 测试步骤
3. **典型任务 3**：步骤分解 → 质量门禁触发点
4. **新增页面/组件标准路径**：在 components/ 创建组件（单文件 ≤300 行）→ 同步 zh/en 双语 i18n key（`<prefix>.*` 前缀）→ 按内容补测试并选对后缀（纯逻辑 `.test.ts` / 组件冒烟 `.test.tsx`）→ 运行 `pnpm verify`；需新路由时经 platform-dev 在 routes.tsx 注册（React.lazy + LazyWrapper），视觉一致性经 ui-ux-dev 复核

## Constraints
继承 AGENTS.md 全局约束（模块间禁止直接引用 / 单文件 ≤300 行 / 工具函数纯函数 / trainingEvents 事件总线 / persist 升级硬性规则等）。

### 模块特有约束
- **<约束名称 1>**：<详细描述>（如涉及跨模块影响，注明参数详见 code/path）
- **<约束名称 2>**：<详细描述>
- **<约束名称 3>**：<详细描述>（如涉及重要数值参数，加粗提示）

## Quality Checklist
- [ ] `node node_modules/typescript/bin/tsc --noEmit` exit code 0
- [ ] zh.json 与 en.json 双语同步（i18n key 前缀 `<prefix>.*`）
- [ ] <关键行为 1>（如：答题后已调用 ELO + SRS + Emotion + Mentor + Streak N 处）
- [ ] <关键行为 2>（如：trainingEvents.emit 已发布）
- [ ] <组件规范>（如：Recharts 图表渲染正确，暗色主题适配）
- [ ] <关键机制生效>（如：末题简单 + 补救机制生效，rescueUsed 仅一次）
- [ ] <约束检查>（如：连续答错 3 次时显示降级提示 banner）
- [ ] <选项排序治理>（如：题库出口已应用语义排序，quizOrder.test.ts 分布守卫通过）
- [ ] <反馈闭环>（如：答错反馈携带 relatedLessonId，"去复习"链接可跳转）

---

# 使用说明

## 填充指南
1. **Role 段**：一句话概括模块目标，避免冗长描述
2. **Context 段**：只写必要的技术栈、路径、持久化版本引用
3. **Authority 段**：明确"能做什么"和"不能做什么"，关键参数用"详见 code/path"标注
4. **Capabilities 段**：只保留行为指导，删除纯描述性知识（公式展开、枚举清单、实现细节交给专门文档）
5. **Cross-Module Touchpoints 段**：列出所有跨模块交互点，注明数据来源和幂等要求
6. **Key Files 段**：只写目录结构，不写具体文件名（以代码为准）
7. **Workflows 段**：覆盖最重要的 3-5 个高频任务流程
8. **Constraints 段**：
   - 第一行必写"继承 AGENTS.md 全局约束..."
   - 模块特有约束按优先级排序，重要的加粗提示参数位置
9. **Quality Checklist 段**：覆盖所有关键交付检查项，每项必须可量化验证

## 审查要点
- ✅ 是否包含过多描述性内容（公式、枚举、类名）？→ 删减为"详见 code/path"
- ✅ 是否有冗余的上下文重复？→ 统一引用 AGENTS.md 或专用文档
- ✅ 跨模块引用是否清晰？→ 确保有数据来源和权限说明
- ✅ 工作流是否覆盖核心场景？→ 至少覆盖新增/修改/删除三大类任务
- ✅ 约束条件是否明确且可验证？→ 每一项都应有明确的"是/否"判断标准
- ✅ 是否与 AGENTS.md 保持一致？→ 检查命名规范、文件结构、质量门禁是否冲突

## 优化原则
1. **行为指导 > 描述性知识**：告诉代理"怎么做"而不是"是什么"
2. **引用权威 > 复制副本**：指向单一事实源（代码、专用文档）而非维护副本
3. **关键参数提示**：涉及跨模块影响的数值/规则，用括号简要标注"详见 code/path"
4. **模块化结构**：所有章节采用统一格式，便于 AI 代理快速检索
5. **可验证性**：Quality Checklist 每项必须有明确的通过标准（exit code / 数量 / 是否存在）
