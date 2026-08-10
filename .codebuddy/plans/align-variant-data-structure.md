# 三种变体数据结构对齐重构方案（v2：含 standard 全量归位）

> 目标：standard / short-deck / heads-up **三种变体在两大学院中以完全相同的「变体 → Level → 单文件」结构组织，执行同一套命名规则**，便于统一维护。
>
> 纯**数据文件重组**：只做「移动 + 拆分 + 重命名 + 索引聚合 + 兼容层」，不改内容、不改任何对外 API 行为，风险低、可增量验证。

---

## 一、现状与痛点

### 理论学院（`src/features/theory-academy/data/levels/`）

| 变体 | 现状 | 问题 |
|---|---|---|
| standard | `theoryLevel1.ts`~`theoryLevel9.ts` + 外壳 `index.ts`（`THEORY_LEVELS`） | 已按 Level 拆文件，但**命名不带变体前缀、物理位置不在 variants 下** |
| short-deck | 单文件 `variants/short-deck.ts`（≈2751 行） | 超大单文件，远超 300 行硬约束 |
| heads-up | 单文件 `variants/heads-up.ts`（≈2714 行） | 同上 |

### 策略学院（`src/features/strategy-academy/data/`）

| 变体 | 现状 | 问题 |
|---|---|---|
| standard | `levels/level1.ts`~`level8.ts`（含 level4a/4b）+ 外壳 `levels/index.ts`（`LEVELS`）；`courses.ts` 为其 re-export 兼容层 | 命名/位置与变体不一致 |
| short-deck | 单文件 `lessons/variants/short-deck.ts`（≈3600 行，L3-L8 16 门） | 超大单文件 |
| heads-up | 单文件 `lessons/variants/heads-up.ts`（≈2600 行，L3-L8 10 门） | 同上 |

### 核心问题

1. **三变体结构不对称**：standard 在 `levels/` 根下，变体在 `levels/variants/` 下；命名规则完全不同。
2. **变体超大文件**：2500~3600 行，编辑/导航/git diff 困难。
3. **命名不统一**：
   - 理论 standard 导 `THEORY_LEVEL_N_CHAPTERS`，变体导 `t1sd`/`t1hu`。
   - 策略 standard 导 `LEVEL_N_LESSONS`，变体导 `SHORT_DECK_STRATEGY_COURSES`/`HEADS_UP_STRATEGY_COURSES`。
4. **`variantRules` 位置不统一**：内联于变体文件顶部，standard 无对应物。
5. **测试耦合**：`theoryProgress.test.ts` 直接 import `variants/heads-up`（单文件路径）。

---

## 二、目标结构（三变体完全平级 + 统一命名 + 兼容层）

设计原则：
- **三变体物理平级**，各自一个目录 `variants/<variant>/`，内含「Level 内容文件」+ `index.ts`。
- **每个 Level 内容文件只导出 `chapters`/`lessons` 数组**；Level 外壳（id/title/icon/practiceRecommendations 等）统一放各自 `index.ts`。
- **命名统一**：`<variant>Level<level>.ts` → `<VARIANT>_LEVEL_<N>_CHAPTERS` / `<VARIANT>_LEVEL_<N>_LESSONS`。
- **兼容层**：原 `data/levels/index.ts`（理论）与 `data/courses.ts`/`data/levels/index.ts`（策略）保留为 re-export，**消费方零改动**。

### 理论学院

```
src/features/theory-academy/data/levels/
├── index.ts                      # 兼容层：export { THEORY_LEVELS } from './variants/standard'
├── theoryLevel1.ts ~ theoryLevel9.ts   # ← 移入 variants/standard/ 并改名，删除
└── variants/
    ├── index.ts                  # 聚合三变体 + getTheoryLevelsByVariant（对外 API 扩展）
    ├── variantRules.ts           # 新增：shortDeckRules / headsUpRules 单一出口
    ├── standard/
    │   ├── index.ts              # 重组 THEORY_LEVELS（外壳集中于此）
    │   ├── standardLevel1.ts     # → STANDARD_LEVEL_1_CHAPTERS（原 theoryLevel1.ts 内容）
    │   ├── standardLevel2.ts     # → STANDARD_LEVEL_2_CHAPTERS
    │   └── ... standardLevel9.ts
    ├── short-deck/
    │   ├── index.ts              # 重组 shortDeckLevels
    │   ├── shortDeckLevel1.ts    # → SHORT_DECK_LEVEL_1_CHAPTERS
    │   └── ... shortDeckLevel9.ts
    └── heads-up/
        ├── index.ts              # 重组 headsUpLevels
        ├── headsUpLevel1.ts      # → HEADS_UP_LEVEL_1_CHAPTERS
        └── ... headsUpLevel9.ts
```

### 策略学院

```
src/features/strategy-academy/data/
├── courses.ts                    # 兼容层（不变）：export { LEVELS } from './levels'
├── levels/
│   ├── index.ts                  # 兼容层：export { LEVELS } from './variants/standard'
│   ├── level1.ts ~ level8.ts     # ← 移入 variants/standard/ 并改名，删除
│   └── level4a.ts / level4b.ts   # ← 移入 variants/standard/，删除
└── lessons/
    └── variants/
        ├── index.ts              # 聚合三变体（对外 API 扩展）
        ├── standard/
        │   ├── index.ts          # 重组 LEVELS
        │   ├── standardLevel1.ts # → STANDARD_LEVEL_1_LESSONS（原 levels/level1.ts 内容）
        │   ├── standardLevel4.ts # → L4A+L4B 合并
        │   └── ... standardLevel8.ts
        ├── short-deck/
        │   ├── index.ts          # 重组 SHORT_DECK_STRATEGY_COURSES
        │   ├── shortDeckLevel3.ts
        │   └── ... shortDeckLevel8.ts
        └── heads-up/
            ├── index.ts          # 重组 HEADS_UP_STRATEGY_COURSES
            ├── headsUpLevel3.ts
            └── ... headsUpLevel8.ts
```

---

## 三、命名规则统一汇总

| 层级 | 理论学院 | 策略学院 |
|---|---|---|
| 变体目录 | `variants/<variant>/` | `lessons/variants/<variant>/` |
| Level 内容文件 | `<variant>Level<N>.ts` | 同左 |
| Level 内容导出 | `<VARIANT>_LEVEL_<N>_CHAPTERS` | `<VARIANT>_LEVEL_<N>_LESSONS` |
| 变体聚合导出 | `<variant>Levels`（如 `shortDeckLevels`） | `<VARIANT>_STRATEGY_COURSES` |
| 变体规则 | `variants/variantRules.ts`（理论侧） | 策略侧无独立 rules（规则挂在 Lesson 上） |

---

## 四、实施步骤

### 第 1 步：理论学院 standard 归位
- 新建 `variants/standard/index.ts`，把原 `data/levels/index.ts` 的 9 个 Level 外壳迁入，chapters 引用 `STANDARD_LEVEL_N_CHAPTERS`。
- 把 `theoryLevel1.ts`~`theoryLevel9.ts` 内容搬到 `variants/standard/standardLevel1.ts`~`standardLevel9.ts`，导出名改为 `STANDARD_LEVEL_N_CHAPTERS`。
- 原 `data/levels/index.ts` 改为兼容层 `export { THEORY_LEVELS } from './variants/standard'`。
- 删除原 9 个 `theoryLevelN.ts`。
- 新增 `variants/variantRules.ts`（目前先定义 shortDeckRules/headsUpRules 的单一导出位，供第 2/3 步引用）。

### 第 2 步：理论学院 short-deck / heads-up 拆分
- 从 `variants/short-deck.ts` 拆出 9 个 level 内容文件 + `short-deck/index.ts`（外壳集中）。
- 从 `variants/heads-up.ts` 拆出 9 个 level 内容文件 + `heads-up/index.ts`。
- 两文件的 `const shortDeckRules`/`headsUpRules` 迁移至 `variants/variantRules.ts`，level 文件引用统一 `import { ... } from '../variantRules'`。
- 删除原 `variants/short-deck.ts`、`variants/heads-up.ts`。
- 更新 `variants/index.ts`：`ALL_VARIANT_THEORY_LEVELS` 改为 `[...standardLevels, ...shortDeckLevels, ...headsUpLevels]`；`getTheoryLevelsByVariant` 的 standard 分支改用 `standardLevels`。
- `theoryProgress.test.ts` 第 11 行 import 路径：`variants/heads-up`（单文件）→ 现为目录，解析到 `heads-up/index.ts`，**行为不变**；如 TS 报歧义则改为显式 `../data/levels/variants/heads-up/index`。

### 第 3 步：策略学院 standard 归位
- 新建 `lessons/variants/standard/index.ts`，把原 `levels/index.ts` 的 Level 外壳迁入，lessons 引用 `STANDARD_LEVEL_N_LESSONS`。
- 把 `levels/level1.ts`~`level8.ts`、`level4a.ts`/`level4b.ts` 内容搬到 `variants/standard/standardLevelN.ts`，导出名统一 `STANDARD_LEVEL_N_LESSONS`（L4 合并为 `standardLevel4.ts`，内容 = L4A+L4B）。
- 原 `levels/index.ts` 改为兼容层 `export { LEVELS } from './variants/standard'`。
- `courses.ts` 不变（仍 re-export `./levels`）。
- 删除原 `levels/levelN.ts`、`level4a.ts`、`level4b.ts`。

### 第 4 步：策略学院 short-deck / heads-up 拆分
- 从 `lessons/variants/short-deck.ts` 拆出 L3-L8 共 6 个 level 内容文件 + `short-deck/index.ts`。
- 从 `lessons/variants/heads-up.ts` 拆出 L3-L8 共 6 个 level 内容文件 + `heads-up/index.ts`。
- 更新 `lessons/variants/index.ts`：`ALL_VARIANT_LESSONS` 纳入 `standard` 课程（与原 `LEVELS` 浅拷贝派生等价，可改为直接 `import { LEVELS } from '../../levels'` 保持语义）；`getLessonsByVariantAndLevel` / `VARIANT_LESSON_INDEX` 的 standard 分支对应更新。
- 删除原两个单文件。

### 第 5 步：文档同步 + 验证
- 更新 `docs/CHANGELOG.md` 记录本次结构重构。
- 涉及文件清单/目录结构的陈述，同步 `docs/TDD.md` 与相关子代理文件（theory-academy-dev / strategy-academy-dev）。
- `pnpm verify` 全绿。

---

## 五、消费方零改动保证（兼容层原理）

| 消费方 | 现状 import | 归位后 | 是否需改 |
|---|---|---|---|
| 理论 store/组件/`theoryProgress.ts` | `from '../data/levels'` | 命中兼容层 `index.ts` re-export | 否 |
| 理论 `index.ts` | `export { THEORY_LEVELS } from './data/levels'` | 兼容层透传 | 否 |
| 策略 `courseProgress.ts` 等 | `from '../data/courses'` | `courses.ts` re-export `./levels`→兼容层 | 否 |
| 策略组件/store | `from '../data/levels'` 或 `../data/courses'` | 兼容层透传 | 否 |
| `progress/dailyTrainingPlan.ts` | import `LEVELS`（跨模块） | 兼容层透传 | 否 |
| 守卫测试（theoryIntegrity / curriculumIntegrity） | import `THEORY_LEVELS`/`LEVELS`/变体聚合 | 兼容层透传 | 否 |

> 唯一需注意的路径：`theoryProgress.test.ts` 直接 import `variants/heads-up`（目录级），需确认解析到 `heads-up/index.ts`，必要时显式加 `/index`。

---

## 六、风险与回滚

- **风险低**：纯数据文件重组，内容不改，对外符号经兼容层全部保留。
- **行为变化点**：`variants/index.ts` 的 standard 数据源从 `../index`（THEORY_LEVELS）改为 `./standard`，但 `ALL_VARIANT_THEORY_LEVELS` 的**数组元素、顺序不变**（仍是标准 9 级在前），守卫测试不红。
- **回滚**：git 恢复删除文件 + 撤销兼容层改动即可，无数据迁移。

---

## 七、范围外（本次不做）

- 不改组件 / store / 路由 / i18n / 教学内容。
- 不为策略变体补建不存在的 L1/L2（仅拆现有）。
- 策略侧不新增 variantRules 文件（其规则已内联于 Lesson，不属本次重组目标）。
