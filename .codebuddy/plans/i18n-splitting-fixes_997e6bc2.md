---
name: i18n-splitting-fixes
overview: 修复 i18n 翻译文件拆分方案评估中发现的 7 项问题：清理 feedback 废弃键、删除重复 shortcuts、合并变体翻译三分流、统一命名规范、登记未消费模块、重构 common 顶层结构，全程保持 pnpm verify 全绿。
todos:
  - id: cleanup-deprecated-duplicate
    content: 清理 feedback 废弃键并删除重复 shortcuts 模块，同步注册表（P0+P1）
    status: completed
  - id: merge-variant-modules
    content: 合并 variant/gameVariant/shortDeck 为单一模块并统一 snake_case 命名，迁移 8 处调用方（P1+P2）
    status: completed
    dependencies:
      - cleanup-deprecated-duplicate
  - id: refactor-common-nesting
    content: 重构 common 顶层 key 为 action/ui 二级嵌套、消除 shortcuts 重复，迁移 12 处调用方（P3）
    status: completed
    dependencies:
      - merge-variant-modules
  - id: unconsumed-module-governance
    content: 未消费模块登记分区、preload 测试增活跃断言、AGENTS.md 补命名约束（P2）
    status: completed
    dependencies:
      - refactor-common-nesting
  - id: verify-and-docs
    content: 运行 pnpm verify 全量回归，用 [subagent:ui-visual-validator] 验证变体 UI，更新 CHANGELOG
    status: completed
    dependencies:
      - unconsumed-module-governance
---

## 产品概述

基于 `i18n-splitting-review.md` 评估报告，对德州扑克训练平台的 i18n 翻译拆分方案执行整改修复。评估共发现 7 项问题，本次修复覆盖全部问题，目标是收敛模块边界语义、清理废弃与重复翻译条目、统一键值命名规范、增强未消费模块治理，同时保持 `t('a.b.c')` 调用路径与单 translation 命名空间架构不变。

## 核心功能

- 清理 feedback.json 中 6 个 `[deprecated]` 废弃键（grade/message 的 optimal/acceptable/error），消除废弃键复活即 bug 的风险
- 删除与 common.shortcuts.* 完全重复的 shortcuts.json 模块（2 文件）
- 合并变体翻译三分流（variant/gameVariant/shortDeck → 单一 variant 模块），删除 4 个冗余文件，模块数 41 → 38
- 统一键值命名：variant.json 的 snake_case（select_variant/rules_difference/switch_variant）改为 camelCase（selectVariant/rulesDifference/switchVariant）
- common.json 顶层扁平 key 重构为 action. */ ui.* 二级嵌套，消除语义混排；同时删除 shortcuts 内与顶层重复的 fold/call/raise，消除三处重复定义（评估第 7 项）
- 未消费模块登记治理：ALL_MODULES 分区注释 + preload.test 新增活跃模块断言
- AGENTS.md 补充 i18n 命名硬约束（key 一律 camelCase；kebab-case 仅限与枚举值对应的动态 key）

## 边界说明

- `variant.name.short-deck` 等 kebab-case 动态 key **不重命名**：与 `GameVariant = 'standard' | 'short-deck' | 'heads-up'`（shared/types/poker.ts#L81）数据层标识符强绑定，改名需同步 4 处动态调用方 + 数据层，收益低风险高，明确排除
- 未消费模块（adaptive/app/dailyPlan/localTrack/opponent/opponentDrill/toast）**不删除**：仅登记标注 + 测试断言，避免破坏规划中功能
- common 顶层孤儿 key（fold/call/raise/allIn/start/pause/reset/next/cancel/save/retry/backHome/comingSoon/loading）移入嵌套结构**保留**，防止未来消费方断裂
- **i18next-parser 自动提取不纳入本次**：评估报告明确建议"结合下次新增第三语言时一并处理"，本次无第三语言需求且 AGENTS.md 约束"禁止引入新依赖除非确有必要"；登记为后续里程碑（CHANGELOG 记录），届时应同时评估其与 localeParity 守卫的互补边界（parser 可发现"双方都缺 key"，localeParity 兜底"单边缺失"）

## 技术栈

- 现有 i18next 26 + React 19 + TypeScript 7（strict）+ Vite 8 + Vitest，不引入新依赖
- 架构保持：单 translation 命名空间 + 顶层 key 拆分 + config.ts 静态加载 core + preload.ts 动态懒加载 + moduleRegistry.ts 类型契约（satisfies 三重校验）
- 回归门禁：`pnpm verify`（typecheck && lint && test）必须 exit 0

## 实现方案

### 核心策略

以 moduleRegistry.ts 注册表为唯一契约源驱动全部变更：每个模块增删都同步 `I18nModuleKey` / `ALL_MODULES` / `CORE_MODULES` / `loadModule` 四处，`localeParity.test.ts` 与 `preload.test.ts` 的文件集合断言自动收敛，避免手动多文件同步遗漏。

### 批次 1：废弃键清理 + 重复模块删除（P0 + P1）

- feedback.json（zh/en）：删除 `grade.optimal/acceptable/error` 与 `message.optimal/acceptable/error` 共 6 个 key（已实证 0 消费）
- shortcuts.json（zh/en）：整文件删除（已实证 0 消费；`common.shortcuts.*` 由 BlankLayout.tsx 消费，PLAT-09 注释确认）
- moduleRegistry.ts：移除 `shortcuts`

### 批次 2：变体三分流合并 + 命名统一（P1 + P2）

**variant.json 为唯一承载，吸收 gameVariant + shortDeck：**

- 新增 key：`title` / `switchHint` / `deckSize` / `players`（来自 gameVariant）；`descStandard` / `descShortDeck` / `descHeadsUp`（来自 gameVariant desc*，GameVariantSelector.tsx#L32-33 现有 `i18nKeyFor` 映射返回 camelCase，合并后无需改映射）；`shortDeckRules.{ruleChanges,deckInfo,straightBeatsTrips,flushBeatsFullHouse}`（来自 shortDeck）
- snake_case → camelCase：`select_variant` → `selectVariant`（3 处调用方：VariantToggle/TheoryHome/AcademyHome）；`rules_difference` → `rulesDifference`、`switch_variant` → `switchVariant`（0 消费直接改名）
- moduleRegistry.ts：移除 `gameVariant` / `shortDeck`；CORE_MODULES 移除 `gameVariant`；FEATURE_GROUPS 的 `/settings` 分组 `gameVariant` → `variant`
- config.ts：移除 gameVariant 静态导入 + coreZh/coreEn 条目
- 调用方迁移（已实证 5 处）：SettingsPage.tsx#L408-409、SettingsNav.tsx#L35、GameVariantSelector.tsx#L114,L117（`gameVariant.*` → `variant.*`）
- 删除 gameVariant.json / shortDeck.json（zh/en 共 4 文件）

### 批次 3：common 顶层嵌套重构 + shortcuts 重复消除（P3）

- common.json（zh/en）：
- `action.*`：fold / call / raise / allIn（孤儿 key 移入保留）
- `ui.*`：start / pause / reset / back / next / comingSoon / loading / confirm / cancel / save / delete / retry / backHome / close / active
- `positionGroup.*` / `resultSummary.*` / `shortcutsTitle` / `errorBoundary.*` 保持不动
- **shortcuts 重复消除（评估第 7 项）**：删除 `shortcuts.fold/call/raise`（zh/en 共 3 组 6 个 key）；`SHORTCUTS` 数组 1/2/3 键 action 改指 `common.action.fold/call/raise`（BlankLayout.tsx#L16-18）；zh 面板文案由 "Fold（弃牌）" 收敛为 "弃牌"（双语标注需求由组件内静态英文常量补充，不新增重复 i18n key，保持翻译单源）
- 调用方迁移（已实证 12 处，执行前逐 key grep 复核）：
- `common.active` → `common.ui.active`（PositionBadge.tsx#L55）
- `common.back` → `common.ui.back`（BlankLayout.tsx#L50,L53、RangeLearnPage.tsx#L55、ModuleStatsPage.tsx#L81）
- `common.close` → `common.ui.close`（BlankLayout.tsx#L106）
- `common.delete` → `common.ui.delete`（HandHistoryList.tsx#L205）
- `common.confirm` → `common.ui.confirm`（ReviewSession.tsx#L197,L251）
- `common.shortcuts.fold/call/raise` → `common.action.fold/call/raise`（BlankLayout.tsx#L16-18 的 SHORTCUTS 常量 3 处）

### 批次 4：未消费模块治理 + 守卫增强（P2）

- moduleRegistry.ts：`ALL_MODULES` 重排为「活跃模块」+「未消费保留模块」两分区，附清理准则注释（连续 2 个版本无规划消费即删除）
- preload.test.ts：新增活跃模块断言测试（活跃 = CORE_MODULES ∪ FEATURE_GROUPS 引用面；未消费 = adaptive/app/dailyPlan/localTrack/opponent/opponentDrill/toast）
- AGENTS.md §国际化补充硬约束：key 一律 camelCase；kebab-case 仅限与枚举值/路由参数一一对应的动态 key

### 批次 5：回归与文档同步

- `pnpm verify` 全量门禁必须 exit 0
- docs/CHANGELOG.md 追加本次 i18n 整改记录（模块数 41 → 38）
- 对照 i18n-splitting-review.md 7 项问题清单逐项复核落地
- CHANGELOG 登记后续里程碑：新增第三语言时引入 i18next-parser 自动提取，补全"双方都缺 key"守卫盲区；当前不引入新依赖

## 关键设计决策与权衡

1. **变体合并方向**：以 variant.json 为承载而非 gameVariant——variant 已含 `variant.name.*` 动态 key 且被 4 处消费，扩展它比迁移动态 key 成本低；`desc*` camelCase 键与现有 `i18nKeyFor` 映射天然兼容
2. **kebab-case 动态 key 保留**：`variant.name.short-deck` 与数据层 GameVariant 类型强绑定，是"枚举值即 key"的标准实践，不强行统一为 camelCase，避免 4 处动态调用方 + 数据层连锁改动
3. **common 重构采用"移入保留"而非删除**：孤儿 key 归入嵌套结构保留，未来消费方不会因本次重构断裂；P3 收益有限故排在最后批次，若 verify 出现意外冲突可独立回退
4. **未消费模块登记而非删除**：删除可能破坏规划中功能，登记 + 断言是低成本高可见性的治理方式
5. **shortcuts 重复采用"删除 + 复用顶层"而非"保留双标"**：zh 的 "Fold（弃牌）" 双标导致同一动作在 common 顶层与 shortcuts 内各定义一份，属同一事实源的重复翻译；删除 shortcuts.fold/call/raise 后消费方改指 common.action.*，若需双语标注由组件内静态常量补充，翻译文件保持单源
6. **kebab-case 动态 key 与 camelCase 静态 key 并存的唯一例外**：`variant.name.short-deck` 等 kebab-case 是枚举值即 key 的标准实践，AGENTS.md 新增硬约束仅约束静态 key 命名，不追改动态 key

## 性能与可靠性

- 运行时零性能影响：合并后模块数减少（41 → 38），动态 import chunk 数量下降，启动 chunk（core）体积微降
- 所有删除/重命名均已完成消费方实证（grep 全仓），执行阶段每批变更前用 [subagent:code-explorer] 复核 t() 调用与模板字符串形态，杜绝遗漏
- localeParity 测试的文件集合断言以 ALL_MODULES 为源，注册表单点修改即全链收敛，不会出现"删文件忘删注册表"的假绿

## 架构设计

系统为现有项目局部整改，不引入新架构模式。变更链路：

```
moduleRegistry.ts（契约源）
  ├─ ALL_MODULES 重排（活跃/未消费分区）+ 移除 shortcuts/gameVariant/shortDeck
  ├─ CORE_MODULES 移除 gameVariant
  ├─ FEATURE_GROUPS 移除 gameVariant 引用（/settings）
  └─ loadModule 移除 3 个 key
        ↓
config.ts（core 静态）── 移除 gameVariant 导入
preload.ts（动态）── 自动适配（遍历 ALL_MODULES）
        ↓
locales/{zh,en}/：feedback 删废弃键 / shortcuts·gameVariant·shortDeck 删除 /
                   variant 吸收合并 / common 嵌套重构 + shortcuts 重复消除
        ↓
调用方迁移（≈20 处，含批次 2 的 8 处 + 批次 3 的 12 处）→ localeParity/preload 测试自动收敛 → pnpm verify
```

## 目录结构

本次变更涉及文件清单：

```
src/i18n/
├── moduleRegistry.ts              # [MODIFY] 移除 shortcuts/gameVariant/shortDeck；ALL_MODULES 分区注释
├── config.ts                      # [MODIFY] 移除 gameVariant 静态导入与 coreZh/coreEn 条目
├── preload.test.ts                # [MODIFY] 新增活跃模块断言测试
├── localeParity.test.ts           # [MODIFY] 文件集合断言自动适配（若断言含硬编码数量需同步）
└── locales/
    ├── zh/
    │   ├── feedback.json          # [MODIFY] 删 6 个废弃键
    │   ├── shortcuts.json         # [DELETE] 重复模块
    │   ├── gameVariant.json       # [DELETE] 并入 variant
    │   ├── shortDeck.json         # [DELETE] 并入 variant
    │   ├── variant.json           # [MODIFY] 吸收 gameVariant+shortDeck；snake_case 改名
    │   └── common.json            # [MODIFY] action.*/ui.* 嵌套重构
    └── en/                        # [同 zh 的 6 文件同步变更]
src/shared/
├── components/business/GameVariantSelector.tsx   # [MODIFY] gameVariant.* → variant.*（L114,L117）
├── components/VariantToggle.tsx                  # [MODIFY] select_variant → selectVariant（L59）
├── components/poker/PositionBadge.tsx            # [MODIFY] common.active → common.ui.active（L55）
├── components/feedback/ResultSummary.tsx         # [MODIFY] common.resultSummary.* 确认不受影响
└── components/business/ErrorBoundary.tsx         # [MODIFY] common.errorBoundary.* 确认不受影响
src/layouts/
└── BlankLayout.tsx               # [MODIFY] common.back/close → common.ui.*（L50,53,106）；SHORTCUTS 1/2/3 → common.action.*（L16-18）
src/features/
├── progress/components/settings/SettingsPage.tsx   # [MODIFY] gameVariant.* → variant.*（L408-409）
├── progress/components/settings/SettingsNav.tsx    # [MODIFY] gameVariant.title → variant.title（L35）
├── progress/components/dashboard/ModuleStatsPage.tsx# [MODIFY] common.back → common.ui.back（L81）
├── progress/components/srs/ReviewSession.tsx       # [MODIFY] common.confirm → common.ui.confirm（L197,251）
├── range-trainer/components/RangeLearnPage.tsx     # [MODIFY] common.back → common.ui.back（L55）
├── hand-history/components/HandHistoryList.tsx     # [MODIFY] common.delete → common.ui.delete（L205）
├── theory-academy/components/TheoryHome.tsx        # [MODIFY] select_variant → selectVariant（L69,72）
└── strategy-academy/components/AcademyHome.tsx     # [MODIFY] select_variant → selectVariant（L91,94）
docs/
└── CHANGELOG.md                 # [MODIFY] 追加 i18n 整改记录
AGENTS.md                        # [MODIFY] 补充 i18n 命名硬约束
```

## 多代理协作架构

### 分层模型与职责划分

| 层级 | 代理 | 类型 | 核心职责 | 文件所有权（唯一写者） |
| --- | --- | --- | --- | --- |
| L0 | 主代理（platform-dev 策略） | 编排者 | 契约层唯一写者、波次调度、变更映射表维护、冲突仲裁、文档单写 | `moduleRegistry.ts` / `config.ts` / `locales/**/*.json` / `preload.test.ts` / `localeParity.test.ts` / `AGENTS.md` / `CHANGELOG.md` |
| L1 | code-explorer | 侦查/复核（只读） | Wave 0 全量消费方盘点；每波前 grep 复核；冲突后独立复核 | 无（只读，不落盘） |
| L2 | 7 个执行代理（shared / layouts / progress / range-trainer / hand-history / theory-academy / strategy-academy） | 执行者 | 按模块迁移消费方 key 路径（仅做 key 替换，不动结构） | 各模块内 TSX 文件（见任务分配矩阵） |
| L3 | ui-visual-validator | 质检（只读） | Wave 4 视觉回归：变体选择器/快捷键面板/设置页截图 | 无（只读） |


### 波次调度（Wave Model）与同步节点

```
Wave 0  侦查     code-explorer 全量扫描 t() 调用（字面量 + `common.${}` 模板字符串形态）
                 → 产出【变更映射表】change-map：旧 key → 新 key → 消费方清单（文件+行号）
                 → 主代理核验并冻结映射表（唯一共享真相源）
                 ── 同步节点 S0：所有代理以映射表为准启动 ──
Wave 1  契约层   主代理串行修改 JSON / moduleRegistry / config（单写者，天然无写冲突）
                 → 双语 key 同步落盘，localeParity 临时对齐
                 ── 同步节点 S1：契约层定稿，广播最终 key 路径 ──
Wave 2  调用层   L2 七个执行代理【并行】迁移各自模块 TSX 消费方
                 （每代理仅改所有权文件，互不重叠）
                 ── 同步节点 S2：主代理汇总七份代理报告 ──
Wave 3  复核     主代理独立 grep 复核（trust but verify）→ 全仓零残留断言
                 → 跑 localeParity / preload 测试收敛
                 ── 同步节点 S3：进入验证门禁 ──
Wave 4  验证     pnpm verify 全量 + ui-visual-validator 视觉回归 + CHANGELOG 落档
```

### 通信协议

- **共享工件模型**：`change-map.md`（变更映射表）是 L1→L2 的唯一事实源，Wave 0 产出后冻结；修订仅由主代理执行并以增量 diff 广播，避免并发读旧表
- **代理报告契约**：每个 L2 代理提交结构化报告——`文件清单` + `变更行号` + `与映射表逐条核验结果`（含 pass/fail），主代理据此做 Wave 3 收敛
- **冲突上报通道**：代理发现映射表与实际代码不符（盘点遗漏/映射错误）→ 立即上报主代理，主代理二选一裁决：① 更新映射表并广播增量，受影响代理增量重跑；② 冻结该代理，由主代理直接接管该 key 迁移
- **只读代理隔离**：code-explorer / ui-visual-validator 不持有任何文件所有权，杜绝与 L2 的写冲突

### 任务分配逻辑（文件所有权矩阵）

原则：**契约层单写者 + 调用层按模块分片 + 每文件唯一 owner**。

| 工件 | Owner |
| --- | --- |
| `i18n/locales/**/*.json`（feedback/variant/common/新增/删除） | 主代理（契约层） |
| `moduleRegistry.ts` / `config.ts` / `preload.test.ts` / `localeParity.test.ts` | 主代理 |
| `shared/components/business/GameVariantSelector.tsx`、`VariantToggle.tsx`、`poker/PositionBadge.tsx`、`feedback/ResultSummary.tsx`（复核）、`business/ErrorBoundary.tsx`（复核） | shared-dev |
| `layouts/BlankLayout.tsx`（back/close + SHORTCUTS 两处，唯一 owner 防止同行冲突） | layouts-dev |
| `progress/components/settings/{SettingsPage,SettingsNav}.tsx`、`dashboard/ModuleStatsPage.tsx`、`srs/ReviewSession.tsx` | progress-dev |
| `range-trainer/components/RangeLearnPage.tsx` | range-trainer-dev |
| `hand-history/components/HandHistoryList.tsx` | hand-history-dev |
| `theory-academy/components/TheoryHome.tsx` | theory-academy-dev |
| `strategy-academy/components/AcademyHome.tsx` | strategy-academy-dev |
| `AGENTS.md` / `docs/CHANGELOG.md` | 主代理（文档单写者） |


### 冲突解决策略（主代理仲裁）

| 冲突场景 | 仲裁规则 | 优先级 |
| --- | --- | --- |
| 同一 key 多消费方迁移不一致（如 `selectVariant` 3 处各改法不同） | 以变更映射表为准逐条核验，映射表冻结后不得偏离 | 契约源 = 映射表 |
| 代理报告与实际代码不符 | 以实际代码为准（trust but verify），主代理独立 grep 复核 | 实际代码 > 报告 |
| 双语不对称（zh 改 en 漏改） | localeParity 测试兜底 + 主代理复核落盘 | 测试 > 报告 |
| 映射表盘点遗漏（新消费方未入表） | 更新映射表 + 广播增量，受影响代理增量重跑 | 主代理裁决 |
| 硬冲突（同一行被两个代理改） | 文件所有权矩阵预防；万一发生则回滚一方，按「契约层 → 调用层」顺序重放 | 回滚 + 重放 |


仲裁优先级总序：**契约源（JSON/注册表）> 变更映射表 > 实际代码 > 代理报告 > 自动化测试**。

### 子代理动态增删机制

- **增（横向扩展）**：
- 执行中发现映射表外的新消费方 → 动态增派 code-explorer 定向复核
- 需求变更（如中途新增第三语言）→ 动态增派 `locale-agent`（只读现有双语 + 产出新语言 JSON），主代理负责 merge 进契约层
- 某模块消费方密集成瓶颈 → 按模块内子目录再拆包（如 progress 拆 settings / dashboard / srs 三个执行代理）
- **删（故障/降级）**：
- 执行代理超时/无响应 → 主代理回收任务，直接接管或重新分配给其他同模块代理
- 代理报告质量差（核验 fail 率高）→ 降级为只读复核角色，迁移任务收回主代理串行执行
- 波次回退：Wave 3/4 若批量失败，主代理可整体回退某 wave 的变更并按新的契约源重放，不依赖子代理修复
- **治理规则**：子代理均为无状态任务单元（输入=change-map 分片，输出=结构化报告），主代理是唯一状态持有者——这保证增删代理不破坏整体一致性