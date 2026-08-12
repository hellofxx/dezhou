# 内容层国际化专项方案（strategy-academy / theory-academy）

> 关联：`language-switch-fix-plan.md` §7 遗留建议 1 的未落地部分。UI 标签层硬编码已在前序修复中清理（13 组件），gto 运行时生成文案已 key 化；本文档面向**课程/题库数据层**约 1.3MB+ 直接中文正文的「存数据 key、渲染时翻译」改造。

---

## 1. 问题定义

英文界面下，以下数据层文案**直接渲染中文**（不经过 `t()`，语言切换永不更新）：

| 模块 | 数据形态 | 规模估算 |
|---|---|---|
| strategy-academy | `LessonSection.content` 课程正文（text/heading/highlight/formula 等 11 种 section） | 约 1MB（standard 8 + short-deck 8 + heads-up 6 + localLessons 8 个 Level 文件） |
| strategy-academy | `QuizQuestion` 题干/选项/解析 | 每课 3-4 题 × N 课，双语重写量大 |
| strategy-academy | `HandExample` title/correctDecision/commonMistake/gameContext | 标准 8 Level + 变体各 Level |
| strategy-academy | `PracticeQuestion` 选项解析 / `OPPONENT_PROFILES` / `BASICS_STEPS` / `GLOSSARY_TERMS` / `LEARNING_TRACKS` / `CONCEPT_NODES` | 约 42 条术语、7 条轨道、14 个概念等 |
| theory-academy | `TheorySection.content` 章节正文 / `TheoryQuizQuestion` / Level 元信息（title/description/objectives/unlockRequirement） | 约 240KB standard + 变体 9×2 |

已达标参考模式（**存 key、渲染时翻译**，改造应复用）：
- `GameVariantSelector` → `variant.name.<variant>` 动态 key
- strategy-academy 4 个 Drill 题库 → `drills.*` key 字段（`promptKey/optionsKeys/explanationKey`）
- `mdfComparison.ts` 概念字段 → `academy.mdf.*`
- `DecisionNode.descriptionKey`（gto，本批新增）
- `ReviewSession` 对 SRS `metadata.front` 的 key 渲染（`t(key, params)`）

---

## 2. 改造原则

1. **数据存 key，渲染时翻译**：数据文件字段存 i18n key（或"key + params"结构化值），渲染组件经 `t()` 解析。禁止在数据层调用 `i18n.t()` 预渲染（语言切换后不刷新）。
2. **i18n key 命名**：遵循 `<module>.<context>.<field>`；静态 key 一律 camelCase；与枚举值一一对应的动态 key 用 kebab-case（如 `academy.difficulty.<level>`）。
3. **双语缺一不可**：新增 key 必须同步 zh/en（`localeParity.test.ts` 兜底守卫）。
4. **顺序处理不动源数据**：题库选项排序走模块排序出口（`quizShuffle` / `quizOrder`），不手改数据顺序。
5. **动态 key 需静态字面量**：`t('academy.difficulty.' + level)` 中的 level 必须是有限枚举联合，禁止任意字符串拼接（防 key 漂移）。

---

## 3. 分阶段方案

### 阶段一：数据模型适配（架构先行，无内容翻译）

- **strategy-academy**：`types.ts` 的 `LessonSection.content` / `QuizQuestion` / `HandExample` / `PracticeQuestion` 各中文字段增加可选的 `*Key`/`*Params` 字段（或改结构为 `{ key, params }`），旧字段保留作 fallback（向后兼容，测试不破）。
- **theory-academy**：`TheorySection` / `TheoryQuizQuestion` / Level 元信息同样扩展。
- **渲染层适配**：`ContentBlock` / `DiagramBlock` / `HandExample` / `LessonQuiz` / `LevelCertification` / `PracticeDrill` / `ChapterView` / `TheoryChapterView` 等渲染处改为"key 优先、fallback 文本"。
- **测试影响**：`curriculumIntegrity.test.ts` / `theoryIntegrity.test.ts` / `quizShuffle.test.ts` / `quizOrder.test.ts` 等守卫随结构扩展同步更新（id/结构断言不变，仅新增可选字段）。

### 阶段二：数据 key 化 + 双语翻译（内容工程，量大）

- 按 Level 文件逐批迁移：每个中文字段 → key + 对应 `academy.json` / `theory.json` 双语译文。
- **内容量预估**：约 1.3MB 中文 → 需对应 en 译文；建议按「standard Level → short-deck → heads-up → localLessons → 术语/轨道/概念/对手档案」优先级分批，每批独立 commit（遵循「逻辑单元独立提交」）。
- 推荐分批粒度：每 2-3 个 Level 文件一批，便于 review 与双语一致性核对。
- 术语/概念类（`GLOSSARY_TERMS` / `CONCEPT_NODES` / `LEARNING_TRACKS` / `OPPONENT_PROFILES`）量小，可单独一批优先完成。

### 阶段三：守卫与验证

- 新增数据完整性守卫：遍历课程/题库数据，断言所有 `*Key` 字段在 `academy` / `theory` 双语资源中存在（参考本批新增的 `scenarioI18n.test.ts`）。
- `quizShuffle` / `quizOrder` 分布守卫随题库迁移保持绿。
- 每批完成跑 `pnpm verify`（typecheck + lint + test）。

---

## 4. 渲染层适配清单（阶段一涉及）

| 渲染组件 | 数据字段 |
|---|---|
| `ContentBlock` / `DiagramBlock`（strategy-academy） | `LessonSection.content` 按 section type 分发 |
| `HandExample` | `title` / `correctDecision` / `commonMistake` / `gameContext.*` |
| `LessonQuiz` / `LevelCertification` | `QuizQuestion` 题干/选项/解析 |
| `PracticeDrill` | `PracticeOption.explanation` / `scenario.opponent` |
| `ChapterView` / `TheoryChapterView`（theory-academy） | `TheorySection.content` / `TheoryQuizQuestion` |
| Level 元信息渲染处 | `title` / `description` / `objectives` / `unlockRequirement` |

---

## 5. 风险与注意

- **测试断言**：现有测试断言中文 question/explanation 字符串的需同步改为断言 key 或翻译结果（本批 `strategyCompare.test.ts` 无此问题；课程/题库守卫需逐一核对）。
- **顺序守卫**：题库选项排序必须在 `t()` 解析后重排（i18n-key 型题库要求，AGENTS.md 答题选项排序治理），且顺序不得随语言变化。
- **SRS/复习链路**：存入 SRS metadata 的文案若改为 key，`ReviewSession` 已支持 `t(key, params)`；但跨模块存储的 key 必须保证对应模块资源在复习页已加载（progress 分组含 review，需确认目标模块 key 的加载面）。
- **不做的事**：不引入 i18next-parser 等新依赖（第三语言时再评估）；不重排源题库静态数据。
