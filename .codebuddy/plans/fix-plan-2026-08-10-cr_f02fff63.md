---
name: fix-plan-2026-08-10-cr
overview: 修复 2026-08-10 大规模 UI 重构代码审查发现的 10 个问题：1 个严重 bug（framer-motion variant 状态名不匹配导致 progress 页内容不可见）已修复，其余 9 个为数据语义、i18n 完整性、逻辑口径、硬编码颜色与动效规范问题，需逐一修复并清理临时验证文件。
todos:
  - id: fix-felt-arena-and-srs
    content: 修复 FeltArena 今日进度语义与跨日防御、SpacedRepetitionPanel t() 兜底，并删除临时验证测试文件
    status: completed
  - id: unify-difficulty-thresholds
    content: 新建 progress/constants.ts 定义 DIFFICULTY_THRESHOLDS，统一 ProgressPage 判定与 DifficultyIndicator 建议阈值
    status: completed
  - id: fix-progress-page-i18n
    content: ProgressPage 表格 mode 映射与 Intl 日期格式化，同步 zh/en 新增 progress.mode.* key
    status: completed
    dependencies:
      - unify-difficulty-thresholds
  - id: fix-academies-i18n
    content: TheoryHome「分」、TheoryLadder/LevelLadder aria-label 硬编码中文改 i18n，同步双语新增 theory.stats.avgScoreValue / theory.ladder.chapterList / academy.path.lessonList
    status: completed
  - id: tokenize-colors-and-motion
    content: 硬编码 rgba 改 globals.css token（StreakTracker/Dashboard/FirstVisitBanner/AppLayout），内联 motion 字面量统一 motion.ts 单源
    status: completed
  - id: verify-and-changelog
    content: 运行 pnpm verify 全量门禁，同步 docs/CHANGELOG.md 记录修复批次与已知限制
    status: completed
    dependencies:
      - fix-felt-arena-and-srs
      - unify-difficulty-thresholds
      - fix-progress-page-i18n
      - fix-academies-i18n
      - tokenize-colors-and-motion
---

## 需求概述

对 2026-08-10 代码审查发现的遗留问题生成并执行修复计划。审查已覆盖今日全部改动（41 修改 + 12 新增文件），其中 1 个严重 bug（framer-motion `animate="show"` 与 variants 状态名不匹配导致页面不可见）已在审查中修复。本计划修复剩余 9 项问题并清理临时验证文件。

## 修复范围

- 数据正确性：FeltArena「今日进度」语义错误与跨日数据污染、SpacedRepetitionPanel i18n 兜底失效
- 逻辑一致性：ProgressPage 难度判定与 DifficultyIndicator 阈值口径统一
- i18n 完整性：TheoryHome 硬编码「分」、ProgressPage 表格 mode/日期未国际化、LevelLadder/TheoryLadder aria-label 硬编码中文
- 视觉规范：硬编码 rgba 颜色 token 化（light 主题适配）、内联 motion 字面量统一为 motion.ts 单源
- 清理：删除审查期间创建的临时验证测试文件
- 门禁：`pnpm verify`（typecheck + lint + test）全绿，docs/CHANGELOG.md 同步

## 技术方案

纯前端修复，无新依赖、无架构变更。全部遵循项目既有模式：

### 关键决策

1. **跨日防御模式**：FeltArena 复用 MoodTracker/StreakRail 已验证的模式——`emotion.dailyQuestionsDate === getTodayString()` 判断数据是否属于今日，非今日视为 0。`getTodayString` 从 `src/features/progress/utils/streakCalc` 导入（与同深度 StreakTracker 一致）。
2. **难度阈值单源**：新增 `src/features/progress/constants.ts` 定义 `DIFFICULTY_THRESHOLDS`（advanced: 0.85 / intermediate: 0.55 / downshift: 0.5 / upgradeMinSessions: 20）。仅 progress 模块内两处消费，未达 shared 层准入门槛（≥2 模块），故放模块内而非 shared。
3. **i18n 兜底修正**：SpacedRepetitionPanel 的 `t(key) || t(fallback)` 改为 `t(key, { defaultValue: t(fallback) })`——i18next 缺 key 时返回 key 字符串（非空），`||` 短路永不触发。ProgressPage mode 映射参考 `useModuleLabel` 模式（`t(key, { defaultValue: mode })`）。
4. **日期国际化**：formatDate 手写 `M/D HH:mm` 改为 `Intl.DateTimeFormat`，locale 跟随 `i18n.language`。
5. **颜色 token 化**：在 `src/styles/globals.css`（四层色彩 token 唯一权威）新增 brass 透明度 token（如 `--brass-cell-1..4`），替换 StreakTracker getCellColor 等硬编码 rgba；FirstVisitBanner 深色渐变补充 `html[data-theme="light"]` 覆盖。
6. **动效单源**：内联 `transition={{ duration: 0.3, ... }}` 字面量统一替换为 `src/shared/utils/motion.ts` 的 `MOTION_DURATION` / `MOTION_EASE` 常量（DESIGN_LANGUAGE v1.5.0 §8.4 约定）。
7. **已知限制记录**：课程元数据 `level.title`/`chapter.title` 为数据层硬编码中文，英文环境混排属于数据层既有问题，本次仅修复 aria-label 与静态文案，title 混排作为已知限制记录于 CHANGELOG，不做大规模数据层改造。

### 质量保障

- 新增 i18n key 必须 zh/en 同步（`src/i18n/localeParity.test.ts` 守卫）
- 每批修改后运行 `pnpm typecheck`，最终 `pnpm verify` 全量门禁
- 文档同步：`docs/CHANGELOG.md` 记录本次修复批次

## 目录结构

```
project-root/
├── src/
│   ├── __verify_motion_behavior.test.tsx      # [DELETE] 审查期临时验证文件
│   ├── features/
│   │   ├── progress/
│   │   │   ├── constants.ts                   # [NEW] DIFFICULTY_THRESHOLDS 难度阈值常量
│   │   │   ├── components/
│   │   │   │   ├── training/FeltArena.tsx     # [MODIFY] 进度语义修复 + 跨日防御 + defaultValue
│   │   │   │   ├── srs/SpacedRepetitionPanel.tsx  # [MODIFY] t() 兜底修正
│   │   │   │   ├── replay/ProgressPage.tsx    # [MODIFY] 难度判定引用常量 + mode/formatDate i18n
│   │   │   │   ├── stats/DifficultyIndicator.tsx  # [MODIFY] 建议阈值引用共享常量
│   │   │   │   ├── streak/StreakTracker.tsx   # [MODIFY] getCellColor 改 CSS token
│   │   │   │   ├── dashboard/Dashboard.tsx    # [MODIFY] module-card 渐变 token 化
│   │   │   │   └── dashboard/FirstVisitBanner.tsx  # [MODIFY] 渐变 token 化 + light 覆盖
│   │   ├── theory-academy/
│   │   │   ├── components/TheoryHome.tsx      # [MODIFY] 硬编码「分」改 i18n
│   │   │   ├── components/TheoryLadder.tsx    # [MODIFY] aria-label 硬编码中文改 i18n
│   │   │   └── components/TheoryResume.tsx    # [MODIFY] title 混排限制记录
│   │   └── strategy-academy/
│   │       ├── components/LevelLadder.tsx     # [MODIFY] aria-label 硬编码中文改 i18n
│   │       └── components/AcademyResume.tsx   # [MODIFY] title 混排限制记录
│   ├── i18n/
│   │   └── locales/{zh,en}.json               # [MODIFY] 新增 progress.mode.* / theory.stats.avgScoreValue / theory.ladder.chapterList / academy.path.lessonList
│   ├── layouts/AppLayout.tsx                  # [MODIFY] streak 徽章 border token 化
│   └── styles/globals.css                     # [MODIFY] brass 透明度 token + light 覆盖
└── docs/CHANGELOG.md                          # [MODIFY] 记录修复批次与已知限制
```

## 验证步骤

1. 每批修改后 `node node_modules/typescript/bin/tsc --noEmit`
2. 全部完成后 `pnpm verify`（typecheck + lint + test 串行门禁）
3. 确认 `src/__verify_motion_behavior.test.tsx` 已删除（不随测试集运行）