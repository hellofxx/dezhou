/**
 * 功能微文字字号下限棘轮守卫（只降不升）。
 *
 * 依据：课程阅读页改进计划 Fix 5 / DESIGN.md §3.3、§13.3.3（2026-11 修订）：
 * 承载功能信息（导航标签 / 选项字母 / 图例 / 数值 / 徽章计数 / 别名）的微文字一律 ≥11px；
 * 仅装饰性分组标签（eyebrow / aria-hidden 序号 / 例N / kicker）允许保留 9–10px。
 *
 * 扫描面：src 下非测试 `.tsx`（排除 guards / test-utils），匹配 `text-[Npx]` 与
 * `!text-[Npx]`（N < 11，含响应式 / 状态前缀与 arbitrary value 槽）。
 * BASELINE 为 2026-11-22 main 合流时点的逐文件实测计数（含两院课程阅读改造与 main
 * 课程枢纽 / 学习路径新增组件）：两院功能性微文字已升 11px，剩余条目为装饰性
 * eyebrow / 序号 / 徽章与既有模块遗留。只降不升：
 * - 任一文件实际计数 > baseline → sub-11px 回潮，失败
 * - baseline 未登记的新文件出现 sub-11px → 失败（功能性文字须升 11px；
 *   确属装饰例外须先在 DESIGN.md 登记依据，再登记 baseline）
 * - 实际计数 < baseline / 条目清零 / 文件消失 → 失败，须同步下调或删除条目
 *   （双向校验，对齐 duplicateLiteralRatchet；禁止用放宽阈值“修复”）
 *
 * CSS 侧 9px 装饰类不在 tsx 扫描面，登记于此作说明（不计入 baseline）：
 * - styles/components-education.css `.section-number`（章节序号装饰）
 * - styles/components-settings.css `.level-kicker` / `.last-training-badge`（等级 kicker / 徽章装饰）
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const ROOT = path.resolve(SRC_DIR, '..');

/** 逐文件 sub-11px 出现次数基线（实测 inventory 生成；只降不升，低于实测须同步下调） */
const BASELINE: Readonly<Record<string, number>> = {
  'src/features/gto-simulator/components/ActionSelector.tsx': 4,
  'src/features/gto-simulator/components/DecisionTree.tsx': 6,
  'src/features/gto-simulator/components/GTOFeedback.tsx': 13,
  'src/features/gto-simulator/components/GTOSessionPage.tsx': 1,
  'src/features/gto-simulator/components/StrategyMatrix.tsx': 4,
  'src/features/hand-history/components/ActionLog.tsx': 1,
  'src/features/hand-history/components/GtoDeviationPanel.tsx': 3,
  'src/features/hand-history/components/HandHistoryList.tsx': 2,
  'src/features/hand-history/components/HandStatsPanel.tsx': 1,
  'src/features/hand-history/components/PlayerSeats.tsx': 1,
  'src/features/hand-history/components/StreetTimeline.tsx': 1,
  'src/features/help-center/components/HelpArticle.tsx': 1,
  'src/features/help-center/components/HelpHero.tsx': 1,
  'src/features/progress/components/achievement/AchievementBadges.tsx': 2,
  'src/features/progress/components/achievement/AchievementWall.tsx': 2,
  'src/features/progress/components/achievement/Leaderboard.tsx': 1,
  'src/features/progress/components/dashboard/ModuleGrid.tsx': 2,
  'src/features/progress/components/dashboard/ModuleStatsPanel.tsx': 1,
  'src/features/progress/components/path/JourneyHome.tsx': 1,
  'src/features/progress/components/path/JourneyTrack.tsx': 1,
  'src/features/progress/components/replay/ProgressReplay.tsx': 4,
  'src/features/progress/components/replay/RecentTrainingPanel.tsx': 3,
  'src/features/progress/components/settings/GameVariantSelector.tsx': 3,
  'src/features/progress/components/settings/SettingsPage.tsx': 1,
  'src/features/progress/components/srs/ReviewSession.tsx': 3,
  'src/features/progress/components/srs/SpacedRepetitionPanel.tsx': 4,
  'src/features/progress/components/streak/StreakRail.tsx': 4,
  'src/features/progress/components/streak/StreakTracker.tsx': 2,
  'src/features/progress/components/training/DailyGoalCard.tsx': 1,
  'src/features/progress/components/training/DailyTrainingPlan.tsx': 3,
  'src/features/puzzle-trainer/components/PuzzleCard.tsx': 1,
  'src/features/puzzle-trainer/components/PuzzleCardChrome.tsx': 1,
  'src/features/puzzle-trainer/components/PuzzleCardFeedback.tsx': 2,
  'src/features/puzzle-trainer/components/PuzzleHome.tsx': 3,
  'src/features/range-trainer/components/QuizTimer.tsx': 1,
  'src/features/range-trainer/components/RangeGrid.tsx': 2,
  'src/features/strategy-academy/components/AcademyHome.tsx': 1,
  'src/features/strategy-academy/components/BasicsIntro.tsx': 1,
  'src/features/strategy-academy/components/ConceptGraphView.tsx': 1,
  'src/features/strategy-academy/components/CourseDoneView.tsx': 1,
  'src/features/strategy-academy/components/CourseStudyRail.tsx': 1,
  'src/features/strategy-academy/components/HandExample.tsx': 4,
  'src/features/strategy-academy/components/hub/CourseHubHeader.tsx': 1,
  'src/features/strategy-academy/components/hub/CourseStageCard.tsx': 3,
  'src/features/strategy-academy/components/LearningTracksView.tsx': 2,
  'src/features/strategy-academy/components/LessonIntroCard.tsx': 1,
  'src/features/strategy-academy/components/LevelCard.tsx': 1,
  'src/features/strategy-academy/components/LevelLadder.tsx': 4,
  'src/features/strategy-academy/components/PracticeDrill.tsx': 4,
  'src/features/strategy-academy/components/PredictionPrompt.tsx': 1,
  'src/features/theory-academy/components/TheoryBibliography.tsx': 1,
  'src/features/theory-academy/components/TheoryChapterChip.tsx': 2,
  'src/features/theory-academy/components/TheoryChapterHeader.tsx': 1,
  'src/features/theory-academy/components/TheoryChapterRail.tsx': 2,
  'src/features/theory-academy/components/TheoryGlossary.tsx': 1,
  'src/features/theory-academy/components/TheoryLadder.tsx': 6,
  'src/features/theory-academy/components/TheoryMasteryCard.tsx': 1,
  'src/features/theory-academy/components/TheoryRecommendationCard.tsx': 1,
  'src/features/theory-academy/components/TheoryResume.tsx': 1,
  'src/features/theory-academy/components/TheoryRichBlock.tsx': 2,
  'src/features/theory-academy/components/TheorySupplementalCard.tsx': 1,
  'src/layouts/AppLayout.tsx': 3,
  'src/layouts/SidebarFooter.tsx': 3,
  'src/shared/components/academy/AcademySearchShell.tsx': 1,
  'src/shared/components/data-display/StatCard.tsx': 2,
  'src/shared/components/data-display/StatPair.tsx': 1,
  'src/shared/components/feedback/ComparisonView.tsx': 2,
  'src/shared/components/quiz/QuizCard.tsx': 1,
};

/** `text-[Npx]` / `!text-[Npx]`（含 md: / hover: 等前缀，子串匹配天然覆盖） */
const FONT_SIZE_RE = /!?text-\[(\d+(?:\.\d+)?)px\]/g;
const FLOOR_PX = 11;

function walk(dirPath: string, collected: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'guards', 'test-utils'].includes(entry.name)) continue;
      walk(full, collected);
    } else if (/\.tsx$/.test(entry.name) && !/\.test\.tsx$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function countSubFloor(file: string): number {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  let count = 0;
  for (const match of content.matchAll(FONT_SIZE_RE)) {
    if (Number(match[1]) < FLOOR_PX) count += 1;
  }
  return count;
}

describe('功能微文字字号下限棘轮（只降不升）', () => {
  const files = walk(SRC_DIR);
  const actual = new Map<string, number>();
  for (const full of files) {
    const file = toPosix(path.relative(ROOT, full));
    const count = countSubFloor(file);
    if (count > 0) actual.set(file, count);
  }

  it('扫描面自检：覆盖源码 tsx 文件且基线非空', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(Object.keys(BASELINE).length).toBeGreaterThan(50);
  });

  it('任一文件不得超过基线；未登记的新文件不得出现 sub-11px', () => {
    const violations: string[] = [];
    for (const [file, count] of actual) {
      const baseline = BASELINE[file];
      if (baseline === undefined) {
        violations.push(`${file} (${count}) → 未登记 baseline 的新文件出现 sub-11px 微文字`);
      } else if (count > baseline) {
        violations.push(`${file} (${count}) → 基线 ${baseline}，sub-11px 回潮`);
      }
    }

    expect(
      violations,
      [
        '[font-size-floor] 功能性微文字一律 ≥11px（DESIGN.md §3.3 / §13.3.3）。',
        '装饰性例外须先在 DESIGN.md 登记依据，再登记 baseline；禁止上调既有基线。',
        ...violations,
      ].join('\n')
    ).toEqual([]);
  });

  it('基线双向校验：低于实测 / 清零 / 文件消失的条目必须同步下调或删除', () => {
    const stale: string[] = [];
    for (const [file, baseline] of Object.entries(BASELINE)) {
      const count = actual.get(file) ?? 0;
      if (!fs.existsSync(path.join(ROOT, file))) {
        stale.push(`${file} → 文件已消失，须删除 baseline 条目（登记 ${baseline}）`);
      } else if (count < baseline) {
        stale.push(`${file} → 实测 ${count} < 基线 ${baseline}，棘轮只降不升，须同步下调 baseline`);
      }
    }

    expect(
      stale,
      [
        '[font-size-floor] 基线与实测不一致（双向校验，对齐 duplicateLiteralRatchet）。',
        ...stale,
      ].join('\n')
    ).toEqual([]);
  });
});